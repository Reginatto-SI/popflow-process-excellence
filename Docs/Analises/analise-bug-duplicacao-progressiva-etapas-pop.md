# Análise — bug crítico de duplicação progressiva de etapas ao editar POP

## POP investigado

- Rota: `/pops/eec089a1-a7ca-4fc0-adba-879dc92b72b4`
- Data da análise: 2026-05-18

## 1. Causa-raiz encontrada

A causa raiz no código era o fluxo de edição em `useUpdatePop`: o salvamento fazia `delete -> insert` para recriar mídias e etapas da versão ativa, mas os dois `delete()` eram executados sem capturar `error` e sem conferir se as linhas antigas realmente foram removidas.

Isso deixava o fluxo vulnerável a dois cenários de integridade:

1. Se o `DELETE` de `pop_etapas` fosse bloqueado por RLS, permissões ou FK, o erro poderia ser ignorado e o `INSERT` seguinte criaria novas etapas na mesma `pop_versao_id` e `ordem`.
2. Se a migration de índice único não tivesse criado `idx_pop_etapas_versao_ordem_unique` por existirem duplicatas antigas, o banco continuaria aceitando novas duplicatas por `pop_versao_id + ordem`.

Também há um risco operacional adicional: `pop_etapas.id` é referenciado por `execucao_etapas.etapa_id` com restrição de exclusão no fluxo de execução. Portanto, o padrão `delete -> insert` pode falhar em POPs que já foram usados em execução. Sem tratamento explícito, essa falha é exatamente o tipo de condição que pode causar duplicação progressiva.

## 2. Duplicatas reais no banco ou apenas frontend

Não foi possível confirmar diretamente os dados reais da instância remota a partir deste ambiente. A tentativa de consulta via REST Supabase com a URL e a chave pública configuradas no projeto foi bloqueada pelo ambiente com:

```txt
curl: (56) CONNECT tunnel failed, response 403
HTTP/1.1 403 Forbidden
```

Com base no comportamento relatado — a quantidade de etapas aumenta a cada salvamento — o sintoma é compatível com duplicatas reais em `public.pop_etapas`, não apenas duplicação visual no React. A deduplicação em `usePop` continua existindo apenas como fallback visual e não é considerada a correção principal.

Consulta obrigatória para confirmar no banco de produção:

```sql
select
  p.id as pop_id,
  p.titulo as pop_titulo,
  p.versao_ativa_id,
  e.id as etapa_id,
  e.pop_versao_id,
  e.ordem,
  e.titulo,
  e.descricao,
  e.created_at,
  e.updated_at
from public.pops p
join public.pop_etapas e on e.pop_versao_id = p.versao_ativa_id
where p.id = 'eec089a1-a7ca-4fc0-adba-879dc92b72b4'
order by e.ordem, e.created_at;
```

Consulta geral para confirmar duplicidade real por versão/ordem:

```sql
select
  pop_versao_id,
  ordem,
  count(*) as quantidade
from public.pop_etapas
group by pop_versao_id, ordem
having count(*) > 1
order by quantidade desc, pop_versao_id, ordem;
```

## 3. Resultado da verificação do índice único

No repositório existe a migration `supabase/migrations/20260518130000_add_unique_pop_etapas_ordem.sql`, que tenta criar:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_pop_etapas_versao_ordem_unique
  ON public.pop_etapas(pop_versao_id, ordem);
```

A própria migration documenta o comportamento seguro: se encontrar duplicatas antigas por `pop_versao_id + ordem`, ela emite `NOTICE` e não cria o índice. Portanto, se o ambiente já tinha duplicatas, é provável que o índice não exista ainda.

Consulta obrigatória para validar no banco:

```sql
select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'pop_etapas'
  and indexname = 'idx_pop_etapas_versao_ordem_unique';
```

Correção adicional aplicada nesta análise: foi criada uma migration com trigger de integridade (`prevent_duplicate_pop_etapas_ordem`) que impede novos `INSERT`/`UPDATE` duplicados em `public.pop_etapas` mesmo quando duplicatas antigas ainda impedem a criação do índice único. Essa trigger não apaga dados antigos; ela apenas bloqueia novas duplicações.

## 4. Resultado da verificação das policies/RLS de DELETE

As migrations existentes já possuem policies de DELETE para `pop_etapas` e `pop_midias`:

- Migration inicial: `supabase/migrations/20260502203952_ceaae078-a220-4c24-8412-7243a4dd8d09.sql`
  - `pop_etapas: delete da empresa` com `empresa_id = public.current_empresa_id()`.
  - `pop_midias: delete da empresa` com `empresa_id = public.current_empresa_id()`.
- Migration posterior: `supabase/migrations/20260513120000_add_pops_arquivado.sql`
  - Recria as policies de DELETE exigindo também `public.current_user_can_manage_pops()`.
  - Roles autorizadas pela função: `admin`, `gestor`, `criador`, `developer`.

Conclusão: pelo código versionado, DELETE não está sem policy. Porém, a policy atual é restritiva e corretamente multi-tenant. Se o usuário autenticado não estiver na empresa ativa correta ou não tiver uma das roles autorizadas, o DELETE pode não remover linhas. Antes da correção, esse caso não era detectado pelo hook.

Consulta recomendada para conferir policies aplicadas no banco:

```sql
select schemaname, tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('pop_etapas', 'pop_midias')
order by tablename, policyname;
```

## 5. Se o DELETE estava falhando ou sendo ignorado

No código anterior, o DELETE era ignorado:

```ts
await supabase.from("pop_midias").delete().eq("pop_versao_id", pop.versao_ativa_id);
await supabase.from("pop_etapas").delete().eq("pop_versao_id", pop.versao_ativa_id);
```

O retorno de `error` não era capturado. Também não havia conferência da quantidade de linhas removidas. Assim, falhas por RLS, FK ou permissões podiam passar despercebidas antes do `INSERT` de novas etapas.

A correção agora captura explicitamente os erros e usa `.select("id")` após o `delete()` para confirmar se a quantidade removida bate com a quantidade carregada antes do salvamento. Se as etapas antigas permanecerem, o fluxo para antes do insert.

## 6. Arquivos alterados

- `src/hooks/usePops.ts`
- `supabase/migrations/20260518160000_prevent_duplicate_pop_etapas_ordem.sql`
- `Docs/Analises/analise-bug-duplicacao-progressiva-etapas-pop.md`

## 7. Correção aplicada

### Código frontend/hook

No `useUpdatePop`, os deletes agora:

1. Capturam `deleteEtapasError` e `deleteMidiasError` explicitamente.
2. Retornam os IDs deletados com `.select("id")`.
3. Comparam a quantidade removida com a quantidade previamente carregada.
4. Interrompem o salvamento antes do insert se o banco não removeu todas as linhas esperadas.

A ordem foi refinada para validar vínculos de execução antes de qualquer exclusão destrutiva e, depois, remover mídias antes de etapas. Isso respeita as dependências por FK e impede que POPs já executados sejam alterados pelo fluxo destrutivo `delete -> insert`.

### Banco/migration

Foi adicionada uma trigger de barreira:

```sql
CREATE TRIGGER prevent_duplicate_pop_etapas_ordem
  BEFORE INSERT OR UPDATE OF pop_versao_id, ordem ON public.pop_etapas
  FOR EACH ROW EXECUTE FUNCTION public.tg_prevent_duplicate_pop_etapas_ordem();
```

Ela bloqueia qualquer nova linha que tente repetir a mesma combinação `pop_versao_id + ordem`. Essa proteção é complementar ao índice único e serve especialmente para ambientes onde o índice não pôde ser criado porque já existiam duplicatas antigas.

## 8. Limpeza do POP afetado

Nenhuma limpeza automática foi aplicada. Isso é intencional: apagar etapas duplicadas sem verificar vínculos pode quebrar mídias ou execuções.

A limpeza do POP afetado só deve ser feita após confirmar:

1. Quais linhas são duplicadas.
2. Qual etapa deve permanecer.
3. Se há mídias vinculadas a cada `etapa_id`.
4. Se há execuções em `execucao_etapas` vinculadas a cada `etapa_id`.

Se houver execução vinculada a uma etapa duplicada, não apagar essa etapa sem uma decisão operacional explícita. A recomendação é preservar a etapa mais antiga, ou a que possui mídias/execuções, ou a mais completa quando houver divergência de conteúdo.

## 9. SQL seguro recomendado para limpeza

### 9.1. Verificar mídias por etapa do POP

```sql
select etapa_id, count(*) as qtd
from public.pop_midias
where etapa_id in (
  select e.id
  from public.pop_etapas e
  join public.pops p on p.versao_ativa_id = e.pop_versao_id
  where p.id = 'eec089a1-a7ca-4fc0-adba-879dc92b72b4'
)
group by etapa_id;
```

### 9.2. Verificar execuções por etapa do POP, se a tabela existir

```sql
select *
from public.execucao_etapas
where etapa_id in (
  select e.id
  from public.pop_etapas e
  join public.pops p on p.versao_ativa_id = e.pop_versao_id
  where p.id = 'eec089a1-a7ca-4fc0-adba-879dc92b72b4'
);
```

### 9.3. Listar candidatas e escolher a etapa preservada

```sql
with etapas_pop as (
  select
    e.*,
    count(m.id) as qtd_midias,
    count(ex.id) as qtd_execucoes,
    row_number() over (
      partition by e.pop_versao_id, e.ordem
      order by count(ex.id) desc, count(m.id) desc, e.created_at asc, e.id asc
    ) as prioridade_preservacao
  from public.pop_etapas e
  join public.pops p on p.versao_ativa_id = e.pop_versao_id
  left join public.pop_midias m on m.etapa_id = e.id
  left join public.execucao_etapas ex on ex.etapa_id = e.id
  where p.id = 'eec089a1-a7ca-4fc0-adba-879dc92b72b4'
  group by e.id
)
select *
from etapas_pop
order by ordem, prioridade_preservacao, created_at;
```

### 9.4. Exemplo de limpeza manual após revisão

Substitua os UUIDs manualmente. Não execute sem revisar o resultado das consultas anteriores.

```sql
begin;

-- 1) Reapontar mídias da etapa duplicada para a etapa preservada, se aplicável.
update public.pop_midias
set etapa_id = 'UUID_ETAPA_PRESERVADA'
where etapa_id = 'UUID_ETAPA_DUPLICADA_SEM_EXECUCAO';

-- 2) Apagar somente duplicata sem execução vinculada.
delete from public.pop_etapas e
where e.id = 'UUID_ETAPA_DUPLICADA_SEM_EXECUCAO'
  and not exists (
    select 1
    from public.execucao_etapas ex
    where ex.etapa_id = e.id
  );

-- 3) Validar que não restou duplicidade na versão.
select pop_versao_id, ordem, count(*) as quantidade
from public.pop_etapas
group by pop_versao_id, ordem
having count(*) > 1;

commit;
```

### 9.5. Criar índice único depois da limpeza

```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_pop_etapas_versao_ordem_unique
  ON public.pop_etapas(pop_versao_id, ordem);
```

## 10. Como validar manualmente

1. Rodar a consulta do POP afetado e registrar quantas etapas reais existem na versão ativa.
2. Rodar a consulta de duplicatas por `pop_versao_id + ordem`.
3. Verificar se `idx_pop_etapas_versao_ordem_unique` existe em `pg_indexes`.
4. Verificar as policies em `pg_policies` para `pop_etapas` e `pop_midias`.
5. Abrir `/pops/eec089a1-a7ca-4fc0-adba-879dc92b72b4`.
6. Editar o POP e salvar.
7. Confirmar no banco que a quantidade de etapas não aumentou.
8. Editar novamente e salvar.
9. Confirmar novamente que a quantidade de etapas não aumentou.
10. Criar uma nova etapa intencionalmente e confirmar que apenas uma nova linha foi criada.
11. Remover uma etapa e confirmar que ela foi removida de verdade quando não houver vínculo de execução bloqueando a exclusão.
12. Confirmar que a trigger `prevent_duplicate_pop_etapas_ordem` existe.
13. Depois da limpeza de duplicatas antigas, confirmar que o índice único existe.

## 11. Observações finais

- A correção não altera layout visual.
- A correção não mexe no modal de atividades.
- A correção não desativa RLS.
- A correção não cria policy ampla.
- A correção não apaga dados automaticamente.
- A deduplicação visual permanece apenas como fallback de leitura; a proteção principal agora está no salvamento e no banco.


## 12. Refinamento da ordem de exclusão e risco de salvamento parcial

### 12.1. Foreign keys envolvendo `pop_etapas`

As migrations do projeto indicam os seguintes vínculos com `public.pop_etapas(id)`:

1. `public.pop_midias.etapa_id -> public.pop_etapas.id` com `ON DELETE SET NULL`. Esse vínculo não bloqueia a exclusão de etapas; se a etapa for excluída, a mídia fica com `etapa_id = null`. Mesmo assim, no fluxo de recriação do POP a ordem mais segura é remover as mídias antigas antes das etapas antigas, porque as mídias serão recriadas e religadas às novas etapas por ordem.
2. `public.execucao_etapas.etapa_id -> public.pop_etapas.id` com `ON DELETE RESTRICT`. Esse vínculo bloqueia a exclusão de etapas que já foram usadas em execução. Por isso, o fluxo destrutivo `delete -> insert` não pode continuar quando houver execução vinculada.
3. `public.base_conhecimento.etapa_id -> public.pop_etapas.id` com `ON DELETE SET NULL`. Esse vínculo não bloqueia a exclusão de etapas, mas reforça que a limpeza manual de duplicatas deve considerar referências operacionais antes de remover dados.

### 12.2. `pop_midias` bloqueia exclusão de etapas?

Não. A FK de `pop_midias.etapa_id` usa `ON DELETE SET NULL`, então ela não bloqueia a exclusão da etapa. Apesar disso, a ordem adotada no hook passou a ser:

1. validar se há `execucao_etapas` vinculadas às etapas antigas;
2. remover `pop_midias` antigas da versão ativa;
3. remover `pop_etapas` antigas da versão ativa;
4. inserir as novas etapas;
5. inserir as novas mídias vinculando-as às etapas recém-criadas por `ordem`.

Essa ordem evita apagar etapas antes de remover registros dependentes que serão recriados no mesmo salvamento.

### 12.3. `execucao_etapas` bloqueia exclusão de etapas?

Sim. A FK de `execucao_etapas.etapa_id` usa `ON DELETE RESTRICT`, então a exclusão da etapa falharia se já houver execução vinculada. O código agora consulta `execucao_etapas` com os IDs das etapas antigas antes de qualquer delete destrutivo. Se existir ao menos uma execução vinculada, o salvamento é abortado com a mensagem:

```txt
Este POP já possui execuções vinculadas. Para alterar etapas, será necessário criar uma nova versão do POP.
```

Com isso, o sistema não remove mídias nem etapas de POPs que já possuem histórico de execução.

### 12.4. Risco por falta de transação

O fluxo continua usando chamadas separadas do Supabase no frontend e, portanto, ainda não é uma transação única de banco. A solução aplicada foi mantida mínima e segura para o escopo atual:

- valida bloqueio de execução antes de qualquer exclusão destrutiva;
- captura erro em todos os deletes;
- confere a quantidade de linhas removidas antes de inserir novas etapas;
- atualiza os dados gerais do POP somente depois das exclusões e inserções de etapas/mídias passarem sem erro;
- mantém a trigger `prevent_duplicate_pop_etapas_ordem` como barreira no banco contra novas duplicatas;
- não implementa versionamento completo nem uma nova arquitetura de persistência.

Ainda existe risco residual de falha entre chamadas em situações raras, por exemplo queda de rede depois de remover mídias e antes de inserir as novas linhas. A correção transacional ideal seria encapsular o salvamento completo em uma RPC SQL/PLpgSQL, mas isso exigiria mover também diffs de atividades, payloads de etapas/mídias e regras de atualização para o banco. Para evitar refatoração ampla, esta etapa manteve a solução no hook com validações preventivas e barreira de integridade no banco.

### 12.5. Validação manual complementar

Além da validação já listada, após este refinamento confirmar:

1. POP sem execução vinculada salva repetidas vezes sem duplicar etapas.
2. Mídias continuam recriadas e vinculadas às etapas corretas após o salvamento.
3. POP com execução vinculada não apaga mídias/etapas e exibe erro claro solicitando nova versão.
4. A trigger `prevent_duplicate_pop_etapas_ordem` continua criada.
5. Depois da limpeza manual de duplicatas antigas, o índice `idx_pop_etapas_versao_ordem_unique` pode ser criado.

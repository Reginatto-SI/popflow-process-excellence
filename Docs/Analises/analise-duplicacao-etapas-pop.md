# Análise — duplicação de etapas no detalhe do POP

## 1. Diagnóstico da causa encontrada

A rota `/pops/:id` usa a tela `PopDetail` e renderiza as etapas vindas de `usePop(id)`. A consulta carrega o POP, a `versao_ativa_id`, a versão ativa e depois busca `pop_etapas` exclusivamente por `pop_versao_id` da versão ativa. Não foi encontrado `map` duplicado, concatenação de arrays de etapas, fallback por `pop_id` ou mistura entre etapas de POP e versão na tela de detalhe.

A causa mais provável no fluxo atual é salvamento concorrente no formulário de criação/edição: `handleSave` podia ser acionado novamente antes de o estado `isPending` do React Query desabilitar os botões. Em edição, duas chamadas simultâneas para `useUpdatePop` podem executar o ciclo `delete -> insert` na mesma `versao_ativa_id`; se as duas chamadas passarem pela exclusão antes das inserções, ambas inserem o mesmo payload e geram duas linhas iguais em `pop_etapas`, com IDs diferentes.

## 2. Evidência: banco, consulta ou renderização

### Dados reais salvos

Não foi possível consultar diretamente os dados reais da instância remota a partir deste ambiente. A tentativa de acessar o REST do Supabase com a URL e chave pública do projeto foi bloqueada no túnel de rede com `HTTP/1.1 403 Forbidden` / `CONNECT tunnel failed`.

Consulta manual recomendada para confirmar o POP informado:

```sql
select id, titulo, versao_ativa_id
from public.pops
where id = 'eec089a1-a7ca-4fc0-adba-879dc92b72b4';

select e.id,
       e.pop_versao_id,
       e.ordem,
       e.titulo,
       e.tempo_estimado,
       e.pre_requisito,
       e.resultado_esperado,
       e.erro_comum,
       e.created_at
from public.pop_etapas e
join public.pops p on p.versao_ativa_id = e.pop_versao_id
where p.id = 'eec089a1-a7ca-4fc0-adba-879dc92b72b4'
order by e.ordem, e.created_at;
```

Se essa consulta retornar duas linhas com IDs diferentes e os mesmos campos, trata-se de dado duplicado antigo no banco. Se retornar apenas uma linha, a tela deve exibir apenas uma etapa após a correção defensiva de carregamento.

### Consulta/carregamento

A tela de detalhe usa somente `pop.versao_ativa.etapas`. O hook `usePop` busca etapas com `eq("pop_versao_id", v.id)`, ou seja, pela versão ativa, não por `pop_id`. A correção adicionou ordenação estável por `created_at` e deduplicação lógica no carregamento para impedir que duplicatas históricas idênticas sejam exibidas duas vezes.

### Renderização

A tela `PopDetail` possui um único `etapas.map(...)` para renderizar cards de etapas. Não havia renderização duplicada da mesma lista, nem concatenação com mídia/versão. As mídias inline continuam sendo resolvidas dentro da descrição e as mídias vinculadas continuam listadas no bloco próprio.

### Criação/edição

Não há `useEffect` salvando etapas automaticamente. O upload e a mídia inline alteram apenas estado local de mídias/descrição até o usuário salvar. O ponto vulnerável era o duplo acionamento manual de `handleSave` antes de o `disabled` refletir `isPending`.

### Versionamento

O projeto já possui `pops`, `pop_versoes`, `pop_etapas` e `pop_midias`. As etapas pertencem a `pop_versoes` por `pop_versao_id`, e o detalhe deve exibir as etapas da versão ativa (`pops.versao_ativa_id`). A correção preserva essa arquitetura e não introduz novo fluxo de versionamento.

## 3. Arquivos alterados

- `src/pages/PopCreateEdit.tsx`
- `src/hooks/usePops.ts`
- `src/test/usePops.test.ts`
- `Docs/Analises/analise-duplicacao-etapas-pop.md`

## 4. Correção aplicada

1. Foi adicionado um bloqueio síncrono (`saveInProgressRef`) no `handleSave`, além do estado visual `isSaving`, para impedir duplo clique/dupla chamada antes da atualização do `disabled`.
2. Os botões de salvar passaram a considerar `isSaving || createPop.isPending || updatePop.isPending`.
3. O carregamento da versão ativa passou a ordenar etapas por `ordem` e `created_at`.
4. Foi adicionada uma camada defensiva de deduplicação lógica das etapas carregadas. Ela mantém a primeira etapa quando duas linhas têm a mesma versão, ordem, título, descrição, tempo, pré-requisito, resultado esperado, erro comum e checklist. Essa camada não altera nem apaga dados no banco; ela apenas evita duplicação visual de dados históricos idênticos.
5. Foram adicionados testes unitários cobrindo a deduplicação lógica.

## 5. Como validar manualmente

1. Acessar `/pops/eec089a1-a7ca-4fc0-adba-879dc92b72b4`.
2. Confirmar que `Etapa 1 — Consultando certificado` aparece apenas uma vez.
3. Confirmar que o conteúdo da etapa permanece visível.
4. Confirmar que chips/links de mídias inline continuam abrindo o viewer.
5. Confirmar que mídias vinculadas continuam aparecendo no bloco da etapa.
6. Criar um novo POP com uma única etapa e clicar rapidamente em salvar mais de uma vez; deve ser criado apenas um fluxo de salvamento e a tela de detalhe deve mostrar uma etapa.
7. Editar um POP existente com uma única etapa e clicar rapidamente em salvar mais de uma vez; ao voltar ao detalhe, deve continuar mostrando uma etapa.
8. Rodar a consulta SQL acima para identificar se existem linhas antigas duplicadas no banco.

## 6. Dados duplicados antigos que precisam de limpeza manual

Como a consulta direta ao banco remoto foi bloqueada neste ambiente, não é possível afirmar o ID exato de uma eventual linha antiga duplicada do POP `eec089a1-a7ca-4fc0-adba-879dc92b72b4`.

Se a consulta SQL retornar duas etapas com IDs diferentes, mesma `pop_versao_id`, mesma `ordem = 1` e conteúdo igual, uma delas é candidata à limpeza manual. A recomendação é remover manualmente apenas após confirmar também se não há registros dependentes em `execucao_etapas` ou outras tabelas operacionais vinculadas ao `etapa_id`.

## 7. Refinamento de integridade

### Constraint atual

A migration original que cria `public.pop_etapas` não define `UNIQUE (pop_versao_id, ordem)`. Ela cria apenas os índices `idx_pop_etapas_versao` e `idx_pop_etapas_empresa`, portanto antes deste refinamento não havia barreira estrutural para impedir duas etapas com a mesma ordem dentro da mesma versão.

### Nova proteção criada

Foi adicionada a migration `supabase/migrations/20260518130000_add_unique_pop_etapas_ordem.sql` para criar o índice único `idx_pop_etapas_versao_ordem_unique` em `(pop_versao_id, ordem)` quando não houver duplicatas antigas.

A migration é propositalmente segura: se encontrar duplicatas já existentes, ela não apaga dados e não falha a aplicação da migration; apenas emite um `NOTICE` informando que o índice não foi criado. Nesse cenário, a limpeza manual deve acontecer primeiro e o índice deve ser criado depois com:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_pop_etapas_versao_ordem_unique
  ON public.pop_etapas(pop_versao_id, ordem);
```

### Consulta para identificar duplicatas existentes por versão e ordem

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

### Consulta específica para o POP afetado

```sql
select
  p.id as pop_id,
  p.titulo as pop_titulo,
  e.pop_versao_id,
  e.ordem,
  count(*) as quantidade
from public.pop_etapas e
join public.pops p on p.versao_ativa_id = e.pop_versao_id
where p.id = 'eec089a1-a7ca-4fc0-adba-879dc92b72b4'
group by p.id, p.titulo, e.pop_versao_id, e.ordem
having count(*) > 1;
```

### Validação do refinamento

1. Rodar a consulta geral acima para verificar se ainda existem duplicatas históricas por `pop_versao_id + ordem`.
2. Rodar a consulta específica do POP `eec089a1-a7ca-4fc0-adba-879dc92b72b4`.
3. Verificar se o índice foi criado:

```sql
select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'pop_etapas'
  and indexname = 'idx_pop_etapas_versao_ordem_unique';
```

4. Criar e editar POPs com uma etapa e confirmar que o payload de etapas não envia ordens duplicadas. O frontend e os hooks de persistência agora normalizam a ordem das etapas antes do envio/insert.

### Cuidados antes de limpar dados antigos

Não remover linhas antigas automaticamente. Antes de excluir uma etapa duplicada, confirmar:

- se há registros em `execucao_etapas` vinculados ao `etapa_id`;
- se há mídias em `pop_midias.etapa_id` apontando para a etapa candidata à remoção;
- se há conteúdos da Base de Conhecimento ou histórico operacional apontando para a etapa;
- qual das linhas duplicadas deve permanecer, preferencialmente preservando a etapa referenciada por execuções/mídias.

Enquanto a limpeza manual não for feita em ambientes com duplicatas antigas, a deduplicação visual em `usePop` continua evitando poluição na tela, mas ela é apenas fallback de leitura e não substitui a proteção de integridade no salvamento/banco.

# Análise — Exclusão de POPs na tela `/pops`

## Diagnóstico encontrado

- A exclusão é disparada na tela `src/pages/PopsList.tsx`, pelo item `Excluir` do menu de ações de cada POP.
- Antes da correção, a função `handleDelete` usava `confirm()` nativo e chamava diretamente a mutation `useDeletePop`.
- A mutation `useDeletePop`, em `src/hooks/usePops.ts`, executava apenas `supabase.from("pops").delete().eq("id", popId)`.
- Como `pops -> pop_versoes -> pop_etapas` possui cascata, o delete do POP raiz tentava remover etapas automaticamente.
- A tabela `execucao_etapas` possui FK `etapa_id` para `pop_etapas(id)` com `ON DELETE RESTRICT`; por isso, quando havia histórico, o banco bloqueava a exclusão das etapas e retornava o erro técnico de foreign key.
- O fluxo antigo não validava vínculos com `execucoes` nem com `execucao_etapas` antes de tentar apagar o POP.

## Tabelas envolvidas

- `pops`: POP raiz, metadados, `empresa_id`, `owner_id`, `versao_ativa_id`.
- `pop_versoes`: versões/snapshots do POP, relacionadas a `pops(id)`.
- `pop_etapas`: etapas versionadas, relacionadas a `pop_versoes(id)`.
- `pop_midias`: mídias/anexos versionados, com referência opcional a `pop_etapas(id)`.
- `execucoes`: histórico de execução, com `pop_id`, `pop_versao_id` e `empresa_id`.
- `execucao_etapas`: tracking de etapas executadas, com `etapa_id` apontando para `pop_etapas(id)` via `ON DELETE RESTRICT`.

## Campos de exclusão lógica encontrados

- Não havia campo específico de exclusão lógica em `pops` (`deleted_at`, `arquivado` ou equivalente).
- Existiam campos de status em versões (`pop_versoes.status`) e status de execução (`execucoes.status`), mas eles não representam arquivamento/exclusão lógica do POP raiz.

## RLS, multiempresa e permissões

- As tabelas de POP e execução usam RLS por `empresa_id = public.current_empresa_id()`.
- A correção manteve RLS habilitado e todas as consultas/alterações do fluxo de exclusão física/arquivamento passam pelo `empresa_id` do POP encontrado no tenant atual.
- A migration adiciona a função `public.current_user_can_manage_pops()` e reforça as policies de `UPDATE`/`DELETE` das tabelas de POP para permitir gestão apenas para `admin`, `gestor`, `criador` e `developer`.
- O frontend também valida o papel do usuário antes de executar a ação, para retornar mensagem amigável.

## Regra adotada para POP sem execução

Quando não há vínculos em `execucoes` nem em `execucao_etapas`:

1. buscar versões do POP da mesma empresa;
2. deletar `pop_midias` dessas versões;
3. deletar `pop_etapas` dessas versões;
4. limpar `pops.versao_ativa_id`;
5. deletar `pop_versoes`;
6. deletar o POP raiz em `pops`.

Essa ordem evita registros órfãos e evita acionar cascata sobre etapas sem controle explícito.

## Regra adotada para POP com execução

Quando existe qualquer vínculo em `execucoes` ou `execucao_etapas`:

- não são deletadas etapas, versões, mídias, execuções nem execução de etapas;
- o POP raiz recebe `arquivado = true`;
- `usePops()` filtra `arquivado = false`, removendo o POP da listagem principal;
- o histórico operacional permanece preservado para auditoria e rastreabilidade.

Mensagem aplicada no sucesso do arquivamento:

> Este POP possui histórico de execução e não pode ser excluído definitivamente. Ele foi arquivado para preservar a rastreabilidade.

## Migration criada

Arquivo: `supabase/migrations/20260513120000_add_pops_arquivado.sql`

Motivo:

- O schema não possuía campo adequado para exclusão lógica do POP raiz.
- Foi adicionada a coluna mínima `pops.arquivado boolean NOT NULL DEFAULT false`, alinhada ao comportamento de arquivamento solicitado.
- Foi criado índice `(empresa_id, arquivado)` para manter eficiente a listagem principal por tenant.
- Foram reforçadas policies RLS de gestão para `UPDATE`/`DELETE` das tabelas de POP, sem desativar RLS nem remover constraints.

## Arquivos alterados

- `src/hooks/usePops.ts`
  - Filtra POPs arquivados fora da listagem principal.
  - Adiciona consulta de impacto antes da exclusão.
  - Substitui o delete direto por fluxo seguro de arquivar ou excluir fisicamente.
- `src/pages/PopsList.tsx`
  - Substitui `confirm()` nativo por `AlertDialog` já existente no projeto.
  - Exibe confirmação diferente para exclusão definitiva ou arquivamento.
  - Mostra toast amigável e oculta erro cru de foreign key do usuário final.
- `src/integrations/supabase/types.ts`
  - Atualiza tipos gerados para refletir `pops.arquivado`.
- `supabase/migrations/20260513120000_add_pops_arquivado.sql`
  - Adiciona coluna de arquivamento, índice e reforço de policies de permissão.
- `Prototipos/PopFlow/Analises/analise-exclusao-pops.md`
  - Documento obrigatório com diagnóstico e decisão técnica.

## Riscos evitados

- Não foi aplicado `ON DELETE CASCADE` em tabelas de execução.
- Não foram removidas constraints de auditoria.
- Não foi apagado histórico operacional.
- Não foi desativado RLS.
- Não foi criada arquitetura nova ou refatoração ampla.
- Erros técnicos de banco deixam de ser exibidos diretamente ao usuário final.

## Testes realizados

- `git diff --check`: executado com sucesso, sem erros de whitespace.
- Tentativa de `npm run build`: não executou porque `vite` não estava instalado no ambiente local.
- Tentativa de `npm run lint`: não concluiu porque as dependências locais não estão instaladas (`@eslint/js` ausente).
- Tentativa de instalar dependências com `npm ci --no-audit --no-fund`: falhou com HTTP 403 ao baixar `@supabase/supabase-js` do registry configurado.

## Pendências ou dúvidas

- Validar em ambiente Supabase real a aplicação da migration e o fluxo completo com dois cenários de dados:
  1. POP sem execução: deve excluir fisicamente.
  2. POP com execução/execução de etapa: deve arquivar e preservar histórico.

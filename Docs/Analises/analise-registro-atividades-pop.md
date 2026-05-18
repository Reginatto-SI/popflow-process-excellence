# Análise — Registro de atividades do POP

## 1. Diagnóstico da estrutura atual

- A tela de detalhe do POP está em `src/pages/PopDetail.tsx` e já concentra as ações superiores `Compartilhar`, `Editar` e `Iniciar Execução` no cabeçalho do detalhe.
- O carregamento do POP completo usa o hook `usePop` em `src/hooks/usePops.ts`, buscando `pops`, versão ativa, etapas (`pop_etapas`) e mídias (`pop_midias`) respeitando as policies de RLS por `empresa_id`.
- O fluxo de criação e edição está em `src/pages/PopCreateEdit.tsx` e persiste dados por meio dos hooks `useCreatePop` e `useUpdatePop` em `src/hooks/usePops.ts`.
- A edição atual sobrescreve a versão ativa no MVP: remove mídias e etapas da versão ativa e recria tudo a partir do formulário. Por isso, a detecção de atividades precisa comparar o estado carregado antes da remoção com o payload enviado pelo formulário.
- O projeto já possui componentes de UI do padrão shadcn/Lovable, incluindo `Dialog`, `ScrollArea`, `Badge` e `Button`; por isso o modal foi implementado reutilizando esses componentes, sem criar página, aba ou seção fixa.

## 2. Existência prévia de tabela de atividades/logs

- Existia `developer_logs` nas migrations iniciais, mas ela é voltada a auditoria de ações de developer e não possui policies de acesso pelo cliente autenticado para o caso de uso do detalhe do POP.
- Não foi encontrada tabela específica de atividades/histórico operacional de POPs.
- Também não foi reaproveitada `developer_logs`, pois o novo recurso precisa ser consultável no detalhe do POP por usuários autenticados da mesma empresa e conter relacionamento direto com `pop_id`.

## 3. Estrutura criada ou reutilizada

Foi criada a migration `supabase/migrations/20260518143000_create_pop_atividades.sql` com a tabela `public.pop_atividades`.

Campos principais:

- `id`
- `empresa_id`
- `pop_id`
- `pop_versao_id`
- `usuario_id`
- `acao`
- `alvo_tipo`
- `alvo_id`
- `descricao`
- `metadata`
- `created_at`

Regras de segurança:

- RLS habilitado.
- `SELECT` limitado a `empresa_id = public.current_empresa_id()`.
- `INSERT` limitado a `empresa_id = public.current_empresa_id()` e `usuario_id = auth.uid()`.

Estrutura reutilizada no frontend:

- `Dialog` para o modal central.
- `ScrollArea` para limitar altura da lista.
- `Badge` para tipo resumido da ação.
- `Button` `outline` para o botão secundário `Atividades`.
- Ícones Lucide `History` e `Activity`.

## 4. Eventos registrados no MVP

Eventos implementados:

1. Criação do POP
   - Exemplo: `Edimar criou o POP`.

2. Edição das informações gerais do POP
   - Detecta mudança em título, descrição, departamento, responsável ou visibilidade.
   - Exemplo: `Edimar editou as informações gerais do POP`.

3. Adição de etapa
   - Detecta etapa do payload sem ID real correspondente nas etapas carregadas do banco.
   - Exemplo: `Ana adicionou a Etapa 2 — Emitir relatório`.

4. Edição de etapa
   - Compara etapa existente por ID real com o payload atual.
   - Exemplo: `Edimar editou a Etapa 1 — Consultando certificado`.

5. Remoção de etapa
   - Detecta etapa existente que não voltou no payload com ID real correspondente.
   - Exemplo: `Edimar removeu a Etapa 2 — Emitindo relatório`.

6. Adição, remoção e alteração de mídia
   - Detecta mídia nova, mídia removida e alterações simples em referência, nome, tipo, ordem ou URL usando apenas IDs reais encontrados nas mídias carregadas do banco.
   - Exemplo: `Ana adicionou uma mídia na Etapa 1`.

## 5. Eventos fora do escopo

Não foram implementados neste MVP:

- Diff detalhado campo a campo.
- Comparação visual de texto antigo e novo.
- Auditoria de execução guiada.
- Histórico de aprovação/revisão avançado.
- Registro de compartilhamento.
- Registro de visualização do POP.
- Migração de registros antigos para popular atividades retroativas.

## 6. Estratégia para diferenciar ID real e ID local

- O estado local do editor agora mantém `uid` apenas para controle da UI e `id` opcional para o ID real vindo do banco.
- Etapas e mídias carregadas do banco recebem `id` e `uid` com o mesmo valor inicial.
- Etapas e mídias criadas localmente permanecem sem `id` real até serem persistidas.
- No hook de atualização, mesmo que um payload traga algum identificador, ele só é tratado como real quando existe nos mapas `oldEtapasById` ou `oldMidiasById`, construídos a partir dos registros atuais do banco.
- Essa validação evita que IDs temporários locais sejam classificados como registros existentes.

## 7. Arquivos alterados

- `supabase/migrations/20260518143000_create_pop_atividades.sql`
- `src/integrations/supabase/types.ts`
- `src/hooks/usePops.ts`
- `src/pages/PopCreateEdit.tsx`
- `src/pages/PopDetail.tsx`
- `Docs/Analises/analise-registro-atividades-pop.md`

## 8. Como validar manualmente

1. Aplicar as migrations do Supabase no ambiente local/remoto.
2. Abrir um POP existente pela rota `/pops/:id`.
3. Confirmar que o topo mostra a ordem de ações: `Compartilhar`, `Atividades`, `Editar`, `Iniciar Execução`.
4. Clicar em `Atividades` e validar o modal central com título `Registro de atividades`.
5. Para POP sem histórico, validar a mensagem `Nenhuma atividade registrada ainda.`.
6. Criar um novo POP e confirmar que aparece a atividade de criação.
7. Editar informações gerais do POP e confirmar a atividade de edição geral.
8. Adicionar uma etapa nova e confirmar a atividade de etapa adicionada.
9. Editar uma etapa existente e confirmar a atividade da etapa.
10. Remover uma etapa existente e confirmar a atividade de remoção.
11. Adicionar/remover/alterar uma mídia e confirmar a atividade correspondente.
12. Validar que IDs temporários locais não são tratados como registros existentes.
13. Validar que as atividades aparecem com a mais recente primeiro e atualizam após salvar sem recarregar a página.
14. Validar com usuário de outra empresa que atividades de outro `empresa_id` não aparecem.
15. Confirmar que não foi adicionada aba nem seção fixa no detalhe do POP.
16. Confirmar que `Iniciar Execução` continua como botão principal preenchido.

## 9. Riscos e próximos passos

Riscos:

- Como a edição atual recria etapas e mídias, a rastreabilidade de `alvo_id` aponta para o ID antigo em eventos de edição/remoção. Isso preserva a evidência do item alterado, mas a etapa/mídia pode não existir mais após a sobrescrita.
- POPs existentes antes desta mudança não terão histórico retroativo.
- O registro de mídia é resumido e não diferencia detalhadamente se a mudança foi arquivo, nome, tipo ou referência.

Próximos passos sugeridos:

- Considerar trigger/RPC transacional se o histórico passar a exigir garantia forte entre mutação e log.
- Evoluir para versionamento real do PRD 10, evitando recriação destrutiva de etapas/mídias na edição.
- Adicionar filtros por tipo de ação caso o volume de atividades cresça.

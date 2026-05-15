# Análise 4 — Implementação do MVP da Base de Conhecimento

## Arquivos lidos

- `README.md`
- `Docs/PRD/PRD 7 — Sistema de Busca Inteligente (Base de Conhecimento).txt`
- `Docs/PRD/PRD 11 — Sistema de Visibilidade e Compartilhamento de POPs.txt`
- `Docs/PRD/PRD 13 — Base de Conhecimento e Artigos Internos.txt`
- `Docs/PRD/PRD 14 — Dúvidas Frequentes, Soluções de Erro e Anotações Operacionais.txt`
- `Docs/PRD/PRD 4 — Permissões e Multi-Empresa (Multi-Tenant).txt`
- `src/App.tsx`
- `src/components/AppLayout.tsx`
- `src/components/AppSidebar.tsx`
- `src/pages/PopsList.tsx`
- `src/hooks/useAuth.tsx`
- `src/hooks/usePops.ts`
- `src/integrations/supabase/types.ts`
- `supabase/migrations/*`

## Arquivos alterados

- `src/App.tsx`
- `src/components/AppSidebar.tsx`
- `src/integrations/supabase/types.ts`
- `src/pages/BaseConhecimento.tsx`
- `src/hooks/useBaseConhecimento.ts`
- `supabase/migrations/20260515120000_create_base_conhecimento.sql`
- `Docs/Analises/analise-4-implementacao-base-conhecimento.md`

## Arquivos criados

- `src/pages/BaseConhecimento.tsx`
- `src/hooks/useBaseConhecimento.ts`
- `supabase/migrations/20260515120000_create_base_conhecimento.sql`
- `Docs/Analises/analise-4-implementacao-base-conhecimento.md`

## Estrutura implementada

- Rota autenticada `/base-conhecimento` renderizada dentro do `AppLayout` existente.
- Menu lateral único “Base de Conhecimento” apontando para `/base-conhecimento`.
- Tela unificada para artigos, dúvidas, soluções de erro e anotações.
- Cards superiores derivados dos registros carregados:
  - Total de conteúdos
  - Artigos publicados
  - Dúvidas abertas
  - Soluções de erro
  - Minhas anotações
- Busca local simples nos campos carregados.
- Filtros compactos por tipo, status, visibilidade, categoria, departamento e tags.
- Listagem em cards seguindo o padrão visual de POPs.
- Badges para tipo, status e visibilidade.
- Modal de criação/edição.
- Modal de visualização.
- Confirmação antes de excluir.
- Estados de carregamento, vazio, sem resultado de busca/filtro, erro, criação/edição e exclusão.
- Tabela persistente única `public.base_conhecimento` com RLS.

## Decisões técnicas tomadas

- Foi criada uma tabela única `base_conhecimento`, pois o escopo do MVP pedia modelagem simples e evitava tabelas separadas por tipo.
- Foram criados enums específicos para tipo e status de conteúdo, reutilizando o enum `pop_visibilidade` já existente para manter consistência com POPs.
- A busca semântica, IA e indexação avançada ficaram fora do escopo; o MVP faz filtro local dos registros já autorizados e retornados pela RLS.
- O formulário mantém campos comuns para todos os tipos e mostra campos específicos apenas para dúvida e solução de erro.
- O vínculo com POP foi implementado via seleção dos POPs existentes. O vínculo com etapa foi mantido no modelo de dados, mas não exposto na UI do MVP para evitar complexidade de carregar versões/etapas no modal.
- A exclusão usa RLS e também oculta a ação para usuários que não sejam autor ou perfis de gestão/criação.
- Refinamento pré-merge: a policy de SELECT foi ajustada para não publicar rascunhos/revisões para toda a empresa, o botão Editar passou a seguir a mesma regra visual de permissão da exclusão, e o formulário passou a oferecer apenas status compatíveis com o tipo do conteúdo.

## Como a tela respeita os PRDs 7, 11, 13 e 14

### PRD 7 — Busca Inteligente / Base de Conhecimento

- A tela pesquisa artigos, dúvidas, soluções de erro e anotações em uma experiência unificada.
- O filtro local contempla título, resumo, conteúdo, tags, categoria, departamento, pergunta, resposta, causa, solução e observações.
- Não foi implementada busca semântica nem IA, respeitando o recorte do MVP solicitado.

### PRD 11 — Visibilidade e Compartilhamento

- A modelagem usa `visibilidade` com valores `privado` e `empresa`.
- A UI exibe badges claros para privado e empresa.
- A RLS impede que conteúdos privados apareçam para usuários que não sejam o autor.

### PRD 13 — Base de Conhecimento e Artigos Internos

- O módulo usa menu lateral único “Base de Conhecimento”.
- Artigos convivem com dúvidas, soluções e anotações na mesma tela.
- A diferenciação acontece por filtros e badges, não por menus ou rotas separadas.
- A listagem mostra categoria, departamento, tags, status, visibilidade, responsável/autor e atualização.

### PRD 14 — Dúvidas Frequentes, Soluções de Erro e Anotações Operacionais

- Foram incluídos tipos específicos: dúvida, solução de erro e anotação.
- Dúvidas têm campos de pergunta e resposta.
- Soluções de erro têm sistema relacionado, erro relacionado, causa, solução e observações.
- Anotações usam o conteúdo principal e exibem orientação visual sobre visibilidade privada ou compartilhada.

## Como foi garantida a lógica de menu único

- O item existente “Base de Conhecimento” foi reapontado para `/base-conhecimento`.
- Não foram criados menus laterais separados para artigos, dúvidas, soluções ou anotações.
- A separação interna ocorre por filtro de tipo e badges na listagem.

## Como foi tratada a visibilidade

- Conteúdo `privado` é permitido na seleção somente quando `autor_id = auth.uid()`.
- Conteúdo `empresa` com status `publicado` ou `resolvida` pode aparecer para usuários autorizados da mesma empresa.
- Conteúdo `empresa` em `rascunho`, `revisao` ou `arquivado` aparece apenas para autor, responsável ou usuários com permissão de gestão/criação pelo helper já existente `public.current_user_can_manage_pops()`.
- A tela usa o filtro padrão `Todos ativos`, que exclui `arquivado` da listagem padrão; conteúdos arquivados só entram na listagem quando o usuário troca explicitamente o filtro para `Arquivado` e a RLS permitir.
- As consultas do frontend não tentam contornar a regra: elas carregam somente os dados autorizados pela RLS e aplicam filtros locais depois disso.

## Como foi tratado o multiempresa

- A tabela possui `empresa_id` obrigatório.
- Inserts obtêm `empresa_id` a partir da tabela `usuarios`, seguindo o padrão já usado em POPs.
- Todas as políticas RLS usam `public.current_empresa_id()`.
- Nenhuma policy desativa RLS ou permite acesso cross-tenant.
- Foi validado na migration real `20260502203952_ceaae078-a220-4c24-8412-7243a4dd8d09.sql` que `public.pop_etapas` possui coluna `empresa_id`; por isso a validação de `etapa_id` na policy foi mantida sem precisar atravessar `pop_versoes`/`pops`.

## O que ficou fora do escopo

- Busca semântica, IA, autocomplete inteligente e indexação avançada.
- Upload de anexos ou mídia.
- Workflow complexo de aprovação.
- Comentários dentro da Base de Conhecimento.
- Notificações e automações.
- Transformação automática de anotação em artigo ou solução em POP.
- Permissões granulares avançadas.
- Menus laterais separados por tipo de conteúdo.
- UI para selecionar etapa específica de POP, apesar de o campo `etapa_id` existir no banco para evolução futura.

## Regras refinadas antes do merge

- Rascunhos e revisões de conteúdo de empresa não ficam mais visíveis para toda a empresa; ficam restritos a autor, responsável ou perfis de gestão/criação.
- Conteúdos privados permanecem estritamente pessoais para o autor.
- O botão `Editar` só é exibido para autor ou perfis `admin`, `gestor`, `criador` e `developer`; os demais usuários ficam apenas com a ação `Abrir`.
- O formulário limita status por tipo:
  - Artigo: `rascunho`, `revisao`, `publicado`, `arquivado`.
  - Dúvida: `aberta`, `resolvida`, `arquivado`.
  - Solução de erro: `rascunho`, `publicado`, `resolvida`, `arquivado`.
  - Anotação: `rascunho`, `publicado`, `arquivado`.
- Ao trocar o tipo, se o status atual não for compatível, a UI troca automaticamente para o status padrão do novo tipo.
- A migration também inclui `CHECK` de compatibilidade entre `tipo` e `status`, evitando persistência de combinações inválidas pelo cliente.

## Pontos de atenção

- É necessário aplicar a migration no ambiente Supabase antes de usar a tela em ambiente real.
- O arquivo de tipos Supabase foi atualizado manualmente para refletir a nova tabela até que a geração automática seja executada no projeto.
- A busca é local sobre os registros retornados pela RLS; quando houver grande volume, recomenda-se mover a busca para uma função/consulta paginada.
- A action de edição é exibida apenas para autor ou perfis de gestão/criação; a autorização efetiva de update/delete permanece protegida por RLS.

## Testes realizados

- `git diff --check`: executado sem apontar problemas de whitespace.
- `npm run lint`: não executou por ausência de dependências locais (`@eslint/js`) e bloqueio 403 ao tentar reinstalar dependências.
- `npm install`: falhou com 403 ao buscar `@supabase/supabase-js` no registry configurado.
- `tsc -p tsconfig.app.json --noEmit`: não executou a checagem completa porque a dependência de tipos `vitest/globals` não está instalada localmente.
- `npm run build`: não executou porque o binário `vite` não está instalado localmente.
- `npm run test`: não executou porque o binário `vitest` não está instalado localmente.

## Próximos passos recomendados

1. Rodar `npm install` em ambiente com acesso permitido ao registry.
2. Rodar `npm run lint`, `npm run build` e `npm run test` após instalar dependências.
3. Aplicar a migration Supabase.
4. Validar manualmente a rota `/base-conhecimento` autenticada.
5. Validar criação, edição, visualização, exclusão, busca e filtros com usuários de mesma empresa.
6. Validar que conteúdo privado não aparece para outro usuário da mesma empresa.
7. Considerar paginação e busca no banco quando houver maior volume de registros.

# Análise — Base de Conhecimento com mídia inline multimodal

## Arquitetura atual encontrada

- O padrão multimídia dos POPs já está centralizado em componentes reutilizáveis:
  - `MediaMentionTextarea`: editor textual com toolbar Markdown leve, autocomplete de `@referencia`, botão “Inserir mídia”, suporte a colagem (`Ctrl+V`) e drop de arquivos.
  - `InsertMediaDialog`: modal existente para selecionar/colar/arrastar arquivo, gerar `@slug`, executar upload e confirmar a mídia inserida.
  - `MediaViewer`: visualizador contextual para imagem, áudio, vídeo e documento.
  - `renderMarkdownPreview`: parser/renderizador seguro que transforma referências `@midia` em chips clicáveis quando recebe a lista de mídias.
- O módulo de POPs mantém as mídias em `pop_midias`, vinculadas à versão/etapa, e usa o bucket público `pop-midias` para arquivos.
- A Base de Conhecimento já possuía tabela `base_conhecimento` e uma tabela de metadados `base_conhecimento_anexos` usando o mesmo bucket `pop-midias`, mas a UI estava organizada como anexos administrativos separados do conteúdo.

## Componentes reutilizados

- `src/components/MediaMentionTextarea.tsx`
- `src/components/InsertMediaDialog.tsx`
- `src/components/MediaViewer.tsx`
- `src/lib/markdownPreview.tsx`
- Bucket Supabase existente: `pop-midias`
- Tabela existente de metadados da Base: `base_conhecimento_anexos`, agora preparada para diferenciar mídia `inline` de anexo legado.

## Decisões tomadas

- A aba **Anexos** foi removida da UI do modal para evitar fluxo paralelo de upload.
- A Base passou a usar o editor multimídia dos POPs na aba **Conteúdo**, preservando `@referencia`, toolbar Markdown, botão “Inserir mídia”, `Ctrl+V` e pré-visualização contextual.
- O campo **Descrição / resumo** foi removido da UI e o formulário passa a salvar `resumo` vazio, sem remover a coluna do banco para manter compatibilidade.
- Foi adicionada uma migração mínima em `base_conhecimento_anexos` com `referencia` e `uso`, permitindo persistir mídia inline sem criar uma nova tabela ou arquitetura paralela.
- O modal `InsertMediaDialog` recebeu apenas um rótulo opcional de contexto (`contextLabel`) para funcionar tanto em etapas de POP quanto no conteúdo da Base.
- A aba **Geral** foi reorganizada em layout responsivo: 3 colunas no desktop, 2 no tablet e 1 no mobile.
- As abas foram reduzidas para **Geral**, **Conteúdo** e **Vínculos**, com ícones e estado ativo mais evidente.

## Riscos encontrados

- Conteúdos criados antes desta alteração podem ter anexos legados sem `referencia`; eles continuam compatíveis no banco, mas não são expostos no novo fluxo visual.
- Em conteúdo novo, o arquivo é enviado antes do primeiro salvamento para permitir inserir `@referencia` imediatamente; se o usuário cancelar o modal sem salvar, pode permanecer arquivo órfão no storage, comportamento similar ao fluxo atual dos POPs para itens novos.
- A lista de conteúdos usa os dados retornados por `useKnowledgeContents`; se outra sessão inserir mídia inline, a atualização depende da invalidação/refetch do React Query.

## Ajustes realizados

- Remoção da aba **Anexos** do modal da Base de Conhecimento.
- Remoção do campo **Descrição / resumo** da aba Conteúdo.
- Integração do `MediaMentionTextarea` nos campos textuais principais da Base:
  - `conteudo` para artigos e anotações.
  - `resposta` para dúvidas.
  - `solucao` para soluções de erro.
- Integração do modal existente `InsertMediaDialog` com upload no bucket `pop-midias`.
- Inserção automática de `@slug` no cursor do editor após confirmação da mídia.
- Habilitação de `Ctrl+V`/drop via `MediaMentionTextarea` reaproveitado.
- Renderização de leitura/pré-visualização com `renderMarkdownPreview` e abertura contextual via `MediaViewer`.
- Persistência de mídia inline em `base_conhecimento_anexos` usando `referencia` e `uso = 'inline'`.
- Atualização dos tipos Supabase gerados para refletir as novas colunas.
- Ajuste visual do modal para experiência mais compacta e moderna.

## Arquivos alterados

- `src/pages/BaseConhecimento.tsx`
- `src/components/InsertMediaDialog.tsx`
- `src/hooks/useBaseConhecimento.ts`
- `src/integrations/supabase/types.ts`
- `supabase/migrations/20260515160000_base_conhecimento_inline_media.sql`
- `Docs/Analises/analise-base-conhecimento-midia-inline.md`

## Pontos futuros recomendados

- Criar rotina de limpeza para arquivos enviados em conteúdos novos que forem cancelados antes do salvamento.
- Evoluir a listagem para gerar resumo automático a partir dos primeiros caracteres do conteúdo, sem reintroduzir campo manual de resumo.
- Avaliar uma UI futura para gerenciar/remover mídias inline não utilizadas, mantendo o fluxo principal focado em conteúdo.
- Considerar signed URLs caso a Base passe a armazenar materiais sensíveis, pois o bucket `pop-midias` é público no MVP.

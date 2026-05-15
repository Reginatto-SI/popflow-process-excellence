# Análise — Refinamento estrutural da Base de Conhecimento com mídia inline

## Escopo validado

Esta análise cobre o refinamento posterior à integração da Base de Conhecimento com o fluxo de mídia inline previsto nos PRDs 12, 13 e 14. O objetivo foi preservar o funcionamento atual, evitar uma refatoração ampla e reduzir riscos pontuais antes de crescimento para novos contextos como comentários.

Arquivos revisados no diagnóstico:

- `src/pages/BaseConhecimento.tsx`
- `src/components/MediaMentionTextarea.tsx`
- `src/components/InsertMediaDialog.tsx`
- `src/components/MediaViewer.tsx`
- `src/lib/markdownPreview.tsx`
- `src/hooks/useBaseConhecimento.ts`
- `src/hooks/usePops.ts`
- migrations relacionadas a `pop-midias` e `base_conhecimento_anexos`

## Mapa do fluxo completo de mídia

### Inserção no editor

1. O usuário edita um campo multimídia da Base de Conhecimento usando `MediaMentionTextarea`.
2. O botão “Inserir mídia”, paste ou drop abre `InsertMediaDialog` com o campo ativo.
3. O modal recebe o arquivo, nome e referência, usando o mesmo padrão de `@referencia` já usado nos POPs.
4. Ao confirmar, `InsertMediaDialog` chama `uploadFile`.
5. Em `BaseConhecimento.tsx`, `uploadInlineFile` envia o arquivo para o bucket `pop-midias`, porém com prefixo `base-conhecimento/{id ou _new}`.
6. O modal retorna a URL e chama `onConfirm`.
7. A Base cria um item `KnowledgeInlineMedia` local e insere `@referencia` no cursor do textarea.
8. Ao salvar o conteúdo novo, cada mídia local é persistida em `base_conhecimento_anexos` com `uso = 'inline'`.
9. Em edição de conteúdo existente, a mídia é persistida imediatamente em `base_conhecimento_anexos`.

### Renderização

1. Conteúdos salvos carregam seus anexos via `useKnowledgeContents`.
2. Anexos com `referencia` são convertidos para `KnowledgeInlineMedia`.
3. `renderMarkdownPreview` recebe o texto Markdown e a lista de mídias inline.
4. Menções conhecidas viram chips clicáveis e abrem `MediaViewer`.
5. Menções desconhecidas permanecem texto puro, sem quebrar o conteúdo.

## Problemas encontrados

### 1. Nomenclatura ainda parcialmente acoplada a POP

Foi identificado que o tipo de mídia (`PopMidiaTipo`) ainda nasce em `usePops.ts`, porque o PRD 12 e o banco original usam o módulo POP como origem do enum. Isso não quebra a Base, mas cria acoplamento semântico em componentes compartilhados.

Refinamento aplicado:

- Foi criado o alias `InlineMediaTipo` em `markdownPreview.tsx` para explicitar que o contrato usado por editor/renderizador é genérico, mesmo que a fonte atual ainda seja o tipo herdado do POP.
- `MediaMentionTextarea` e `BaseConhecimento` passaram a depender do alias genérico em vez de importar diretamente `PopMidiaTipo`.
- Comentários foram adicionados indicando que a origem POP é uma compatibilidade atual, não uma regra arquitetural definitiva.

### 2. Parser/renderizador já era reaproveitável, mas o comentário limitava o uso a etapas

`renderMarkdownPreview` já aceitava uma lista genérica de mídias por referência, porém a documentação do helper mencionava “descrições de etapas”, induzindo uso acoplado a POP.

Refinamento aplicado:

- Comentário atualizado para declarar uso compartilhado por POPs, Base de Conhecimento e futuros contextos.
- Parâmetro interno renomeado de `midiasDaEtapa` para `inlineMedia`.
- Foi mantido um único renderizador; não foi criado parser paralelo.

### 3. Uploads órfãos no cenário de criação/cancelamento

Risco encontrado:

- Ao criar conteúdo novo, o arquivo era enviado para o bucket antes do conteúdo existir.
- Se o usuário inserisse uma mídia e fechasse/cancelasse o modal principal sem salvar, o arquivo ficaria no bucket sem registro em `base_conhecimento_anexos`.
- O caminho usava `_new`, o que facilita identificar origem, mas não removia automaticamente.

Refinamento aplicado:

- Adicionado cleanup simples no fechamento/cancelamento do formulário para remover mídias `persisted: false` do storage.
- Adicionado cleanup para o caso em que um upload do modal seja descartado antes de virar item inline.
- Mantido TODO para evolução futura com draft rastreável ou rotina backend/edge de varredura, porque timeouts/falhas de rede ainda podem deixar órfãos raros.

Limitação conhecida:

- O cleanup no frontend reduz o cenário comum, mas não substitui uma rotina server-side futura para limpar objetos abandonados por falha de rede, refresh de página ou fechamento abrupto do navegador.

### 4. Preview/listagem e busca local podiam exibir ou indexar Markdown bruto

Risco encontrado:

- A listagem usava conteúdo bruto para preview (`**`, `#`, `@midia`, links Markdown).
- A busca local também usava o texto bruto, o que poderia incentivar uma futura indexação poluída por sintaxe inline.

Refinamento aplicado:

- Criado `stripMarkdownForSearchPreview` no renderizador compartilhado.
- A listagem agora usa texto limpo para preview.
- A busca local normaliza Markdown e `@referencia` antes de comparar termos.

### 5. Experiência visual do editor ainda podia evoluir sem editor pesado

Estado encontrado:

- Já existia toolbar leve para Markdown.
- Faltava ação explícita para bloco de código, solicitada no refinamento.
- O preview já existia em modal e reaproveitava `renderMarkdownPreview`.

Refinamento aplicado:

- Adicionado botão “Código” à toolbar, inserindo bloco Markdown cercado por crases triplas.
- `renderMarkdownPreview` passou a renderizar blocos de código como `<pre><code>` seguro, sem `dangerouslySetInnerHTML`.
- A toolbar continua só manipulando string Markdown; não foi instalado TipTap, Slate, Quill ou similar.

### 6. Tabs funcionais, mas com oportunidade de polimento visual

Refinamento aplicado:

- Tabs do formulário receberam borda, `shadow-inner`, estados de hover mais claros, peso visual maior na aba ativa e contraste melhor entre ativo/inativo.
- A mudança foi puramente visual e localizada.

## Riscos arquiteturais atuais

1. **Bucket ainda chamado `pop-midias`**: mantido por compatibilidade e para evitar migration/tabela nova. O prefixo `base-conhecimento` reduz ambiguidade operacional.
2. **Tipo de mídia ainda herdado de POP**: reduzido por alias genérico, mas a extração definitiva para módulo de mídia compartilhada deve ficar para uma refatoração futura planejada.
3. **Cleanup frontend não cobre falhas abruptas**: necessário job/edge function futuro para limpeza de objetos sem metadados.
4. **Editor Markdown é intencionalmente limitado**: suporta o suficiente para documentação operacional, mas não é um editor rich-text completo.

## Uploads órfãos identificados

| Cenário | Antes | Agora | Risco residual |
| --- | --- | --- | --- |
| Inserir mídia em conteúdo novo e cancelar formulário | Arquivo ficava no bucket sem metadado | Remove `persisted: false` ao fechar/cancelar | Falha de rede/refresh abrupto |
| Upload no modal antes de confirmar vínculo | Poderia sobrar se o asset fosse descartado no meio do fluxo | Remove asset pendente ao fechar modal | Janela muito pequena em falha abrupta |
| Edição de conteúdo existente com cancelamento | Persistência imediata podia deixar metadado/arquivo sem `@referencia` no texto salvo | Vínculos criados na sessão são removidos no cancelamento | Falha abrupta antes do cleanup |
| Conteúdo salvo com mídia inline | Metadado em `base_conhecimento_anexos` | Mantido | Exclusão completa de anexos não foi alterada |

## Acoplamentos encontrados

- `PopMidiaTipo` ainda é a origem do enum de tipo de mídia.
- Bucket `pop-midias` segue compartilhado por POP e Base.
- O vínculo opcional da Base com POP (`pop_id`, `etapa_id`) continua existindo por regra de produto, mas não foi expandido.
- `InsertMediaDialog`, `MediaMentionTextarea`, `MediaViewer` e `renderMarkdownPreview` estão efetivamente compartilhados e não possuem validações específicas de etapa/pop no fluxo usado pela Base.

## Refinamentos aplicados

- Alias genérico `InlineMediaTipo` para reduzir acoplamento semântico.
- Comentários sobre pontos compartilhados POP/Base e limitações atuais.
- Cleanup simples de uploads temporários no cancelamento/fechamento.
- Sanitização leve de preview/listagem/busca local via `stripMarkdownForSearchPreview`.
- Botão de bloco de código na toolbar leve.
- Renderização segura de code fences no preview.
- Polimento visual das tabs do formulário.
- Testes automatizados cobrindo normalização de Markdown, code fences e botão de bloco de código.

## Componentes reutilizados

- `MediaMentionTextarea`: editor leve de Markdown + menções `@referencia`.
- `InsertMediaDialog`: modal compartilhado de upload/cadastro de mídia.
- `MediaViewer`: visualizador único para imagem, áudio, vídeo e documento.
- `renderMarkdownPreview`: renderizador seguro e limitado de Markdown inline.
- `base_conhecimento_anexos`: tabela de metadados existente para anexos e mídia inline da Base.
- Bucket `pop-midias`: reaproveitado com prefixo específico da Base para evitar nova infraestrutura.

## Pontos futuros recomendados

1. Criar, em momento planejado, um módulo/tipo compartilhado de mídia para substituir a origem semântica `PopMidiaTipo`.
2. Implementar rotina server-side/edge scheduled para remover arquivos em `base-conhecimento/_new` sem metadados após janela segura.
3. Avaliar draft persistente simples apenas quando o produto exigir edição longa com autosave.
4. Se a busca inteligente for implementada, indexar o texto normalizado por função equivalente a `stripMarkdownForSearchPreview`, mantendo metadados de mídia separados.
5. Manter o renderizador Markdown limitado e seguro; só ampliar sintaxe mediante demanda concreta dos PRDs.

## Conclusão

O refinamento manteve a arquitetura atual, reaproveitou o fluxo de mídia inline existente e reduziu riscos práticos sem criar nova tabela, novo editor ou novo parser. A Base de Conhecimento permanece leve, mas agora tem uma experiência visual mais próxima de documentação operacional moderna e está melhor preparada para crescimento futuro.

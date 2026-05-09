## Objetivo

Permitir inserir mídias diretamente da aba **Etapas** (sem precisar pré-cadastrar em Mídias), via botão "Inserir mídia", colar do clipboard ou drag-and-drop. A descrição continua sendo texto puro com referências `@slug` — mídias são registradas como entidades separadas e vinculadas à etapa.

## Mudanças

### 1. Novo componente: `src/components/InsertMediaDialog.tsx`
Modal compacto reutilizável com:
- Tipo da mídia (imagem / áudio / vídeo / documento) — auto-detectado quando vier de paste/drop
- Campo "Nome" + campo "Referência" (slug auto-gerado, editável)
- Área de upload: arquivo do computador OU área de paste (Ctrl+V) OU preview do arquivo já recebido (quando aberto via paste/drop)
- Validação de unicidade da referência: se já existir, sufixar `-2`, `-3`... automaticamente; mostrar a referência final
- Ao confirmar: faz upload no bucket `pop-midias` (mesma rotina já existente em `uploadMidiaFile`) e devolve `{ tipo, nome, referencia, url }` via callback
- Estados: idle / uploading / erro com toast

### 2. Refatorar `MediaMentionTextarea` (`src/components/MediaMentionTextarea.tsx`)
- **Remover o card "Prévia"** abaixo do textarea (o bloco `hasRefs && (<div>…Prévia…)`).
- Adicionar nova prop `onRequestInsertMedia?: (file?: File) => void`.
- Capturar `onPaste`: se houver `clipboardData.files` ou `items` com `kind: "file"` e `type` começando com `image/` (ou outros tipos suportados), chamar `onRequestInsertMedia(file)` e prevenir o paste padrão.
- Capturar `onDragOver` / `onDrop` no textarea: se vier arquivo, chamar `onRequestInsertMedia(file)` e prevenir comportamento padrão.
- Expor método imperativo (via `useImperativeHandle` + `forwardRef`) `insertReferenceAtCursor(ref: string)` para inserir `@slug` na posição atual do cursor — reaproveitar a lógica existente de `insertReference`.

### 3. Atualizar `src/pages/PopCreateEdit.tsx` (aba Etapas)
Para cada etapa:
- Adicionar `ref` ao `MediaMentionTextarea` correspondente (Map por `step.uid`).
- Adicionar **botão "Inserir mídia"** ao lado do label "Descrição".
- Estado local `mediaDialog: { stepUid, file?, tipo? } | null` controlando o modal.
- Handler `handleInsertMedia(stepUid, file?)`: abre `InsertMediaDialog` pré-preenchido com o arquivo (se vier de paste/drop) e tipo detectado.
- `onConfirm` do diálogo:
  1. Cria novo `MidiaItem` no estado `midias` com `etapaOrdem = step.ordem`, `url`, `referencia` única;
  2. Chama `textareaRef.insertReferenceAtCursor(referencia)` para inserir `@ref` na posição do cursor;
  3. Foca de volta no textarea.

Helper novo `ensureUniqueRef(base, midias)` para garantir slug único.

#### Substituir o card "Prévia" por "Mídias vinculadas nesta etapa"
Abaixo do textarea, lista compacta (chips) das mídias usadas:
- Critério: mídias cujo `referencia` aparece em `step.descricao` via regex `@([A-Za-zÀ-ÿ0-9_-]+)`, **ou** mídias com `etapaOrdem === step.ordem`.
- Cada chip: ícone do tipo + `@referencia` + `— Tipo` + botão "x" para remover a referência do texto (não apaga a mídia da biblioteca).
- Sem renderização do texto inteiro.

### 4. Aba "Mídias" — proteção ao remover
Em `removeMidia`, antes de apagar:
- Verificar se `@referencia` aparece em qualquer `step.descricao`.
- Se sim, pedir confirmação (`window.confirm` simples) listando as etapas afetadas. Se confirmado, remove apenas a mídia (deixa o `@ref` órfão, que continua sendo tratado como aviso amarelo na visualização).

### 5. Visualização (PopDetail / PopExecution)
Sem mudanças — já renderizam chips a partir de `@ref`. A prévia rica permanece nessas telas, conforme pedido.

## Regras técnicas mantidas

- Descrição da etapa continua sendo texto plano com `@slug`. Nada de HTML/imagem embutida.
- Slug usa o `slugifyRef` já existente.
- Upload reusa o bucket público `pop-midias` e a rotina atual.
- Paste/drop só dispara o modal quando o item for **arquivo**; texto colado segue o comportamento normal.
- Drawer lateral fixo continua não existindo; comportamento de mídia em modal/mini-player segue inalterado nas telas de leitura.

## Arquivos

- **Novo**: `src/components/InsertMediaDialog.tsx`
- **Editar**: `src/components/MediaMentionTextarea.tsx` (remove prévia; adiciona paste/drop/ref imperativo)
- **Editar**: `src/pages/PopCreateEdit.tsx` (botão Inserir mídia, integração com diálogo, lista "Mídias vinculadas nesta etapa", confirmação ao remover)

Sem migrações de banco, sem mudança de fluxo de execução, sem editor rico.
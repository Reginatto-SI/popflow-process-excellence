## Objetivo

Resolver 3 problemas de UX na criação/edição de POPs sem mexer no banco, no fluxo de execução ou no layout geral.

---

## 1. Referências sem espaço (slug seguro)

**Problema:** mídia com referência `Acesso a Tela` gera `@Acesso a Tela`, mas o regex `/@([A-Za-zÀ-ÿ0-9_-]+)/g` corta no espaço, vinculando só `@Acesso`.

**Solução — tratar referência como identificador técnico:**

- Criar helper `slugifyRef(s)` em `src/pages/PopCreateEdit.tsx` (ou `src/lib/utils.ts`):
  - lowercase, remover acentos (`normalize("NFD").replace(/[\u0300-\u036f]/g, "")`),
  - trocar espaços por `-`,
  - remover qualquer caractere fora de `[a-z0-9_-]`,
  - colapsar `-` repetidos e cortar nas pontas.
- **Auto-geração:** quando o usuário digita o `Nome` da mídia, se a `referencia` está vazia OU ainda igual ao slug do nome anterior (não foi editada manualmente), atualizar `referencia = slugifyRef(nome)`. Marcar com flag interna `refTouched` quando o usuário edita o campo manualmente.
- **Sanitização do campo Referência:** no `onChange` aplicar `slugifyRef` para impedir espaços/caracteres inválidos em tempo real. Placeholder vira `ex: acesso-a-tela`.
- **Migração leve em runtime:** ao carregar POPs antigos no `useEffect`, se `m.referencia` contiver caractere inválido, normalizar via `slugifyRef` no estado local (banco só muda quando salvar). Sem migration SQL.
- **Autocomplete (`MediaMentionTextarea`)** já insere `@${m.referencia}` — passa a ser sempre slug seguro. Sem mudanças no regex nem no `PopDetail`.

---

## 2. Textarea de descrição da etapa maior

Em `PopCreateEdit.tsx` linha 311, alterar `rows={2}` para `rows={5}` no `MediaMentionTextarea` da descrição da etapa. Sem mudanças de layout.

---

## 3. Aba Mídias compacta

**Hoje:** cada mídia é um Card grande com 6 campos sempre visíveis (~330px de altura).

**Solução — linha compacta com edição expansível:**

Substituir o Card por uma lista (`<ul>` ou stacked rows) onde cada mídia é uma linha enxuta:

```text
[thumb 40x40] Nome · @referencia    [tipo badge]  [etapa badge]   [Editar] [Remover]
```

- **Linha compacta** (estado padrão):
  - miniatura: imagem real se `tipo=imagem` e `url`, senão ícone do tipo (Image/Mic/Video/FileText);
  - nome (truncate), `@referencia` em `text-muted-foreground text-xs`;
  - badge do tipo, badge da etapa vinculada (ou "Sem vínculo");
  - botões `Editar` (toggle) e `Remover` (ícone `Trash2`).
- **Modo edição** (quando `expandedUid === m.uid`):
  - expande a mesma linha mostrando os campos atuais (Nome, Referência slugificada, Tipo, Etapa vinculada, Arquivo + área de paste Ctrl+V) — reaproveita o JSX existente do Card grande;
  - botão `Concluir` colapsa de volta.
- Ao adicionar nova mídia (`addMidia`), abrir automaticamente em modo edição.
- Manter intacto: upload tradicional (`<input type="file">`), paste de imagem via Ctrl+V, fluxo `uploadMidiaFile`, validações da aba Revisão.

Resultado: dezenas de mídias cabem na tela sem rolagem excessiva; edição continua acessível em 1 clique.

---

## Detalhes técnicos

**Arquivos alterados:**
- `src/pages/PopCreateEdit.tsx` — helper `slugifyRef`, auto-gen no `updateMidia` para `nome`, sanitização no campo `referencia`, normalização ao carregar, `rows={5}`, refator da aba Mídias para lista compacta + estado `expandedMidiaUid`.
- (Opcional) extrair `MidiaListItem` como subcomponente local no mesmo arquivo se ficar > ~80 linhas.

**Não muda:** schema DB, RLS, `usePops.ts`, `PopDetail.tsx`, `MediaMentionTextarea.tsx`, `MediaViewer.tsx`, fluxo de execução, layout das outras abas.

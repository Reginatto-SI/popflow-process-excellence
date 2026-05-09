## Objetivo

Transformar a aba "Etapas" em uma lista de cards colapsáveis, mantendo todos os campos e comportamentos atuais. Apenas uma etapa fica aberta por padrão; etapas fechadas mostram um resumo compacto. Adicionar ações de massa e melhorar o painel "Resumo do POP".

## Alterações (apenas em `src/pages/PopCreateEdit.tsx`)

### 1. Estado de expansão
- Novo estado `expandedStepUid: string | null` (uma aberta por vez).
- Helpers: `toggleStep(uid)`, `expandAll()` (modo "todas abertas" via flag `allExpanded`), `collapseAll()`.
- Ao criar etapa via `addStep` ou "Adicionar etapa abaixo", definir `expandedStepUid` para o `uid` recém-criado.
- Ao carregar POP existente: abrir a primeira etapa por padrão.

### 2. Header da seção Etapas
Substituir o `CardHeader` atual por uma barra com:
- Título "Etapas".
- Botões: "Expandir todas", "Recolher todas", "Adicionar etapa".

### 3. Card de etapa (modo fechado)
Resumo em uma linha:
```
Etapa N — {titulo}
{tempo} · {X} mídias · {Y} itens de checklist · {Completa|Incompleta}
```
- "Mídias" = `getStepMidias(step).length` (já existe).
- "Checklist" = quantos itens não vazios em `step.checklist` (split por linha).
- "Completa" = título preenchido + descrição preenchida + resultado esperado preenchido (regra simples, ajustável).
- Ícone chevron para expandir; clique no header alterna.

### 4. Card de etapa (modo aberto)
Mantém **exatamente** os campos atuais (título, tempo, descrição com `MediaMentionTextarea`, botão "Inserir mídia", chips de mídias vinculadas, resultado esperado, erro comum, pré-requisitos, checklist).
- Adicionar no rodapé do card: botão discreto "Adicionar etapa abaixo" (cria nova etapa com `ordem = step.ordem + 1`, reordena demais e abre a nova).
- Manter ações já existentes de mover/remover (se existirem) ou adicionar mover ↑/↓ e remover no header do card.

### 5. Painel lateral "Resumo do POP"
Enriquecer o card existente com:
- Total de etapas.
- Tempo estimado total (soma simples de minutos extraídos via regex do campo `tempo`, ex: "5 min" → 5).
- Total de mídias (`midias.length`).
- Etapas incompletas (contagem pela mesma regra de "Completa").

### 6. Comportamento "uma aberta por vez"
- Ao expandir uma etapa, fechar a anterior (a menos que esteja em modo "Expandir todas").
- "Recolher todas" volta para `expandedStepUid = null` e desativa o modo "todas".

## Fora do escopo
- Não alterar dados, persistência, mídia inline, aba Mídias, fluxo de execução nem layout geral da página.
- Não criar componentes em arquivos novos (mudança incremental no arquivo existente). Se o JSX do card crescer demais, posso extrair `StepCard` em arquivo próprio — confirmar se preferir isso.

## Detalhes técnicos
- Usar `Collapsible` do shadcn (`@/components/ui/collapsible`) para animação simples, ou apenas condicional `expandedStepUid === step.uid`.
- Ícones: `ChevronDown`, `ChevronUp`, `CheckCircle2`, `Circle`, `Plus`, `ArrowUp`, `ArrowDown`, `Trash2` do `lucide-react`.
- Cores: tokens semânticos existentes (`text-muted-foreground`, `text-primary`, etc.).
- Persistência do estado de expansão: apenas em memória (não salvar).
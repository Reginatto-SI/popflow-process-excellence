## Objetivo

Refinar o modal de criação/edição da Base de Conhecimento em `/base-conhecimento`:

1. Trocar o input livre de **Categoria** por um seletor pesquisável com criação rápida.
2. Remover o botão **Inserir mídia** duplicado na aba **Conteúdo**.
3. Suavizar o texto explicativo no topo da aba.

Mudança mínima, sem nova tela, sem nova tabela, sem refatorar arquitetura.

## Escopo

Apenas `src/pages/BaseConhecimento.tsx`. Nenhum outro arquivo, rota, migration ou componente novo precisa ser criado — todos os primitivos já existem (`Popover`, `Command`, `MediaMentionTextarea` com toolbar de inserir mídia, fluxo `InsertMediaDialog`).

## Alterações

### 1. Campo Categoria → Combobox pesquisável com criação rápida

Substituir, dentro do form do modal, o `<Input>` de Categoria por um combobox baseado em `Popover` + `Command` (shadcn, já no projeto):

- Fonte das opções: derivar do hook `useKnowledgeContents` já carregado na página (a query é por empresa via RLS, então a lista só contém categorias da empresa atual — sem categorias globais).
- Deduplicar ignorando caixa e espaços extras (`trim().toLowerCase()` para comparar; valor exibido mantém a forma já cadastrada).
- Pesquisa em tempo real via `CommandInput`.
- Quando o termo digitado não bate com nenhuma opção existente, mostrar um item `Criar categoria "X"` que grava no form o valor normalizado (`trim()`, colapsa espaços internos).
- Selecionar uma opção existente apenas seta `form.categoria` — não cria nada novo no banco.
- A "criação" é implícita: o valor é gravado em `base_conhecimento.categoria` no submit, igual hoje. Nas próximas aberturas do modal a nova categoria já aparece na lista (mesma query).

Para passar a lista de categorias até o sub-componente do form, adicionar uma prop `categoriasExistentes: string[]` derivada uma vez no componente pai.

Comentário no código explicando: por que não há tabela nova, regra de normalização, e que o isolamento por empresa vem do RLS de `base_conhecimento`.

### 2. Remover botão duplicado de Inserir mídia

Em `mediaEditor` (~linha 305 de `src/pages/BaseConhecimento.tsx`):

- Remover o `<Button>Inserir mídia</Button>` que fica no header acima do editor (linhas ~311–314).
- Manter apenas o botão da toolbar interna do `MediaMentionTextarea`, já ligado via `onOpenInsertMedia` e `onRequestInsertMedia` — fluxo de upload continua o mesmo (`InsertMediaDialog` existente).
- O `<Label>` continua no header, sem o botão ao lado.

Comentário no código apontando que a inserção fica centralizada na toolbar para evitar redundância.

### 3. Texto da aba Conteúdo

Substituir o bloco `<div class="rounded-xl border border-dashed …">` no topo da aba Conteúdo (linha ~440) por uma linha mais discreta:

- Trocar o estilo de caixa tracejada por um `<p className="text-xs text-muted-foreground">`.
- Conteúdo:  
  `Use o editor para escrever o conteúdo. Você pode inserir referências de mídia pelo botão "Inserir mídia" ou colar imagens com Ctrl + V.`

Também ajustar a frase de ajuda logo abaixo do editor (linhas ~330–332) para não repetir a mesma instrução — deixar uma única dica curta ou remover, já que o texto do topo cobre.

## Fora de escopo

- Não criar tabela `categorias` nem migration.
- Não criar tela/menu administrativo de categorias.
- Não mexer em Tags nem em Departamento.
- Não alterar outras telas, sidebar ou layout.
- Não trocar o fluxo de upload/`InsertMediaDialog`.

## Resultado

- Categoria vira combobox pesquisável com opção "Criar categoria \"X\"", padronizando os valores usados nos filtros e na busca da listagem.
- Aba Conteúdo passa a ter só um ponto de entrada para inserir mídia (toolbar do editor).
- Texto explicativo mais discreto, sem redundância.

# Análise visual — abas e labels na criação/edição de POP

## Diagnóstico do problema visual encontrado

A tela compartilhada de criação e edição de POP (`/pops/novo` e `/pops/:id/editar`) já utilizava o componente `PopCreateEdit`, com as abas **Informações Gerais**, **Etapas**, **Mídias** e **Revisão Final**. Porém, o destaque da aba ativa era sutil e podia ser confundido com as abas inativas, principalmente porque a diferença visual dependia apenas de variações leves de fundo, texto e sombra.

Na aba **Informações Gerais**, os labels dos campos principais estavam funcionais, mas visualmente genéricos. Apenas o campo **Responsável** tinha ícone dentro do input; os labels não tinham ícones próprios nem hierarquia visual reforçada, dificultando a leitura rápida do formulário.

## Arquivos alterados

- `src/pages/PopCreateEdit.tsx`
- `Prototipos/PopFlow/Analises/analise-visual-abas-labels-pop.md`

## Resumo das mudanças aplicadas

- Reforçado o container das abas com borda, fundo neutro baseado em tokens do tema, padding interno, cantos arredondados e sombra interna discreta.
- Reforçada a aba ativa com fundo de card, borda sutil, texto com peso maior, sombra leve e ícone com cor primária.
- Mantidas as abas inativas com texto secundário, fundo neutro/transparente e hover discreto.
- Adicionados ícones pequenos e discretos aos labels dos campos principais da aba **Informações Gerais**:
  - **Título do POP**: ícone de documento/texto.
  - **Descrição detalhada**: ícone de lista/texto.
  - **Departamento**: ícone de prédio/setor.
  - **Responsável**: ícone de usuário.
  - **Visibilidade**: ícone de olho.
- Adicionado cabeçalho compacto no card de informações gerais com `CardHeader`, `CardTitle` e `CardDescription`, reutilizando o padrão visual existente do projeto.
- Incluídos comentários pontuais no código para explicar os ajustes visuais aplicados nas abas e labels.

## Confirmação de não alteração de regra de negócio

Não houve alteração de regras de negócio, banco de dados, rotas, validações, payloads, permissões, RLS, criação, edição, salvamento ou fluxo funcional. As mudanças foram restritas à camada visual/UX do componente compartilhado de criação/edição de POP.

## Pontos de teste manual recomendados

1. Acessar `/pops/novo`.
2. Confirmar que a aba ativa está visualmente destacada com fundo, borda, sombra e ícone mais evidente.
3. Navegar entre **Informações Gerais**, **Etapas**, **Mídias** e **Revisão Final**.
4. Confirmar que o destaque muda corretamente conforme a aba selecionada.
5. Confirmar que os labels da aba **Informações Gerais** possuem ícones e continuam alinhados.
6. Confirmar que os inputs de título, descrição, departamento, responsável e visibilidade continuam funcionando.
7. Confirmar que a tela continua responsiva em larguras menores, com rolagem horizontal segura nas abas quando necessário.
8. Acessar `/pops/:id/editar` em um POP existente e confirmar que o mesmo padrão visual aparece na edição, pois a rota usa o mesmo componente compartilhado.
9. Confirmar que não houve alteração no fluxo de criação, edição, salvamento ou validação.

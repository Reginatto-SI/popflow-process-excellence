# Análise 1 — Ajuste da tela de edição de POP

## Diagnóstico do problema visual

A tela de criação/edição de POP estava concentrando a edição do conteúdo em uma coluna principal reduzida porque o layout usava uma grade com duas colunas em telas grandes. A coluna lateral direita exibia os cards fixos de **Resumo do POP**, **Dica** e legenda de mídias, ocupando espaço horizontal contínuo e comprimindo campos importantes do formulário.

O problema era visual/estrutural, não de regra de negócio. A origem dos dados e os handlers de criação, atualização, descarte, etapas, mídias e revisão foram preservados.

## Estrutura atual identificada

- **Arquivo principal da tela:** `src/pages/PopCreateEdit.tsx`.
- **Componentes reutilizados:** `AppLayout`, `Tabs`, `TabsList`, `TabsTrigger`, `Card`, `CardContent`, `CardHeader`, `CardTitle`, `Badge`, `Button`, `Input`, `Textarea`, `Select` e ícones de `lucide-react`.
- **Painel lateral direito:** `aside` dentro de um layout `grid` com duas colunas, contendo resumo, dica e legenda.
- **Abas:** navegação baseada em `Tabs`, `TabsList` e `TabsTrigger`, renderizada logo abaixo do cabeçalho da tela.
- **Padrão visual disponível:** componentes shadcn/ui já presentes no projeto e biblioteca de ícones `lucide-react`.

## Arquivos alterados

- `src/pages/PopCreateEdit.tsx`
- `Prototipos/PopFlow/Analises/analise-1-ajuste-tela-edicao-pop.md`

## Resumo das mudanças aplicadas

- Removido o painel lateral direito fixo da tela de edição/criação de POP.
- Substituído o resumo lateral por uma faixa compacta no topo, logo abaixo do título e das ações principais.
- Mantidas no resumo compacto as informações disponíveis de versão, status, quantidade de etapas, tempo estimado, quantidade de mídias e pendências.
- Ajustadas as abas para uma navegação com ícone + texto, usando os componentes de Tabs existentes e ícones da biblioteca já utilizada no projeto.
- Adicionado comportamento responsivo discreto nas abas com rolagem horizontal quando necessário.
- A área principal passou a usar largura centralizada com `max-width` confortável, sem dividir espaço com uma coluna lateral fixa.
- A dica e a legenda de mídias/visibilidade foram reposicionadas para um card discreto de ajuda rápida abaixo do conteúdo principal.
- Aumentado levemente o espaçamento interno em áreas de formulário para melhorar respiro visual sem mudar o fluxo.

## O que foi preservado

- `AppLayout`, sidebar, header e estrutura geral da aplicação.
- Hooks e origem dos dados de POP.
- Regras de criação e edição.
- Payload de salvamento.
- Fluxo de descarte e salvamento.
- Manipulação de etapas.
- Manipulação e upload de mídias.
- Revisão final e validações já existentes.
- Componentes reutilizáveis já existentes do projeto.
- Biblioteca de UI e biblioteca de ícones já usadas.

## Riscos ou pontos pendentes

- A validação visual final em navegador deve ser feita com dados reais de edição, especialmente em larguras menores, para confirmar que a rolagem horizontal das abas atende ao comportamento esperado.
- O resumo compacto usa os mesmos dados já disponíveis na tela; se algum status vier com formatação técnica do backend, ele continuará refletindo o valor existente.
- Não houve alteração em regras de negócio nem criação de novas regras para pendências.

## Checklist de validação visual

- [ ] A rota `/pops/:id/editar` não exibe mais painel lateral direito fixo.
- [ ] O formulário principal está mais largo e confortável em desktop.
- [ ] O resumo compacto aparece abaixo do cabeçalho com versão, status, etapas, tempo, mídias e pendências.
- [ ] As abas exibem ícone e texto.
- [ ] A aba ativa fica visualmente destacada.
- [ ] Em telas menores, as abas continuam acessíveis por rolagem horizontal discreta.
- [ ] O card de ajuda rápida preserva dica e legenda de mídias/visibilidade sem ocupar lateral fixa.
- [ ] Os botões “Descartar” e “Salvar” continuam visíveis e acionando os handlers existentes.
- [ ] O botão fixo inferior continua permitindo navegação entre etapas e salvamento no final.
- [ ] Nenhuma outra tela foi alterada.

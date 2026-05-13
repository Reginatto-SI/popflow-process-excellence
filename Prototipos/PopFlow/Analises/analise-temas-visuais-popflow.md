# Análise — Temas visuais do POPFlow

## Diagnóstico da estrutura atual de tema

- O projeto já utilizava Tailwind CSS com tokens shadcn baseados em CSS variables globais no arquivo `src/index.css`.
- O `tailwind.config.ts` já mapeava tokens como `background`, `foreground`, `primary`, `secondary`, `accent`, `card`, `popover`, `border`, `input`, `ring` e tokens de sidebar para `hsl(var(--token))`.
- Componentes shadcn existentes, como `Button`, `Badge`, `Input`, `DropdownMenu`, `Tabs`, `Sidebar` e outros, já consumiam esses tokens por classes utilitárias (`bg-primary`, `text-primary-foreground`, `focus-visible:ring-ring`, `bg-accent`, etc.).
- O layout global é composto por `AppLayout`, `AppHeader` e `AppSidebar`. O header já concentrava busca, notificações, avatar e logout.
- Não havia provider de tema ativo no aplicativo, apesar de existir dependência `next-themes` no `package.json`. Como o escopo exige paletas de cor além de claro/escuro, foi criada uma camada mínima de tema própria, baseada nos tokens já existentes e sem alterar regras de negócio.

## Arquivos alterados

- `src/theme-config.ts`
  - Novo arquivo com a lista centralizada das paletas e variáveis CSS de cada tema.
- `src/hooks/useTheme.tsx`
  - Novo provider/hook para aplicar o tema globalmente, persistir preferência e expor ações para o seletor.
- `src/components/ThemeSwitcher.tsx`
  - Novo componente discreto de dropdown para seleção de paleta e aparência.
- `src/components/AppHeader.tsx`
  - Inclusão do seletor de tema ao lado do ícone de notificações.
- `src/App.tsx`
  - Inclusão do `ThemeProvider` no topo da árvore React.
- `src/index.css`
  - Comentário de documentação dos tokens e ajuste do fallback escuro para permanecer coerente com a nova estrutura.
- `tailwind.config.ts`
  - Inclusão do token `primary.soft`, preservando o padrão Tailwind/shadcn.
- `Prototipos/PopFlow/Analises/analise-temas-visuais-popflow.md`
  - Este relatório.

## Componentes criados ou reutilizados

### Criados

- `ThemeProvider`
- `useTheme`
- `ThemeSwitcher`
- `theme-config`

### Reutilizados

- `Button`
- `DropdownMenu`
- `DropdownMenuContent`
- `DropdownMenuItem`
- `DropdownMenuLabel`
- `DropdownMenuSeparator`
- `DropdownMenuTrigger`
- Tokens globais shadcn/Tailwind (`primary`, `accent`, `background`, `foreground`, `card`, `popover`, `border`, `ring`, `sidebar-*`)

## Temas implementados

1. **Azul Executivo**
   - Mantém o visual institucional próximo ao atual.
   - Primário em azul escuro no modo claro e azul vivo no modo escuro.

2. **Verde Operacional**
   - Destaca botões, foco, ícones e navegação ativa em verde.
   - Mantém tokens sem alterar sucesso/erro/alerta semântico.

3. **Roxo Moderno**
   - Visual mais tecnológico, com primário roxo e acentos suaves.

4. **Laranja Energia**
   - Mais chamativo, mas com contraste controlado em botões e elementos ativos.

5. **Cinza Profissional**
   - Visual neutro e corporativo com destaque em chumbo/cinza.

Cada tema possui variações para **Claro** e **Escuro**. A troca altera tokens globais como `--primary`, `--primary-foreground`, `--primary-soft`, `--accent`, `--accent-foreground`, `--ring`, `--sidebar-primary`, `--sidebar-accent` e `--sidebar-accent-foreground`, além dos tokens estruturais do modo escuro.

## Como a persistência funciona

- As preferências são salvas em `localStorage` na chave `popflow-theme-preferences`.
- O valor salvo contém:
  - `color`: identificador da paleta escolhida.
  - `appearance`: `light` ou `dark`.
- Ao iniciar o aplicativo, `ThemeProvider` lê a preferência armazenada.
- A aplicação global ocorre no `document.documentElement`, por meio de:
  - CSS variables via `style.setProperty`.
  - classe `dark` quando a aparência selecionada é escura.
  - atributos `data-theme-color` e `data-theme-appearance` para facilitar inspeção/debug.

## Limitações conhecidas

- A aplicação do tema acontece no cliente após a inicialização do React; pode haver um flash muito curto do tema padrão em conexões/dispositivos lentos.
- A preferência ainda não é sincronizada por usuário no banco; por enquanto é local ao navegador/dispositivo.
- Algumas rotas citadas para validação (`/dashboard`, `/revisoes`, `/execucoes`, `/base-conhecimento`, `/analytics`, `/configuracoes`) não aparecem registradas no `App.tsx` atual. O menu da sidebar também aponta parte dessas rotas, mas elas caem no fallback enquanto não houver páginas/rotas implementadas.
- Não foi alterada a semântica de status, erro, alerta e sucesso. Componentes que usam classes HSL customizadas de `--success` e `--warning` continuam preservando essas cores.

## Checklist de telas testadas

> Validação programática/visual limitada ao estado atual do roteamento do projeto.

- [x] `/` — rota atual do Dashboard/Index.
- [x] `/pops` — rota registrada.
- [x] `/pops/novo` — rota registrada.
- [ ] `/dashboard` — não registrada no `App.tsx` atual.
- [ ] `/revisoes` — não registrada no `App.tsx` atual.
- [ ] `/execucoes` — sidebar aponta para esta URL, mas o `App.tsx` possui apenas `/execucao/:id`.
- [ ] `/base-conhecimento` — não registrada no `App.tsx` atual; a sidebar aponta para `/base`.
- [ ] `/analytics` — não registrada no `App.tsx` atual.
- [ ] `/configuracoes` — não registrada no `App.tsx` atual.

Itens verificados por estrutura/tokens:

- [x] Header.
- [x] Sidebar.
- [x] Botões primários e secundários.
- [x] Cards.
- [x] Inputs e foco.
- [x] Badges baseados em `primary`/semânticos.
- [x] Menus/dropdowns.
- [x] Popover/dropdown do seletor.
- [x] Hover/foco.
- [x] Modo escuro.

## Riscos restantes

- Componentes que tenham cores hardcoded fora dos tokens globais podem não responder integralmente à troca de paleta.
- Como algumas rotas do checklist ainda não existem no roteamento, a validação completa dessas telas depende da implementação futura das páginas correspondentes.
- Se preferências de usuário forem adicionadas no backend, será necessário decidir precedência entre preferência remota e `localStorage`.

## Sugestões futuras

- Persistir a preferência por usuário em uma tabela de preferências ou no perfil do usuário quando houver decisão de produto para sincronização entre dispositivos.
- Adicionar um script inline antes do bundle React para eliminar completamente qualquer flash de tema padrão.
- Criar testes de acessibilidade/contraste para cada paleta.
- Revisar pontos com cores customizadas fora dos tokens globais, se surgirem componentes novos.

## Confirmação de escopo

- Não foram alteradas regras de negócio.
- Não foram alterados fluxos de criação, edição, execução, revisão, salvamento ou exclusão de POPs.
- Não foram alteradas autenticação, permissões, banco de dados, migrations ou RLS.
- A mudança ficou restrita à camada visual/UX e à persistência local do tema.

## Revisão pós-implementação

### Conflitos entre `index.css` e `ThemeProvider`

- Não foi encontrado conflito funcional entre o fallback do `index.css` e o `ThemeProvider`.
- O `index.css` permanece como fallback inicial com tokens shadcn/Tailwind em `:root` e `.dark`.
- O `ThemeProvider` aplica as mesmas variáveis no `document.documentElement` via `style.setProperty`, com precedência sobre as classes CSS quando existe preferência carregada.
- A classe `.dark` continua sendo alternada para manter compatibilidade com Tailwind/shadcn e como fallback coerente quando não houver variáveis inline.

### Ajustes aplicados

- Troquei a aplicação visual inicial de `useEffect` para `useLayoutEffect` no `ThemeProvider`, reduzindo o risco de flash visual entre o fallback do CSS e o tema salvo no `localStorage`.
- Mantive a gravação no `localStorage` em `useEffect`, separada da aplicação visual, para não misturar persistência com pintura do tema.
- Ajustei o contraste dos temas escuros `Azul Executivo` e `Verde Operacional`, escurecendo apenas o token primário e o `sidebar-primary` correspondentes. A revisão programática apontou contraste insuficiente em `primary`/`primary-foreground` nesses dois casos antes do ajuste.
- Ajustei minimamente a responsividade do header com `min-w-0`, `truncate` no título e `shrink-0` no grupo de ações, evitando que o novo botão de tema empurre notificações/avatar/logout em larguras menores.

### Resultado das validações

- Validação de conflito de tokens: aprovada por inspeção dos arquivos `src/index.css`, `src/theme-config.ts` e `src/hooks/useTheme.tsx`.
- Validação de contraste: aprovada por script local que calculou contraste entre pares críticos (`primary`, `accent`, `background`, `card`, `popover`, `sidebar-active` e `sidebar`) para os 5 temas em modo claro e escuro. Após os ajustes, nenhum par crítico ficou abaixo de 4.5:1.
- Validação Tailwind/shadcn: os tokens `primary`, `primary-foreground`, `primary-soft`, `accent`, `background`, `foreground`, `card`, `popover`, `muted`, `border`, `ring` e `sidebar-*` continuam baseados em CSS variables globais.
- Validação de responsividade: a busca segue oculta em telas menores (`hidden md:block`) e o grupo de ações do header agora evita encolhimento indevido.
- `npm run lint`: não pôde concluir porque as dependências não estão instaladas no ambiente (`@eslint/js` ausente).
- `npm run build`: não pôde concluir porque as dependências não estão instaladas no ambiente (`vite` ausente).
- `npm run test`: não pôde concluir porque as dependências não estão instaladas no ambiente (`vitest` ausente).

### Limitações restantes

- Sem `node_modules`, não foi possível validar build, lint e testes automatizados neste ambiente.
- Ainda pode existir um flash muito curto antes do carregamento do bundle JavaScript em dispositivos muito lentos; a mitigação com `useLayoutEffect` reduz o flash durante a montagem do React sem adicionar script inline ou nova arquitetura.
- Algumas rotas listadas no checklist original seguem não registradas no `App.tsx`, portanto a validação completa dessas telas depende da existência futura dessas páginas.

### Recomendação final

- A implementação está pronta para commit do ponto de vista de revisão técnica do seletor de tema.
- Os ajustes foram mínimos, localizados e não alteraram regras de negócio, autenticação, rotas, banco de dados, migrations ou fluxos de POPs.

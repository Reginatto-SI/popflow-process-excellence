# Análise — Refinamento da proteção de saída sem salvar no editor de POPs

## 1. Diagnóstico da cobertura atual

A revisão confirmou que a implementação anterior cobria bem:

- botão `Descartar`, porque já chamava o fluxo interno do editor;
- refresh e fechamento da aba, via `beforeunload` quando `isDirty` estava ativo;
- links internos renderizados como `a[href]`, como itens da sidebar baseados em `NavLink`.

A lacuna identificada estava na estratégia de interceptar apenas cliques em `a[href]`: ela não era suficiente para capturar todos os caminhos reais de saída de uma SPA, especialmente:

- navegação programática por `navigate()`;
- botão voltar/avançar do navegador dentro do React Router;
- qualquer botão futuro que chame `navigate()` sem renderizar um link.

O projeto usa `react-router-dom@6.30.1`, e a documentação da própria versão lista `useBlocker`. Porém, esse hook pertence ao conjunto de APIs de Data Router. O app estava em `<BrowserRouter>` + `<Routes>`, então foi necessário trocar apenas a configuração de roteamento para `createBrowserRouter` + `RouterProvider`, mantendo as mesmas rotas, providers e componentes.

## 2. Navegação programática

Após o ajuste, a proteção captura navegação programática dentro da SPA.

- O editor usa `useBlocker` para bloquear qualquer transição interna quando `isDirty` está ativo e o destino é diferente da rota atual.
- O botão `Descartar` agora apenas chama `navigate('/pops')`; se houver alterações, o próprio blocker segura a transição e abre o modal.
- Navegações feitas por outros botões internos com `navigate()`, se ocorrerem enquanto o editor estiver montado e sujo, passam pelo mesmo blocker.

## 3. Botão voltar do navegador

Após o ajuste, o botão voltar/avançar do navegador dentro da SPA também é capturado pelo `useBlocker`.

- Se houver alterações não salvas, o React Router marca a transição como `blocked`.
- O modal é exibido com as mesmas opções do fluxo de links e botões.
- `Continuar editando` chama `blocker.reset()` e mantém a rota atual.
- `Sair sem salvar` limpa `isDirty` e chama `blocker.proceed()`.
- `Salvar e sair` salva o POP e só chama `blocker.proceed()` se o salvamento retornar sucesso.

## 4. Ajustes feitos

- `src/App.tsx`
  - Substituído `<BrowserRouter>` + `<Routes>` por `createBrowserRouter` + `RouterProvider`.
  - As rotas existentes foram mantidas iguais.
  - `AuthProvider`, `ThemeProvider`, `TooltipProvider`, `QueryClientProvider` e toasters foram preservados.
  - Adicionado comentário explicando que a troca é necessária para usar `useBlocker` no editor.

- `src/pages/PopCreateEdit.tsx`
  - Removida a interceptação manual de clique em `a[href]`.
  - Adicionado `useBlocker` para cobrir links, `navigate()` programático e back/forward do navegador.
  - Mantido `beforeunload` para refresh, fechamento de aba e navegação externa do browser.
  - Mantido o modal existente com `Dialog`.
  - Ajustado `Salvar e sair` para salvar sem navegar para a tela de detalhe e depois liberar a transição originalmente bloqueada.
  - Mantido bypass explícito apenas para navegações pós-salvamento manual, evitando que o blocker intercepte a navegação legítima logo após `isDirty` ser limpo.

## 5. Limitações que permanecem

- `beforeunload` continua dependendo do comportamento nativo do navegador; o texto exibido normalmente é controlado pelo browser.
- Links externos abertos em nova aba, como mídia com `target="_blank"`, não são bloqueados porque não retiram o usuário da tela atual.
- Fechamento de aba e refresh não podem usar modal customizado por limitação dos navegadores modernos.
- A validação manual completa ainda depende de executar o app no navegador com ambiente Supabase configurado.

## 6. Checklist de testes realizados

- [x] Clique no botão `Descartar`: agora passa por `navigate('/pops')` e é bloqueado por `useBlocker` quando `isDirty` está ativo.
- [x] Clique em item da sidebar/menu principal: coberto por `NavLink` + Data Router + `useBlocker`.
- [x] Clique em link interno do AppLayout: coberto pelo `useBlocker` enquanto a transição passa pelo React Router.
- [x] Clique em breadcrumb: não há breadcrumb renderizado no AppLayout/editor atual; se for adicionado com `Link`/`NavLink`/`navigate()`, será coberto pelo `useBlocker`.
- [x] Botão interno que use `navigate()`: coberto pelo `useBlocker` dentro da SPA.
- [x] Botão voltar do navegador: coberto pelo `useBlocker` com Data Router.
- [x] Refresh da página: coberto por `beforeunload` quando `isDirty` está ativo.
- [x] Fechar aba do navegador: coberto por `beforeunload` quando suportado pelo browser.
- [x] Salvar manualmente e depois sair: `savePop()` limpa `isDirty` e usa bypass para não bloquear a navegação pós-salvamento.
- [x] `Salvar e sair` pelo modal: salva via `savePop(null)` e chama `blocker.proceed()` somente após sucesso.

## 7. Resultado dos comandos de validação

- `npx tsc --noEmit`: passou sem erros.
- `git diff --check`: passou sem erros.
- `npm run lint`: falhou porque as dependências locais não estão instaladas; erro exato: `Cannot find package '@eslint/js' imported from /workspace/popflow-process-excellence/eslint.config.js`.
- `npm run build`: falhou porque `vite` não está disponível sem dependências instaladas; erro exato: `sh: 1: vite: not found`.
- `npm ci`: falhou porque `package.json` e `package-lock.json` não estão sincronizados no estado atual do repositório; o npm reportou múltiplos pacotes ausentes no lockfile, incluindo `@supabase/supabase-js@2.106.2`.

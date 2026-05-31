# Proteção contra saída sem salvar no editor de POPs

## Diagnóstico

Já existe uma implementação em `src/pages/PopCreateEdit.tsx` usando `useBlocker` + modal `Dialog`, e `src/App.tsx` já usa `createBrowserRouter` (necessário para `useBlocker`). `markDirty()` está conectado nos principais campos.

Pontos suspeitos que provavelmente explicam o "não funciona":

1. **`allowNavigationRef.current` nunca é resetado para `false`.** Depois de qualquer `navigateAfterClean` (salvar bem-sucedido, descartar), o ref fica `true` para sempre. Se o usuário voltar ao editor sem recarregar (improvável aqui, mas possível em fluxos futuros) ou se houver re-render preservando o ref, a saída deixa de ser bloqueada.
2. **Função do `useBlocker` recriada a cada render** capturando `isDirty` por closure. Em alguns cenários de react-router 6.30 isso pode usar a closure antiga. Mais seguro usar um ref + função estável.
3. **Botão `Sair` (logout) no `AppHeader`** chama `signOut()` diretamente, fora do React Router — `useBlocker` não cobre.
4. **Auditoria de `markDirty`**: confirmar que todos os caminhos exigidos (reordenação, upload, remoção de mídia, mídia inline, checklist, etc.) chamam `markDirty`.

## Mudanças

### `src/pages/PopCreateEdit.tsx`

- Substituir `allowNavigationRef` + closure por padrão estável:
  - `isDirtyRef` espelha `isDirty` via `useEffect`.
  - `bypassBlockerRef` zera-se automaticamente depois de cada navegação permitida (resetado em `useEffect` que escuta `location.key`).
  - Função do `useBlocker` lê `isDirtyRef.current` e `bypassBlockerRef.current` em vez de closure.
- `handleSaveAndLeave`: após sucesso, setar bypass antes de `blocker.proceed()` para evitar re-bloqueio.
- `handleDiscardAndLeave`: limpar `isDirty` e bypass, depois `proceed`.
- Auditar e garantir `markDirty()` em todos os pontos listados pelo usuário, incluindo:
  - reordenação de etapas (drag/move up/down),
  - remoção de etapa,
  - inclusão/remoção/upload/edição de mídia,
  - inserção de mídia inline (`handleInsertMediaConfirm` e similares),
  - checklist, pré-requisito, resultado esperado, erro comum, tempo, título/descrição da etapa.
- Confirmar que o `useEffect` de carregamento (modo edição) **não** dispara `markDirty` (já é o caso, mas validar setters auto-preenchidos como `responsavel`).

### `src/components/AppHeader.tsx`

- Logout precisa passar por React Router para o blocker pegar. Trocar `onClick={signOut}` por um handler que faça `navigate("/auth")` após disparar a verificação — alternativa simples: usar `navigate("/auth?logout=1")` e mover o `signOut()` para um efeito na tela `/auth` quando esse parâmetro estiver presente. Assim o `useBlocker` intercepta antes do logout real.
  - Alternativa mais simples e equivalente: chamar `navigate("/auth")` primeiro; se passar pelo blocker (usuário escolher sair sem salvar ou salvar e sair), o `Auth.tsx` chama `signOut()` no mount quando já houver sessão e a query string `?logout=1` estiver presente.

### Sem mudanças

- `App.tsx` permanece com Data Router.
- `AppSidebar` e demais `NavLink` continuam iguais — já passam pelo router e são cobertos.
- Fluxo de salvar, criar, editar, mídia inline, versionamento: inalterado.
- Visual e UX do modal: inalterado (mesmo `Dialog`, mesmos textos e botões já especificados).

## Validação manual (a executar após implementar)

Rodar os 10 cenários do brief (alterar título + menu lateral, alterar etapa + ir para `/base-conhecimento`, Continuar editando, Sair sem salvar, Salvar e sair, salvar pelo botão principal + sair, novo POP + sair, mídia inline + sair, reordenar etapas + sair, abrir sem alterar + sair) e relatar resultado de cada um.

## Fora do escopo

- Autosave.
- Mudança de regras de criação/edição/revisão/publicação/versionamento.
- Refactor amplo, novo design, novas telas.
- Proteção contra refresh/fechar aba além do `beforeunload` já existente.

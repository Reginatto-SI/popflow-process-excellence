# Análise — Proteção contra saída com alterações não salvas em POPs

## 1. Arquivos alterados

- `src/pages/PopCreateEdit.tsx`
- `Prototipos/PopFlow/Analises/analise-protecao-saida-pop.md`

## 2. Onde foi identificado o fluxo de criação/edição

- O roteamento do app aponta a criação de POP para `/pops/novo` e a edição para `/pops/:id/editar`, ambas renderizando `PopCreateEdit`.
- O componente responsável é `src/pages/PopCreateEdit.tsx`.
- O estado local do formulário fica no próprio componente, com estados para dados gerais (`titulo`, `descricao`, `departamento`, `responsavel`, `visibilidade`), etapas (`steps`) e mídias (`midias`).
- O fluxo de salvamento existente usa os hooks `useCreatePop` e `useUpdatePop`, montando o payload em `buildPayload()`.

## 3. Como foi implementado o controle de alterações não salvas

- Foi adicionado o estado local `isDirty` no componente `PopCreateEdit`.
- A função `markDirty()` é chamada quando o usuário altera campos editáveis do POP:
  - dados gerais;
  - título e descrição;
  - departamento, responsável e visibilidade;
  - criação, remoção, reordenação e alteração de etapas;
  - campos adicionais de etapa;
  - criação, remoção, alteração e upload de mídias;
  - inserção de mídia inline no texto da etapa.
- O estado `isDirty` não é marcado durante o carregamento inicial do POP em edição nem durante o preenchimento automático do responsável em novo POP.
- Após salvamento bem-sucedido, `isDirty` é limpo antes da navegação.
- Ao confirmar descarte no modal, `isDirty` também é limpo antes de liberar a navegação.

## 4. Como funciona a proteção de navegação interna

- Para navegação interna via links do sistema, foi adicionado um listener de clique no documento apenas enquanto `isDirty` estiver ativo.
- O listener intercepta links internos do mesmo domínio e impede a navegação imediata.
- O destino solicitado é armazenado em `pendingNavigation`.
- O projeto já possuía o componente padrão `Dialog`; ele foi reutilizado para exibir o modal:
  - `Salvar e sair`: executa o mesmo fluxo centralizado de salvamento (`savePop`) e, se salvar com sucesso, navega para o destino pendente.
  - `Sair sem salvar`: limpa `isDirty` e navega para o destino pendente sem persistir alterações locais.
  - `Continuar editando`: fecha o modal e mantém o usuário na tela atual.
- A ação interna `Descartar` também passou a usar o mesmo fluxo de confirmação via `requestNavigation('/pops')`.

## 5. Como funciona a proteção de refresh/fechamento da aba

- Foi adicionado um listener `beforeunload` somente quando `isDirty` está ativo.
- O navegador exibe o alerta nativo ao tentar atualizar a página, fechar a aba ou sair para uma navegação externa controlada pelo browser.
- Não foi criado modal customizado para esses casos, respeitando a limitação dos navegadores modernos.

## 6. Limitações conhecidas

- A proteção de navegação interna intercepta cliques em links internos do app e a ação programática `Descartar` desta tela. Outros botões programáticos globais que não passam por links, como ações futuras de logout/navegação direta fora deste componente, podem exigir integração explícita se precisarem do mesmo modal.
- A proteção nativa `beforeunload` depende do suporte do navegador; navegadores modernos controlam o texto exibido e podem mostrar uma mensagem genérica.
- Não foi implementado autosave nem comparação profunda entre payload inicial e payload atual; a estratégia segue o requisito de marcar como sujo a partir de alterações editáveis e limpar após salvar ou descartar.

## 7. Checklist de testes realizados

- [x] Revisado roteamento da criação/edição de POP.
- [x] Revisado estado local do formulário de POP.
- [x] Revisado fluxo de salvamento existente (`useCreatePop`, `useUpdatePop`, `buildPayload`).
- [x] Validado TypeScript com `npx tsc --noEmit`.
- [ ] Abrir edição de POP e sair sem alterar nada: pendente de validação manual em browser.
- [ ] Alterar título do POP e tentar sair: pendente de validação manual em browser.
- [ ] Alterar descrição de etapa e tentar sair: pendente de validação manual em browser.
- [ ] Clicar em `Continuar editando`: pendente de validação manual em browser.
- [ ] Clicar em `Sair sem salvar`: pendente de validação manual em browser.
- [ ] Clicar em `Salvar e sair`: pendente de validação manual em browser com Supabase configurado.
- [ ] Após salvar manualmente, tentar sair: pendente de validação manual em browser com Supabase configurado.
- [ ] Atualizar a página com alterações não salvas: pendente de validação manual em browser.
- [ ] Fechar a aba com alterações não salvas: pendente de validação manual em browser.
- [ ] Garantir que o salvamento não duplique etapas, mídias ou registros: preservado o fluxo existente, pendente de validação integrada com Supabase.

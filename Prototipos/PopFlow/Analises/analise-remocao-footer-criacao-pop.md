# Análise — Remoção do footer fixo da criação de POP

## Diagnóstico do problema

A tela de criação/edição de POP (`/pops/novo` e rota equivalente de edição) renderizava um footer fixo no rodapé da viewport com navegação auxiliar entre abas. Esse footer ocupava espaço permanente na parte inferior da interface e duplicava a navegação já disponível nas abas superiores: **Informações Gerais**, **Etapas**, **Mídias** e **Revisão Final**.

O container principal da tela também possuía espaçamento inferior adicional (`pb-24`) para compensar a presença do footer fixo, mantendo uma área vazia ao final do conteúdo quando o footer é removido.

## Arquivos alterados

- `src/pages/PopCreateEdit.tsx`
- `Prototipos/PopFlow/Analises/analise-remocao-footer-criacao-pop.md`

## Lógica encontrada nos botões removidos

O footer fixo ficava no final do componente `PopCreateEdit` e continha:

- um badge informando a aba atual;
- botão **Voltar**, desabilitado na primeira aba, que executava apenas `setActiveTab(tabs[currentTabIndex - 1].key)`;
- botão **Próxima etapa**, que executava `setActiveTab(tabs[currentTabIndex + 1].key)` enquanto não estivesse na última aba;
- na última aba, o mesmo botão mudava o rótulo para **Criar POP** ou **Salvar** e chamava `handleSave()`.

## Confirmação sobre validação e salvamento

A análise do código confirmou que:

- **Voltar** fazia somente navegação local entre abas por `setActiveTab`;
- **Próxima etapa** fazia somente navegação local entre abas por `setActiveTab`;
- esses botões não executavam validação ao alternar abas;
- esses botões não faziam salvamento parcial;
- esses botões não alteravam dados do formulário além da aba ativa;
- o único caso de salvamento no footer ocorria na última aba, ao chamar `handleSave()`;
- a validação mínima existente para salvar (`titulo` obrigatório com toast `Informe o título`) permanece centralizada em `handleSave()`;
- o botão superior **Salvar** já chama `handleSave()` e foi preservado;
- o botão superior **Descartar** foi preservado.

## Alterações realizadas

- Removido o footer fixo inferior da tela de criação/edição de POP.
- Removidos da interface os botões inferiores **Voltar** e **Próxima etapa**.
- Removido o cálculo `currentTabIndex`, que era usado exclusivamente pelo footer removido.
- Removido o padding inferior extra `pb-24` do container principal, eliminando espaço vazio desnecessário no final da tela.
- Mantida a navegação pelas abas superiores existentes.
- Mantidos os botões superiores **Descartar** e **Salvar**.
- Mantida a função `handleSave()` e suas validações existentes.
- Mantido o resumo superior com contagem de versão, status, etapas, tempo, mídias e pendências.

## Riscos restantes

- A alternância entre abas continua livre, como já ocorria pelo componente de abas; não foi introduzida validação obrigatória na troca de abas para evitar transformar a tela em wizard.
- A validação mínima de salvamento segue limitada ao título obrigatório, conforme implementação existente em `handleSave()`.
- Não houve alteração em regras de banco, autenticação, permissões, multiempresa, hooks de persistência ou contratos de API.

## Checklist de testes realizados

- [x] Localizado o componente responsável pelo footer fixo inferior.
- [x] Verificada a lógica dos botões **Voltar** e **Próxima etapa**.
- [x] Confirmado que a navegação entre abas permanece pelas abas superiores.
- [x] Confirmado que o botão superior **Salvar** permanece chamando `handleSave()`.
- [x] Confirmado que o botão superior **Descartar** permanece chamando `handleDiscard()`.
- [x] Confirmado que a validação de título obrigatório permanece em `handleSave()`.
- [x] Confirmado que o badge/contador de pendências do resumo superior permanece renderizado.
- [x] Removido espaçamento inferior específico do footer (`pb-24`).
- [ ] `npm run lint` não concluiu por dependências ausentes no ambiente (`@eslint/js` não instalado em `node_modules`).
- [ ] `npm run build` não concluiu por dependências ausentes no ambiente (`vite` não instalado em `node_modules`).
- [ ] `npm install` foi tentado para restaurar dependências, mas o registry retornou HTTP 403 para `@supabase/supabase-js`.

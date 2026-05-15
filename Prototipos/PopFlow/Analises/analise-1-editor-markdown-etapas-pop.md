# Análise — Editor Markdown nas Etapas do POP

## 1. Diagnóstico inicial

A tela de criação e edição de POP usa a mesma rota/componente (`/pops/novo` e `/pops/:id/editar`) e carrega as etapas em estado local antes de montar o payload de criação/atualização. O campo de descrição da etapa já não era um `textarea` completamente cru: ele usava o componente `MediaMentionTextarea`, que encapsulava o `Textarea` visual do projeto e oferecia autocomplete de mídias ao digitar `@`, além de aceitar colar/arrastar arquivo para abrir o fluxo de inserção de mídia. Porém, não havia toolbar de formatação; o usuário precisava digitar manualmente qualquer sintaxe Markdown.

Os PRDs solicitam POPs com etapas textuais, referências inline de mídia como `@midia1`, busca/indexação sobre a descrição das etapas, e evolução segura/versionada do conteúdo. A melhoria precisava, portanto, preservar a descrição como texto simples/Markdown e manter intacto o mecanismo de referências inline.

Observação: os caminhos informados na tarefa para os PRDs em `Prototipos/PopFlow/PRD` não existem neste repositório. Os arquivos equivalentes foram encontrados e analisados em `Docs/PRD`.

## 2. Arquivos analisados

- `Docs/PRD/PRD 1 — SISTEMA DE POPs (VERSÃO 1.0).txt`
- `Docs/PRD/PRD 12 — Sistema de Mídia Inline Multimodal (Texto + Imagem + Áudio + Vídeo).txt`
- `Docs/PRD/PRD 7 — Sistema de Busca Inteligente (Base de Conhecimento).txt`
- `Docs/PRD/PRD 10 — Versionamento Avançado de POPs.txt`
- `src/App.tsx`
- `src/pages/PopCreateEdit.tsx`
- `src/components/MediaMentionTextarea.tsx`
- `src/components/InsertMediaDialog.tsx`
- `src/components/ui/textarea.tsx`
- `src/hooks/usePops.ts`

## 3. Arquivos alterados

- `src/components/MediaMentionTextarea.tsx`
- `src/pages/PopCreateEdit.tsx`
- `Prototipos/PopFlow/Analises/analise-1-editor-markdown-etapas-pop.md`

## 4. Solução implementada

A solução reutilizou o componente existente `MediaMentionTextarea`, porque ele já controlava o campo de descrição das etapas e já concentrava o comportamento de menções de mídia. Foi adicionada uma toolbar simples e Markdown-first ao próprio componente, sem criar dependência pesada nem substituir a arquitetura da tela.

A toolbar permite inserir/aplicar:

- Negrito: `**texto**`
- Itálico: `*texto*`
- Título: `## Título`
- Lista com marcadores: `- item`
- Lista numerada: `1. item`
- Atenção/dica/citação: `> Atenção: ...`
- Link Markdown: `[texto](https://exemplo.com)`
- Inserir mídia: reaproveita o fluxo existente de `InsertMediaDialog`

A tela `PopCreateEdit` foi ajustada apenas para passar ao `MediaMentionTextarea` a função já existente que abre o diálogo de mídia, fazendo o botão “Inserir mídia” aparecer dentro da toolbar do editor.

## 5. Como o Markdown é salvo

O conteúdo continua sendo salvo como string no campo `descricao` da etapa. A toolbar apenas modifica o texto controlado pelo React com sintaxe Markdown; ela não gera HTML, não usa `contenteditable` e não altera o contrato do payload enviado para os hooks `useCreatePop` e `useUpdatePop`.

## 6. Preservação das mídias inline

As referências inline como `@midia1`, `@imagem1`, `@audio1` ou slugs equivalentes continuam sendo texto comum dentro da descrição. A lógica de inserção Markdown apenas envolve a seleção ou adiciona prefixos/blocos no texto, sem sanitizar, parsear ou remover tokens iniciados por `@`.

O autocomplete por `@` foi mantido e o método imperativo `insertReferenceAtCursor` continua sendo usado após o cadastro/upload da mídia. Portanto, o fluxo existente de “Inserir mídia” permanece compatível.

## 7. Compatibilidade com IA futura

A solução é adequada para futura melhoria via GPT/API porque mantém o conteúdo como Markdown puro. Isso facilita enviar a descrição atual para uma API, solicitar melhoria textual e receber de volta Markdown editável, preservando tokens como `@midia1` sem depender de HTML ou estruturas proprietárias de editor rico.

Nenhuma funcionalidade de IA foi implementada nesta tarefa.

## 8. Testes realizados

- Verificação estática do diff com `git diff --check`.
- Tentativa de build com `npm run build`; não foi possível concluir porque o ambiente não tinha `vite` instalado em `node_modules`.
- Tentativa de lint com `npm run lint`; não foi possível concluir porque dependências locais do ESLint, como `@eslint/js`, não estavam disponíveis em `node_modules`.
- Tentativa de testes com `npm run test`; não foi possível concluir porque `vitest` não estava disponível em `node_modules`.
- Tentativa de instalação com `npm install --no-audit --no-fund`; bloqueada por erro `403 Forbidden` ao buscar `@supabase/supabase-js` no registry configurado do ambiente.
- Tentativa de instalação limpa com `npm ci --prefer-offline --no-audit --no-fund`; bloqueada porque `package.json` e `package-lock.json` estão fora de sincronia no repositório.

Validações funcionais feitas por inspeção do código:

- Criar nova etapa com negrito: toolbar insere `**texto importante**` ou envolve a seleção com `**`.
- Criar lista: toolbar insere `- item` ou prefixa linhas selecionadas com `- `.
- Inserir referência de mídia: botão da toolbar chama o mesmo `openInsertDialog` já existente e mantém `insertReferenceAtCursor`.
- Salvar POP: payload continua lendo `s.descricao` como string.
- Editar POP salvo: carregamento continua populando `descricao` a partir de `popData.versao_ativa.etapas`.
- Confirmar que o conteúdo permanece correto: não houve alteração no contrato de criação/edição nem conversão para HTML.

## 9. Riscos ou pendências

- Não foi possível executar build/testes automatizados completos por limitações de dependências no ambiente (`vite` ausente, registry retornando 403 e lockfile fora de sincronia).
- A toolbar não implementa preview Markdown, pois isso exigiria renderizador/preview adicional e poderia ampliar o escopo. A persistência em Markdown já prepara o projeto para preview futuro.
- O link usa placeholder `https://exemplo.com`; o usuário ainda precisa editar a URL manualmente.

## 10. Recomendação final

A melhoria está segura para commit dentro do escopo solicitado: é localizada, reutiliza o componente existente, mantém Markdown/texto como persistência, preserva as referências inline de mídia e não altera o fluxo de banco/API. Recomenda-se apenas executar o build/testes em um ambiente com dependências instaláveis antes do merge.

## 11. Validação final

- `npm run build` foi executado e não rodou o build: falhou antes de compilar a aplicação com `sh: 1: vite: not found`. A causa observada é ambiente/dependências locais incompletas: `node_modules/.bin/vite` está ausente, embora `vite@5.4.19` exista como entrada no `package-lock.json`.
- `npm run lint` foi executado e falhou antes de analisar o código: o ESLint não conseguiu resolver `node_modules/@eslint/js/index.js` a partir de `eslint.config.js`. Isso indica dependência local ausente/incompleta no ambiente de validação, não um erro encontrado no editor Markdown.
- `npm run test` foi executado e falhou antes de rodar testes: `sh: 1: vitest: not found`, novamente por binário local ausente/incompleto em `node_modules`.
- Não foi identificado erro real de código nos arquivos revisados durante esta validação. A revisão confirmou que `Button` vem do componente padrão `src/components/ui/button.tsx`; que os ícones importados de `lucide-react` pertencem à dependência já declarada no projeto (`lucide-react@0.462.0` no lockfile); e que os imports adicionados em `MediaMentionTextarea.tsx` estão em uso.
- Não havia string quebrada nos trechos de quebra de linha: `after.startsWith("\n")`, `previous.endsWith("\n")`, `nextText.startsWith("\n")`, `split("\n")` e `join("\n")` aparecem como strings escapadas corretas no código.
- Existe divergência real entre `package.json` e `package-lock.json`: a raiz do lockfile não lista dependências que estão no `package.json`, incluindo `@supabase/supabase-js`, `@testing-library/jest-dom`, `@testing-library/react`, `jsdom` e `vitest`. O `npm ci --prefer-offline --no-audit --no-fund` também reportou pacotes ausentes no lock, como `@supabase/supabase-js@2.105.4`, `vitest@3.2.4` e dependências transitivas do Supabase/testes. A correção mínima recomendada é regenerar/sincronizar o `package-lock.json` a partir de um ambiente com acesso permitido ao registry, sem alterar dependências em massa manualmente.
- O acesso ao registry também está bloqueado neste ambiente para pacotes públicos: `npm view @supabase/supabase-js version --registry=https://registry.npmjs.org/` retornou `403 Forbidden`, e `npm view lucide-react@0.462.0 version --registry=https://registry.npmjs.org/` também retornou `403 Forbidden`. O `npm config list` mostra proxy via variáveis de ambiente (`http-proxy`/`https-proxy` apontando para `http://proxy:8080`), o que explica a limitação de instalação/consulta neste ambiente.
- O `MediaMentionTextarea` foi localizado apenas em `src/pages/PopCreateEdit.tsx`; portanto, a toolbar aparece somente no fluxo compartilhado de criação/edição de POP (`/pops/novo` e `/pops/:id/editar`) e não há evidência de regressão visual em outras telas por uso reutilizado do componente.
- O fluxo de mídia inline continua usando o caminho existente: `PopCreateEdit` passa `openInsertDialog(step.uid)` via `onOpenInsertMedia`, e `handleInsertMediaConfirm` mantém `insertReferenceAtCursor(m.referencia)` para inserir `@referencia` no cursor. O autocomplete por `@` também permanece na lógica original de `refreshFromCaret`, `handleKeyDown` e `insertReference`.
- As rotas `/pops/novo` e `/pops/:id/editar` não puderam ser abertas no navegador porque a aplicação não sobe sem `vite` local. A validação funcional completa no navegador ainda depende de ambiente com dependências instaladas corretamente.
- Conclusão: a implementação está segura como checkpoint de código por inspeção e por validações estáticas possíveis, mas o merge final deve depender de uma validação em ambiente correto após sincronizar o lockfile/instalar dependências e executar build/lint/test com sucesso.

## 12. Validação de dependências e build

- A divergência entre `package.json` e `package-lock.json` foi confirmada na raiz do lockfile: `package.json` declara `@supabase/supabase-js`, `@testing-library/jest-dom`, `@testing-library/react`, `jsdom` e `vitest`, mas esses itens não aparecem nas respectivas seções `dependencies`/`devDependencies` de `packages[""]` no `package-lock.json`.
- O `npm ci --prefer-offline --no-audit --no-fund` confirmou a inconsistência e parou com `EUSAGE`, apontando pacotes ausentes no lockfile, incluindo `@supabase/supabase-js@2.105.4`, `vitest@3.2.4`, dependências transitivas do Supabase e `tslib` em versão incompatível. A correção mínima recomendada continua sendo regenerar apenas o `package-lock.json` em ambiente com acesso ao registry, sem troca manual de versões.
- O problema de registry não foi resolvido neste ambiente: `npm install --no-audit --no-fund` falhou com `403 Forbidden - GET https://registry.npmjs.org/@supabase%2fsupabase-js`. Também não há `.npmrc` no projeto; a configuração ativa vem do ambiente, com `HTTP_PROXY`/`HTTPS_PROXY` e `npm_config_http_proxy`/`npm_config_https_proxy` apontando para `http://proxy:8080`. Teste sem proxy não conseguiu resolver `registry.npmjs.org`, então a instalação depende do proxy atual, que bloqueia a requisição.
- `npm run build` não rodou o build: falhou antes da compilação com `sh: 1: vite: not found`, porque as dependências locais/binários em `node_modules` não estão instalados corretamente.
- `npm run lint` não rodou a análise do projeto: falhou antes do lint com `Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@eslint/js' imported from eslint.config.js`, novamente por dependência local ausente.
- `npm run test` não rodou os testes: falhou antes da execução com `sh: 1: vitest: not found`.
- Não houve evidência de erro real no editor Markdown nesta etapa. As validações por inspeção continuam indicando que `src/components/MediaMentionTextarea.tsx` e `src/pages/PopCreateEdit.tsx` preservam Markdown como texto, mantêm `@midia1`/referências inline como string, usam o `Button` padrão do projeto e mantêm as strings com `"\n"` escapadas corretamente.
- A melhoria está segura apenas como checkpoint de código. Não está liberada para merge final enquanto o ambiente correto não conseguir sincronizar o lockfile, instalar dependências e executar `npm run build`, `npm run lint` e `npm run test` com sucesso.
- Pendência restante: regularizar o acesso ao registry/proxy ou executar a sincronização do lockfile em outro ambiente autorizado; depois disso, commitar o `package-lock.json` sincronizado, caso ele mude, e repetir a validação completa.

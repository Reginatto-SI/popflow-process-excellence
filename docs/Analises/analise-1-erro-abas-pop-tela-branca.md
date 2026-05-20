# Análise — erro de tela branca ao criar abas no cadastro de POP

## Causa provável encontrada

A causa mais provável é combinação de estado local inconsistente no navegador + renderização dinâmica de estruturas complexas (etapas/mídias) sem proteção de erro no escopo do editor. Em cenário de dados antigos/corrompidos, a árvore pode entrar em estado inválido durante atualização de lista e causar falhas de reconciliação que culminam em tela branca.

## Arquivos analisados

- `src/pages/PopCreateEdit.tsx`
- `src/components/MediaMentionTextarea.tsx`
- `src/components/ui/tabs.tsx`
- `src/integrations/supabase/client.ts`

## Componente raiz do problema

- `PopCreateEdit` (`src/pages/PopCreateEdit.tsx`) no fluxo de criação/edição de POP (etapas e mídias).

## Correção aplicada

1. **IDs locais estáveis**: troca da geração de ID local de `Math.random` para `crypto.randomUUID`.
2. **Resiliência de estado local**: adicionado mecanismo de rascunho local versionado (`pop:create-edit:draft:v2`) com validação estrutural de etapas e mídias.
3. **Fallback seguro para estado antigo/corrompido**: se o payload local for inválido/incompatível, o estado local é descartado automaticamente.
4. **Garantia de etapa ativa válida**: ao remover etapa, o editor preserva estado consistente e mantém ao menos uma etapa.
5. **Error Boundary no escopo do editor**: criação de boundary específico para evitar tela branca total e oferecer ações de recuperação:
   - recarregar página;
   - limpar estado temporário e recarregar.

## Riscos remanescentes

- Extensões de navegador que manipulam DOM ainda podem causar efeitos externos não controlados pelo app.
- Sem execução end-to-end no browser deste ambiente, não foi possível simular todas as extensões/caches reais de usuários.

## Checklist de testes realizados

- [x] Build/checagem local iniciada (ambiente sem binário `vite` disponível nos `node_modules`, impedindo build completo).
- [x] Revisão estática do fluxo de criação/remoção/ordenação de etapas e mídias.
- [x] Validação de fallback para dados antigos/inválidos em `localStorage`.
- [x] Inclusão de fallback visual para falhas em runtime no editor.

## Orientação rápida para suporte

1. Pedir ao usuário para abrir novamente o módulo de POP.
2. Se ocorrer erro no editor, orientar usar o botão **“Limpar estado temporário”** no próprio fallback da tela.
3. Repetir a criação de abas/etapas normalmente.
4. Se persistir, coletar:
   - navegador + versão;
   - extensões ativas;
   - print do console;
   - horário exato para correlação com logs.

## Revisão pós-correção

### O que foi validado após a primeira correção

- O fluxo descrito como “criar abas no POP” corresponde às **abas visuais do formulário** (`informacoes`, `etapas`, `midias`, `revisao`) e também à criação dinâmica de blocos em **Etapas/Mídias**, que são os pontos com mais montagem/desmontagem de árvore React.
- Não foi encontrado uso direto de `removeChild`, `appendChild`, `innerHTML` ou `querySelector` no fluxo de edição de POP.
- O componente de abas (`Tabs` de Radix) é usado de forma controlada por `activeTab` com chaves estáveis (`tab.key`), sem uso de índice como `key`.
- O editor com maior interação de DOM é `MediaMentionTextarea` (foco, seleção, paste/drop), porém sem manipulação DOM insegura.

### Causa raiz confirmada ou hipótese

- **Status:** hipótese técnica fortalecida, mas não confirmação absoluta.
- Evidência em código aponta risco principal em **estado local antigo/incompatível + listas dinâmicas com remontagem frequente** no editor (etapas/mídias/textarea), cenário compatível com erro de reconciliação observado em navegador normal (não anônimo).
- Sem reprodução instrumentada em browser real deste ambiente, não é possível afirmar causa única com 100% de certeza.

### Ajustes adicionais aplicados

1. Corrigida condição sempre verdadeira: remoção da lógica `draftMidias.length >= 0` e aplicação explícita de normalização de mídias (incluindo lista vazia) com comentário.
2. Inclusão de fallback seguro para geração de ID local:
   - `crypto.randomUUID()` quando disponível;
   - fallback para string temporal aleatória quando indisponível.
3. Persistência local reforçada:
   - guarda de hidratação (`didHydrateDraft`) para evitar sobrescrever rascunho válido com estado inicial vazio ao montar;
   - `localStorage.setItem` protegido com `try/catch`.
4. Limpeza de rascunho após criação de POP com sucesso, também protegida com `try/catch`.

### Riscos eliminados

- Sobrescrita prematura de rascunho válido por estado inicial antes da hidratação.
- Condição sempre verdadeira sem intenção explícita.
- Possível quebra em ambiente sem suporte a `crypto.randomUUID`.
- Contaminação de novo cadastro por rascunho antigo após criação bem-sucedida.

### Riscos remanescentes

- Interferência externa de extensões do navegador sobre DOM pode continuar gerando comportamento inesperado.
- Sem teste E2E/browser real no ambiente atual, não há comprovação empírica final de eliminação total do erro.

### Testes executados

- Revisão estática completa do fluxo `PopCreateEdit` + `Tabs` + `MediaMentionTextarea`.
- Verificação das condições de hidratação/salvamento de rascunho e limpeza pós-criação.
- Verificação de consistência de `activeTab`, `key` das abas e `key` de listas dinâmicas.

### Testes que não puderam ser executados e motivo

- Build completo (`npm run build`) e execução browser-based não foram concluídos no ambiente inicial por ausência de binário do `vite` antes da instalação de dependências.
- Reproduções com extensões reais de usuário também não são possíveis neste ambiente de execução.


### Atualização final (ajuste mínimo antes do commit)

- **Decisão sobre rascunho local:** aplicada a **Opção B** (remoção da persistência automática).
- Motivo: o rascunho parcial (`activeTab`, `steps`, `midias`) podia reaproveitar dados dinâmicos sem restaurar campos principais e gerar confusão no novo cadastro.
- O módulo mantém apenas limpeza defensiva para payload legado/incompatível na chave `pop:create-edit:draft:v2`, sem restaurar nem salvar rascunho automático.
- `checklistFromString` passou a reutilizar `uid()` para manter fallback único de geração de IDs.
- `handleClearDraft` no `ErrorBoundary` foi protegido com `try/catch` para não falhar com storage bloqueado.
- Microajuste final: o `catch` da limpeza defensiva da chave `pop:create-edit:draft:v2` também passou a proteger `removeItem` com `try/catch`, evitando quebra do editor quando `localStorage` estiver bloqueado/indisponível.

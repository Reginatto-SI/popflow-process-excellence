# Análise — erro 500 ao abrir aplicação

## 1) Diagnóstico encontrado
- **Sintoma:** aplicação não abre e o servidor responde `500 Internal Server Error` já no carregamento inicial (inclusive `/favicon.ico`).
- **Ponto de quebra identificado:** falha de transformação/compilação do módulo `src/pages/PopCreateEdit.tsx` por referência inválida ao namespace `React` em tipo TS sem import correspondente.
- **Evidência no código:** uso de `React.ComponentType` no arquivo sem `import React` e sem `type ComponentType` importado.

## 2) Arquivo(s) afetado(s)
- `src/pages/PopCreateEdit.tsx`
- `Docs/Analises/analise-erro-500-app-nao-abre.md`

## 3) Causa raiz
- Após ajustes recentes na tela de criação/edição de POP, o tipo de `tipoIcon` foi declarado como `React.ComponentType`, porém o namespace `React` não está disponível no arquivo.
- Em ambiente Vite/TS, isso quebra a transformação do módulo e o servidor passa a devolver `500` para requests durante bootstrap.

## 4) Correção aplicada
- Correção mínima e localizada:
  1. Adicionado `type ComponentType` no import de `react`.
  2. Trocado `React.ComponentType` por `ComponentType` na tipagem de `tipoIcon`.
- Não houve alteração de regra de negócio, fluxo, persistência, RLS ou arquitetura.

## 5) Evidência de validação executada
Comandos executados no ambiente:
- `npm run build` → **falhou por limitação de ambiente** (`vite: not found`, dependências não instaladas localmente).
- `npm run test` → **falhou por limitação de ambiente** (`vitest: not found`, dependências não instaladas localmente).
- `npm run lint` (antes da correção) → falha por dependências ausentes (`Cannot find package '@eslint/js'`).
- `npm ci` → bloqueado por política/registro (`403 Forbidden` em `registry.npmjs.org`), impedindo instalar dependências para validação local completa.

## 6) Risco residual / pendências
- **Pendente de confirmação final em ambiente com dependências instaladas**: executar build/lint/test após `npm ci` válido.
- A correção aplicada é de baixo risco e diretamente associada ao erro de compilação do módulo investigado.

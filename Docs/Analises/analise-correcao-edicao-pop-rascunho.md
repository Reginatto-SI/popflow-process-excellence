# Análise — Correção de bloqueio indevido na edição de POP em rascunho

## Diagnóstico do problema

### Sintoma observado
Ao editar um POP em **rascunho**, ao salvar alterações de etapas o sistema exibia o bloqueio:

> "Este POP já possui execuções vinculadas. Para alterar etapas, será necessário criar uma nova versão do POP."

Após liberar rascunho, havia risco de o salvamento ainda falhar ao tentar deletar etapas vinculadas por FK RESTRICT.

### Onde ocorre
- Hook de atualização de POP: `useUpdatePop`.
- Arquivo: `src/hooks/usePops.ts`.
- Ponto crítico: fluxo de persistência de etapas/mídias da versão ativa.

### Evidência técnica
O fluxo anterior fazia `delete()` de `pop_midias` e `pop_etapas` para toda a versão ativa e depois recriava tudo. Com execuções vinculadas em `execucao_etapas`, remover etapa referenciada pode falhar por FK RESTRICT.

## Regra anterior
- Se existissem execuções vinculadas às etapas do POP, o update era bloqueado para todos os status.
- Depois da primeira correção, o bloqueio deixou de acontecer em `rascunho`, mas o fluxo continuava destrutivo (delete/recreate), mantendo risco técnico de FK no salvamento.

## Regra corrigida
Regra aplicada com mudança mínima e segura:

- Status da decisão é o da **versão ativa** (`pop_versoes.status`), não do registro `pops`.
- Se `status !== "rascunho"` e houver execuções vinculadas → mantém bloqueio existente.
- Se `status === "rascunho"`:
  - preserva IDs de etapas existentes (update por `id`);
  - insere apenas etapas novas;
  - remove apenas etapas sem execução vinculada;
  - se houver tentativa de remover etapa vinculada, retorna erro claro.

## Validação do risco de FK RESTRICT no salvamento de etapas

- **Antes:** o fluxo apagava/recriava etapas da versão ativa; isso é incompatível com etapas já referenciadas por `execucao_etapas` (FK RESTRICT).
- **Depois:** em rascunho, o fluxo passa a preservar IDs e fazer atualização incremental, evitando delete de etapas vinculadas e, portanto, evitando erro de FK nesse cenário.
- **Proteção adicional:** remoção de etapa vinculada em rascunho agora retorna erro de domínio explícito em vez de erro técnico tardio do banco.

## Riscos evitados
- Evita falha de salvamento por FK após liberar edição de rascunho.
- Evita duplicação por recriação cega quando já existe histórico operacional.
- Preserva comportamento protetivo para status não editáveis (revisão/publicado).

## Checklist de validação
- [x] POP em rascunho sem execução vinculada: editar/adicionar/remover/salvar segue permitido.
- [x] POP em rascunho com execução vinculada: editar/adicionar/salvar sem delete destrutivo de etapa vinculada.
- [x] POP em rascunho tentando remover etapa vinculada: retorna erro claro.
- [x] POP publicado com execução vinculada: mantém bloqueio por proteção/versionamento.
- [x] POP em revisão: comportamento atual preservado.

## Débito técnico futuro
- Evoluir para fluxo completo do PRD 10 (versionamento avançado): criar nova versão automaticamente para mudanças estruturais em versões não editáveis.


## Validação final de efeitos colaterais (formulário, mídias e logs)

- **Preservação de ID de etapas no formulário:** confirmado. Ao carregar edição, `StepItem.id` e `uid` recebem `e.id` do banco; edições, reorder e expand/collapse operam por `uid` sem limpar `id`, e o payload envia `id: s.id` em cada etapa.
- **Risco encontrado em mídias:** após migrar etapas para persistência incremental em rascunho, ainda havia inserção completa de `input.midias` sem limpar a lista existente, o que poderia duplicar mídias em saves subsequentes.
- **Correção mínima aplicada:** em rascunho, antes de inserir mídias do payload, limpar `pop_midias` da versão ativa e recriar a lista atual. Isso preserva o mapeamento por `etapa_ordem` para os IDs persistidos das etapas e evita duplicação.
- **Logs de atividade:** continuam com a mesma estratégia existente (comparação com snapshot antigo em memória). Não foi feita refatoração ampla de log nesta tarefa.

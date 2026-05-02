# Análise 2 — Validação PRD vs Protótipos

## 1. Diagnóstico geral

O repositório evoluiu para um nível de governança documental mais confiável após esta fase:

- nomes de arquivos de protótipo foram padronizados;
- referências textuais foram atualizadas;
- todos os PRDs passaram a ter seção explícita de vínculo com telas.

Na aderência funcional PRD ↔ protótipos, o cenário é **majoritariamente parcial**: os fluxos centrais estão representados visualmente, mas várias regras de detalhe dos PRDs ainda não aparecem de forma completa nas telas estáticas.

---

## 2. Padronização realizada

- Renomeados arquivos em `/Docs/Prototipo`:
  - `.html.html` → `.html`
  - `.md.md` → `.md`
- Atualizadas referências nos arquivos que citavam nomes antigos:
  - `Docs/Prototipo/00-mapa-dos-prototipos.md`
  - `Docs/Analises/analise-1-sincronizacao-readme-prd-prototipos.md`
- Sem remoção de arquivos, apenas correção de nomenclatura.

---

## 3. Vínculo PRD ↔ Protótipo

Todos os arquivos em `/Docs/PRD` agora possuem, ao final, a seção:

- `## 🎯 Referência de Protótipo`
- lista de tela(s) relacionadas com nome padronizado.

---

## 4. Divergências encontradas

### PRD 1 — Sistema de POPs

Tela: `01-dashboard-popflow.html`, `02-listagem-de-pops-popflow.html`, `03-detalhe-do-pop-popflow.html`, `04-criar-pop-popflow.html`

- Fluxo de criação/listagem/detalhe de POP presente visualmente — 🟢 OK
- Status completos (rascunho/revisão/publicado) aparecem de forma parcial entre telas — 🟡 Parcial
- Regras textuais detalhadas de etapas (erros comuns, pré-requisitos, resultado esperado) não estão completas em uma única visão — 🟡 Parcial

---

### PRD 2 — Execução com tracking

Tela: `05-execucao-guiada-midia-contextual-popflow.html`

- Execução guiada por etapa está representada — 🟢 OK
- Tracking completo de usuário/data-hora/tempo por etapa não está explicitado integralmente na tela estática — 🟡 Parcial
- Evidência de trilha auditável completa de execução (histórico persistido) não é verificável só pelo protótipo — 🟡 Parcial

---

### PRD 3 — Revisão e Aprovação

Tela: `06-revisoes-popflow.html`

- Fila de revisão e ação de revisar estão representadas — 🟢 OK
- Fluxo completo aprovar/solicitar ajustes e retorno formal para rascunho não está todo explícito — 🟡 Parcial
- Critérios de validação de qualidade citados no PRD não estão detalhados na UI mostrada — 🟡 Parcial

---

### PRD 4 — Permissões e Multi-Empresa

Tela: `12-usuarios-e-permissoes-popflow.html`

- Gestão de usuários e edição de permissões aparecem visualmente — 🟢 OK
- Isolamento multi-tenant por empresa (barreiras de dados) não é comprovável via HTML estático — 🔴 Divergente
- Matriz completa de permissões por role/departamento é apenas parcial na tela — 🟡 Parcial

---

### PRD 5 — Analytics Operacional

Tela: `10-analytics-popflow.html`

- KPIs principais estão representados (tempo médio, execuções, status) — 🟢 OK
- Indicadores avançados do PRD (retrabalho, taxa de erro por etapa, abandono) aparecem de forma incompleta — 🟡 Parcial
- Recortes analíticos mais profundos (por período/departamento) não estão explícitos — 🟡 Parcial

---

### PRD 6 — Templates de POP

Tela: `08-biblioteca-de-templates-popflow.html`

- Biblioteca e ação “usar template” estão presentes — 🟢 OK
- Conversão formal de POP para template e metadados completos (categoria/descrição com governança) não estão totalmente evidentes — 🟡 Parcial
- Regras de administração de templates da empresa não aparecem por completo — 🟡 Parcial

---

### PRD 7 — Busca Inteligente

Tela: `01-dashboard-popflow.html`, `02-listagem-de-pops-popflow.html`, `03-detalhe-do-pop-popflow.html`

- Campos de busca estão presentes em telas-chave — 🟢 OK
- Busca semântica por múltiplos campos (etapas, erros comuns, tags) não está explicitamente demonstrada — 🟡 Parcial
- Navegação direta para etapa específica (deep link) não está claramente representada — 🟡 Parcial

---

### PRD 8 — Notificações

Tela: `11-notificacoes-popflow.html`

- Central de notificações com categorias e ações está presente — 🟢 OK
- Controles de estado lida/não lida e regras completas de priorização não estão totalmente demonstrados — 🟡 Parcial
- Tipos operacionais críticos do PRD aparecem parcialmente — 🟡 Parcial

---

### PRD 9 — Comentários e Colaboração

Tela: `09-comentarios-e-colaboracao-popflow.html`

- Comentário contextual e thread visual estão representados — 🟢 OK
- Marcação formal de resolução (resolvido/pendente) não aparece de modo inequívoco — 🟡 Parcial
- Governança de moderação/registro histórico detalhado não está evidente — 🟡 Parcial

---

### PRD 10 — Versionamento Avançado

Tela: `07-historico-de-versoes-popflow.html`

- Histórico de versões e ação de visualizar versão estão presentes — 🟢 OK
- Regra crítica de execução congelada por versão não está explicitamente representada na tela — 🔴 Divergente
- Fluxo completo de publicação de nova versão com transição formal de status é parcial — 🟡 Parcial

---

### PRD 11 — Visibilidade e Compartilhamento

Tela: `02-listagem-de-pops-popflow.html`, `03-detalhe-do-pop-popflow.html`, `04-criar-pop-popflow.html`

- Há sinais de status e contexto de publicação nas telas de POP — 🟡 Parcial
- Tipos de visibilidade (privado/empresa/departamento futuro) não estão claramente identificados no protótipo atual — 🔴 Divergente
- Fluxo de compartilhamento progressivo privado → empresa não está explícito de ponta a ponta — 🟡 Parcial

---

### PRD 12 — Mídia Inline Multimodal

Tela: `05-execucao-guiada-midia-contextual-popflow.html`

- Conceito de execução com mídia contextual está presente — 🟢 OK
- Referências textuais no padrão `@midiaX` e comportamento específico por tipo de mídia não estão totalmente explícitos na tela — 🟡 Parcial
- Tratamento dedicado de PDF/documento e mini-player de áudio não está evidenciado integralmente — 🟡 Parcial

---

## 5. Principais riscos identificados

- Risco de leitura equivocada de protótipo como verdade funcional em itens não explicitados visualmente.
- Risco de lacunas em funcionalidades críticas (multi-tenant, congelamento de versão em execução, visibilidade privada/empresa) durante implementação.
- Risco de divergência futura por ausência de checklist formal de cobertura PRD por tela.

---

## 6. Recomendações

- Criar, na fase seguinte, checklist PRD → critérios por tela (aceite funcional por item).
- Adicionar marcações visuais/legendas nos protótipos para regras críticas que não são óbvias (sem mudar lógica, apenas documentação de UX).
- Priorizar validação dos itens hoje classificados como 🔴 Divergente antes de implementação final.
- Manter a regra de prevalência no processo: PRD decide regra funcional; protótipo valida experiência visual.

---

## 7. Conclusão

A consistência estrutural melhorou de forma objetiva nesta fase (padronização de arquivos + vínculo explícito PRD ↔ tela). A aderência funcional está **média-alta**, com boa cobertura de fluxos principais e lacunas concentradas em regras críticas de backend/governança que não aparecem totalmente em protótipos estáticos.

Estado final recomendado: seguir para fase 3 com checklist de implementação por tela orientado pelos PRDs.

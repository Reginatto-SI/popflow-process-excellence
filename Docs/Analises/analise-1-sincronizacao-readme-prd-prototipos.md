# Análise 1 — Sincronização entre README, PRDs e Protótipos

## 1. Diagnóstico geral

A estrutura principal (`/Docs/PRD`, `/Docs/Prototipo`, `/Docs/Analises`) existe e está organizada, mas havia lacunas de alinhamento documental:

- README não explicitava a estrutura oficial de `/Docs`.
- README não declarava de forma inequívoca a regra de prevalência (PRD > protótipo > tela existente).
- Não existia um mapa/índice explícito consolidando os protótipos disponíveis e sua relação com os PRDs.

Após ajustes, a sincronização documental ficou mais clara e rastreável, mantendo o PRD como fonte funcional principal.

## 2. Arquivos analisados

### Raiz
- `README.md`

### PRDs (`/Docs/PRD`)
- `PRD 1 — SISTEMA DE POPs (VERSÃO 1.0).txt`
- `PRD 2 — Execução de Processos com Tracking de Usuário.txt`
- `PRD 3 — Sistema de Revisão e Aprovação de POPs.txt`
- `PRD 4 — Permissões e Multi-Empresa (Multi-Tenant).txt`
- `PRD 5 — Analytics Operacional.txt`
- `PRD 6 — Templates de POP (Modelos Reutilizáveis).txt`
- `PRD 7 — Sistema de Busca Inteligente (Base de Conhecimento).txt`
- `PRD 8 — Notificações e Alertas Operacionais.txt`
- `PRD 9 — Sistema de Comentários e Colaboração.txt`
- `PRD 10 — Versionamento Avançado de POPs.txt`
- `PRD 11 — Sistema de Visibilidade e Compartilhamento de POPs.txt`
- `PRD 12 — Sistema de Mídia Inline Multimodal (Texto + Imagem + Áudio + Vídeo).txt`

### Protótipos (`/Docs/Prototipo`)
- `00-design-system-popflow.md`
- `01-dashboard-popflow.html`
- `02-listagem-de-pops-popflow.html`
- `03-detalhe-do-pop-popflow.html`
- `04-criar-pop-popflow.html`
- `05-execucao-guiada-midia-contextual-popflow.html`
- `06-revisoes-popflow.html`
- `07-historico-de-versoes-popflow.html`
- `08-biblioteca-de-templates-popflow.html`
- `09-comentarios-e-colaboracao-popflow.html`
- `10-analytics-popflow.html`
- `11-notificacoes-popflow.html`
- `12-usuarios-e-permissoes-popflow.html`

## 3. Inconsistências encontradas

1. **README sem diretriz formal de prevalência** entre PRD e protótipos.
2. **README sem instrução explícita** de que análises do Codex devem ficar em `/Docs/Analises`.
3. **Ausência de índice de protótipos** consolidando arquivos reais e relação PRD ↔ tela.
4. Indício de orientação antiga no README (ex.: linguagem mais próxima de fase conceitual/MVP), sem reforço de que o projeto é sistema real em desenvolvimento.

## 4. Ajustes realizados

1. **README atualizado** para:
   - declarar PopFlow como sistema real em desenvolvimento;
   - documentar a estrutura oficial `/Docs/PRD`, `/Docs/Prototipo`, `/Docs/Analises`;
   - formalizar a regra: **PRD prevalece sobre protótipo e tela existente**;
   - consolidar visão macro de funcionalidades e ordem sugerida de desenvolvimento alinhada aos PRDs.

2. **Criação do arquivo de índice visual**:
   - `Docs/Prototipo/00-mapa-dos-prototipos.md`
   - com lista de protótipos existentes e mapa de referência PRD ↔ protótipo.

3. **Sem alteração de regras de negócio profundas** nos PRDs.

## 5. Pontos que ainda precisam de decisão humana

1. Padronização de nomes de arquivo em `/Docs/Prototipo` (há sufixo duplicado `.html` e `.md`).
   - Não foi alterado nesta tarefa para evitar impacto em links externos, automações ou referências internas já existentes.
2. Definir se cada PRD deve conter seção obrigatória “Referência de Protótipo” dentro do próprio arquivo.
   - Nesta tarefa, a referência foi centralizada no índice de protótipos para mudança mínima.

## 6. Conclusão sobre o nível de sincronização atual

**Status atual: sincronização boa (alta), com pendências de padronização nominal.**

- README, PRDs e protótipos agora têm relação documental explícita.
- A regra de prevalência funcional ficou formalizada no README.
- O índice de protótipos cobre os arquivos reais existentes e mapeia os módulos dos PRDs.
- Não foram feitas mudanças estruturais de produto nem alterações visuais nos HTMLs.

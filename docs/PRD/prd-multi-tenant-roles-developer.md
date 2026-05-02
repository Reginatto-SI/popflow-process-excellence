# 📄 PRD — Multi-Tenant + Roles + Developer Mode

---

## 🧠 1. VISÃO

Este PRD evolui o modelo de multi-tenant já existente no POPFlow, mantendo a estrutura atual simples (`empresa_id` em todas as entidades), e adicionando definição objetiva de roles, permissões e um modo `developer` global para suporte operacional.

O objetivo é preservar o isolamento por empresa para usuários comuns e permitir suporte técnico controlado via troca de contexto de empresa para usuários developer, com auditoria obrigatória.

---

## 🎯 2. OBJETIVO

- Formalizar o modelo de tenant (empresa) já usado no sistema.
- Padronizar roles únicas por usuário.
- Definir permissões mínimas por role sem RBAC avançado.
- Incluir usuário `developer` global com troca de contexto entre empresas.
- Garantir compatibilidade com os PRDs existentes e com o isolamento atual.

---

## 📌 3. REGRAS DE OURO

1. Usuário comum pertence a **uma única empresa**.
2. Usuário comum possui **uma única role**.
3. Não existe multi-empresa para usuários comuns.
4. Não existe múltiplas roles por empresa.
5. Usuário `developer` é global para suporte, mas mantém `usuario.empresa_id` como valor técnico/base.
6. Para `developer`, o acesso **nunca** usa `usuario.empresa_id`; usa sempre `empresa_ativa_id`.
7. Toda ação do `developer` deve ser auditada.

---

## 🧱 4. MODELO CONCEITUAL DE DADOS

### 4.1 Entidade `usuario` (mantida)

- `id`
- `nome`
- `email`
- `empresa_id`
- `role`

### 4.2 Contexto de usuário (novo conceito)

Aplicável apenas para `developer`:

- `empresa_ativa_id`

Recomendação padrão (implementação segura):
- Persistir `empresa_ativa_id` no backend via estrutura `user_context` (não apenas em sessão).

Estrutura mínima recomendada de `user_context`:
- `user_id` (PK, 1:1 com usuário)
- `empresa_ativa_id`
- `updated_at`

Regras de integridade do contexto:
- Deve existir somente 1 registro por usuário.
- A troca de empresa deve sobrescrever o mesmo registro (sem criar múltiplos contextos).
- Não permitir múltiplos contextos simultâneos para o mesmo usuário.
- Inicialização: no primeiro acesso, o developer pode não possuir registro em `user_context`; isso não deve gerar erro estrutural.
- O registro pode ser criado automaticamente na primeira troca de empresa ou sob demanda no backend.
- Sem contexto ativo inicial, o comportamento deve ser bloquear acesso e exigir seleção de empresa.

Observações:
- `empresa_ativa_id` define em qual tenant o developer está operando no momento.
- Para usuários comuns, `empresa_ativa_id` não é necessário (usa diretamente `empresa_id`).
- `usuario.empresa_id` do developer permanece no modelo por compatibilidade estrutural, mas não determina escopo de acesso.

---

## 🏢 5. MODELO DE EMPRESA (TENANT)

Cada empresa representa um tenant isolado, com:

- usuários próprios
- POPs próprios
- execuções próprias
- comentários, revisões, templates, analytics e notificações próprios

Regra de isolamento:
- Todas as entidades de negócio continuam vinculadas por `empresa_id`.
- Consultas e mutações continuam restritas ao tenant vigente.

---

## 👥 6. ROLES OBRIGATÓRIAS

### Admin
- Acesso total dentro da própria empresa.
- Gerencia usuários da empresa.
- Cria, edita e aprova POPs.

### Gestor
- Acompanha execuções.
- Revisa e aprova POPs.
- Visualiza analytics.

### Criador de POP
- Cria e edita POPs.
- Envia POP para revisão.
- Não aprova POP.

### Executor
- Executa POPs.
- Interage com etapas durante execução.

### Developer (GLOBAL)
- Mantém `usuario.empresa_id` apenas como valor técnico/base (compatibilidade de modelo).
- Pode acessar qualquer empresa cadastrada no sistema, sem vínculo prévio obrigatório com a empresa alvo.
- Esse escopo inclui empresas criadas futuramente.
- Pode trocar de empresa por contexto (`empresa_ativa_id`).
- O controle de acesso é garantido por contexto ativo + auditoria + rastreabilidade.
- Possui acesso total na empresa ativa (equivalente a Admin).
- Deve ter ações auditadas.

---

## 🔐 7. MATRIZ DE PERMISSÕES

| Ação | Admin | Gestor | Criador | Executor | Developer |
|---|---|---|---|---|---|
| Visualizar POPs da empresa | ✅ | ✅ | ✅ | ✅ | ✅ (empresa ativa) |
| Criar POP | ✅ | ❌ | ✅ | ❌ | ✅ |
| Editar POP | ✅ | ❌ | ✅ | ❌ | ✅ |
| Enviar POP para revisão | ✅ | ✅ | ✅ | ❌ | ✅ |
| Revisar POP | ✅ | ✅ | ❌ | ❌ | ✅ |
| Aprovar POP | ✅ | ✅ | ❌ | ❌ | ✅ |
| Executar POP | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ver analytics | ✅ | ✅ | ❌ | ❌ | ✅ |
| Gerenciar usuários da empresa | ✅ | ❌ | ❌ | ❌ | ✅ |
| Trocar empresa ativa | ❌ | ❌ | ❌ | ❌ | ✅ |

Notas:
- `Developer` atua como `Admin` no tenant ativo.
- Permissões sempre aplicadas no escopo da empresa corrente.

---

## 🧭 8. REGRAS DE ACESSO

### Usuário comum
- Escopo sempre fixo em `usuario.empresa_id`.
- Não pode trocar de tenant.

### Developer
- Escopo definido por `empresa_ativa_id`.
- `usuario.empresa_id` não é usado para autorização do developer.
- Pode alternar tenant por ação explícita de troca de contexto.
- Fallback obrigatório: se `empresa_ativa_id` estiver ausente, bloquear acesso a dados e exigir seleção de empresa antes de continuar.
- Se `empresa_ativa_id` estiver inválido ou apontar para empresa inexistente, invalidar o contexto atual, bloquear acesso e exigir nova seleção de empresa.
- Toda troca de contexto deve ser registrada em auditoria.

---

## 🛡️ 9. RLS (CONCEITUAL)

Política base para todas as entidades multi-tenant:

- Toda query e mutação aplica filtro por `empresa_id`.

Resolução de identidade e tenant:

1. Identificar `role` do usuário autenticado.
2. Se `role != developer`: `tenant = usuario.empresa_id`.
3. Se `role = developer`: `tenant = empresa_ativa_id`.
4. Se `role = developer` e `empresa_ativa_id` ausente: negar acesso e exigir seleção de empresa.
5. Validar se `empresa_ativa_id` existe e é uma empresa válida antes de liberar qualquer query.

Restrições obrigatórias:
- Sempre resolver tenant antes da query.
- Nunca permitir acesso sem tenant definido e válido.
- Proibido fallback automático para `usuario.empresa_id` quando `role = developer`.
- Proibido bypass de RLS por lógica de aplicação.

---

## 🧾 10. AUDITORIA (OBRIGATÓRIA)

Eventos mínimos para `developer`:

1. **Troca de empresa ativa**
   - quem executou
   - empresa anterior
   - nova empresa
   - data/hora

2. **Alterações críticas**
   - entidade
   - identificador do registro
   - ação (create/update/delete)
   - resumo de campos alterados
   - data/hora

3. **Exclusões**
   - tipo de registro removido
   - identificador
   - data/hora

4. **Edição de POP**
   - pop_id
   - versão/estado
   - data/hora

Princípios obrigatórios:
- Auditoria deve permitir rastrear “quem fez o quê, em qual empresa e quando”.
- Auditoria é obrigatória para ações de developer.
- Sistema deve sempre tentar registrar log.
- Em caso de falha, registrar erro técnico e permitir operação apenas se houver fallback mínimo de log.
- Logs devem ser estruturados para consulta eficiente e possível arquivamento futuro, evitando crescimento descontrolado da base de auditoria.

---

## 🖥️ 11. UX / EXPERIÊNCIA

### 11.1 Dropdown de empresa
- Visível apenas para `developer`.
- Local recomendado: header padrão da aplicação.
- Altera `empresa_ativa_id` do contexto.

### 11.2 Aviso visual de modo suporte
- Exibir indicador visível e persistente quando usuário estiver em modo developer.
- Exibir explicitamente o nome da empresa ativa.
- Mensagem sugerida: **“Modo suporte ativo — empresa: {nome_empresa_ativa}”**.

Objetivo UX:
- Evitar erro humano.
- Evitar operação no tenant errado.
- Tornar o contexto atual explícito.

---

## 🔗 12. COMPATIBILIDADE COM PRDs EXISTENTES

Este PRD mantém compatibilidade com os PRDs atuais ao:

- manter `empresa_id` como chave de isolamento principal;
- não introduzir tabela pivô usuário-empresa;
- não introduzir múltiplas roles por usuário;
- não introduzir RBAC avançado;
- preservar fluxos de criação, revisão, aprovação, execução, analytics, comentários e notificações já definidos.

---

## 🚫 13. FORA DE ESCOPO

- Multi-empresa para usuário comum.
- Usuário com múltiplas roles simultâneas.
- Sistema de permissões dinâmicas por feature (RBAC avançado).
- Reestruturação arquitetural do backend.

---

## ✅ 14. CHECKLIST DE VALIDAÇÃO

- [x] Simples
- [x] Coerente
- [x] Compatível com PRDs existentes
- [x] Sem overengineering

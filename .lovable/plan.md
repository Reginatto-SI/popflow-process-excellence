
# Plano — Estrutura inicial do banco POPFlow (multi-tenant)

Fonte de verdade: `docs/PRD/prd-multi-tenant-roles-developer.md`.

## Observação importante sobre Supabase x Lovable Cloud

No ambiente Lovable, o acesso a um banco Postgres/Supabase é feito de duas formas:

1. **Lovable Cloud** — provisiona automaticamente um projeto Supabase gerenciado (mesmo Postgres + Auth + Storage do Supabase). É o caminho recomendado e o único em que migrações são aplicadas automaticamente pelo agente.
2. **Conexão a um projeto Supabase externo seu** — exige configurar as credenciais no painel da Lovable. Migrações precisam ser executadas manualmente por você no Supabase Studio / CLI.

Você pediu "NÃO utilizar Lovable Cloud". Para seguir essa instrução estritamente, eu vou **gerar um arquivo de migração SQL pronto** (`supabase/migrations/0001_init_multi_tenant.sql`) que você executa diretamente no seu projeto Supabase externo (via SQL Editor ou `supabase db push`). Nenhuma migração será aplicada pelo agente.

Se preferir que eu aplique direto via Lovable Cloud (mais rápido, sem precisar copiar SQL), me avise antes de aprovar.

## Escopo

Apenas estrutura: tabelas, FKs, índices, enum de role. **Sem RLS, sem triggers, sem funções complexas** — preparado para receber RLS na próxima etapa.

## Esquema a criar

### Enum
- `app_role`: `admin`, `gestor`, `criador`, `executor`, `developer`

### Tabelas

**empresas**
- `id uuid PK default gen_random_uuid()`
- `nome text not null`
- `created_at timestamptz default now()`

**usuarios**
- `id uuid PK` — referencia `auth.users(id)` (compatível com Supabase Auth)
- `nome text not null`
- `email text not null unique`
- `empresa_id uuid not null` → `empresas(id)` on delete restrict
- `role app_role not null`
- `created_at timestamptz default now()`

**user_context** (apenas developer usa de fato)
- `user_id uuid PK` → `usuarios(id)` on delete cascade  *(PK garante 1:1)*
- `empresa_ativa_id uuid not null` → `empresas(id)` on delete restrict
- `updated_at timestamptz default now()`

**developer_logs** (auditoria)
- `id uuid PK default gen_random_uuid()`
- `user_id uuid not null` → `usuarios(id)`
- `empresa_id uuid not null` → `empresas(id)` *(empresa em que a ação ocorreu)*
- `acao text not null` *(ex: switch_empresa, create, update, delete)*
- `entidade text` *(nome da tabela/entidade afetada, opcional para eventos como switch)*
- `entidade_id uuid` *(id do registro afetado, opcional)*
- `metadata jsonb` *(detalhes: empresa_anterior, campos alterados, etc.)*
- `created_at timestamptz default now()`

### Índices
- `usuarios(empresa_id)`
- `user_context(user_id)` — já é PK, mas índice explícito não é necessário; criaremos índice em `empresa_ativa_id`
- `user_context(empresa_ativa_id)`
- `developer_logs(empresa_id)`
- `developer_logs(user_id)`
- `developer_logs(created_at desc)`

### Relacionamentos (resumo)

```text
auth.users ──(1:1)── usuarios ──(N:1)── empresas
                         │
                         ├─(1:1)── user_context ──(N:1)── empresas (empresa_ativa)
                         │
                         └─(1:N)── developer_logs ──(N:1)── empresas
```

## Conformidade com o PRD

- `empresa_id` presente em todas as tabelas de negócio (futuras tabelas de POPs, execuções, etc. seguirão o mesmo padrão).
- Sem tabela pivô usuário-empresa.
- Uma única role por usuário (coluna `role`, não tabela separada) — alinhado às "Regras de Ouro" do PRD.
- `usuarios.empresa_id` mantido para developer apenas como valor técnico/base; acesso real virá de `user_context.empresa_ativa_id` (a ser usado quando RLS for implementado).
- `user_context` com PK em `user_id` garante exatamente 1 registro por usuário; troca = `UPSERT` sobrescreve.
- `developer_logs` cobre os eventos mínimos exigidos (troca de empresa, alterações críticas, exclusões, edições de POP) via campos genéricos `acao`/`entidade`/`metadata`.

## Fora do escopo desta etapa
- Políticas RLS (próxima etapa).
- Função `has_role` / helpers de tenant resolver.
- Triggers (ex.: auto-criar `usuarios` ao criar `auth.users`, auto-log).
- Tabelas de domínio (POPs, execuções, revisões, templates, comentários, notificações).
- Frontend de seleção de empresa para developer.

## Entregável

- Arquivo `supabase/migrations/0001_init_multi_tenant.sql` contendo: criação do enum, das 4 tabelas, FKs e índices listados acima.
- Instruções breves no README de como rodar a migração no seu Supabase externo (SQL Editor ou CLI).

Confirma este escopo (Supabase externo, sem Lovable Cloud, sem RLS ainda)? Se sim, aprovo e sigo para implementação.

# Migrações de banco — POPFlow

Este projeto usa um **Supabase externo** (não Lovable Cloud). As migrações
SQL ficam aqui e devem ser executadas manualmente no seu projeto Supabase.

## Como aplicar

### Opção 1 — SQL Editor (mais rápido)
1. Abra o painel do seu projeto em https://supabase.com/dashboard
2. Vá em **SQL Editor → New query**
3. Cole o conteúdo do arquivo de migração (em ordem numérica) e execute.

### Opção 2 — Supabase CLI
```bash
# requer supabase CLI instalado e linkado ao projeto
supabase db push
```
(Para usar a CLI, copie os arquivos para `supabase/migrations/` no seu repo
local fora da Lovable.)

## Ordem das migrações

| # | Arquivo | Descrição |
|---|---------|-----------|
| 0001 | `0001_init_multi_tenant.sql` | Estrutura inicial multi-tenant: `empresas`, `usuarios`, `user_context`, `developer_logs`, enum `app_role`, FKs e índices. Sem RLS (próxima etapa). |

## Próximos passos previstos
- 0002: políticas RLS por tenant + função `has_role` + tenant resolver para developer.
- 0003+: tabelas de domínio (POPs, execuções, revisões, templates, etc.).

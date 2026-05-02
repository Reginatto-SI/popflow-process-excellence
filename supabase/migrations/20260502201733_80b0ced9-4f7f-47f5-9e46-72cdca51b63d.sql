-- Deny-by-default: liga RLS sem criar policies.
-- As policies reais virão na próxima migração (RLS por tenant + role).
alter table public.empresas        enable row level security;
alter table public.usuarios        enable row level security;
alter table public.user_context    enable row level security;
alter table public.developer_logs  enable row level security;
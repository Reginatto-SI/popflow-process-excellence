-- POPFlow — Estrutura inicial multi-tenant
-- Fonte: docs/PRD/prd-multi-tenant-roles-developer.md
-- Sem RLS nesta etapa (próxima migração).

create extension if not exists "pgcrypto";

-- =========================================
-- ENUM de roles
-- =========================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum (
      'admin',
      'gestor',
      'criador',
      'executor',
      'developer'
    );
  end if;
end$$;

-- =========================================
-- empresas (tenant)
-- =========================================
create table if not exists public.empresas (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  created_at  timestamptz not null default now()
);

-- =========================================
-- usuarios
-- id = auth.uid() (sem FK direta para auth.users por boas práticas)
-- =========================================
create table if not exists public.usuarios (
  id          uuid primary key,
  nome        text not null,
  email       text not null unique,
  empresa_id  uuid not null references public.empresas(id) on delete restrict,
  role        public.app_role not null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_usuarios_empresa_id on public.usuarios(empresa_id);

-- =========================================
-- user_context (1:1 com usuarios)
-- Para developer: define empresa ativa. Troca = UPSERT.
-- =========================================
create table if not exists public.user_context (
  user_id           uuid primary key references public.usuarios(id) on delete cascade,
  empresa_ativa_id  uuid not null references public.empresas(id) on delete restrict,
  updated_at        timestamptz not null default now()
);

create index if not exists idx_user_context_empresa_ativa_id
  on public.user_context(empresa_ativa_id);

-- =========================================
-- developer_logs (auditoria)
-- =========================================
create table if not exists public.developer_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.usuarios(id) on delete restrict,
  empresa_id   uuid not null references public.empresas(id) on delete restrict,
  acao         text not null,
  entidade     text,
  entidade_id  uuid,
  metadata     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create index if not exists idx_developer_logs_empresa_id on public.developer_logs(empresa_id);
create index if not exists idx_developer_logs_user_id    on public.developer_logs(user_id);
create index if not exists idx_developer_logs_created_at on public.developer_logs(created_at desc);

-- =========================================
-- Comentários
-- =========================================
comment on table public.empresas        is 'Tenants do sistema. Toda entidade de negócio é isolada por empresa_id.';
comment on table public.usuarios        is 'Usuários do sistema. id = auth.uid(). Uma única role por usuário.';
comment on column public.usuarios.empresa_id is 'Empresa-base. Para developer NÃO define acesso (usar user_context.empresa_ativa_id).';
comment on table public.user_context    is 'Contexto ativo do usuário. Para developer define a empresa em que opera. 1 registro por usuário.';
comment on table public.developer_logs  is 'Auditoria de ações do developer (troca de empresa, create/update/delete, edição de POP).';
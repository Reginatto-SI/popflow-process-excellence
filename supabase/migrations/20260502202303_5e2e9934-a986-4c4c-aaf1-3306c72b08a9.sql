-- =========================================================
-- POPFlow — RLS simples por empresa (etapa 1)
-- Fonte: docs/PRD/prd-multi-tenant-roles-developer.md
-- Nota: developer ainda NÃO troca de empresa nesta etapa.
-- =========================================================

-- ---------------------------------------------------------
-- Função resolver: empresa do usuário autenticado.
-- SECURITY DEFINER + STABLE para evitar recursão em RLS
-- e ser cacheada por statement.
-- ---------------------------------------------------------
create or replace function public.current_empresa_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select empresa_id from public.usuarios where id = auth.uid()
$$;

revoke all on function public.current_empresa_id() from public;
grant execute on function public.current_empresa_id() to authenticated;

-- =========================================================
-- empresas
-- =========================================================
drop policy if exists "empresas: select própria empresa"     on public.empresas;
drop policy if exists "empresas: bloqueia insert via cliente" on public.empresas;
drop policy if exists "empresas: bloqueia update via cliente" on public.empresas;
drop policy if exists "empresas: bloqueia delete via cliente" on public.empresas;

create policy "empresas: select própria empresa"
  on public.empresas
  for select
  to authenticated
  using (id = public.current_empresa_id());

-- INSERT/UPDATE/DELETE não criados ⇒ negados por padrão (somente service_role).

-- =========================================================
-- usuarios
-- Importante: para esta tabela usamos auth.uid() / coluna empresa_id
-- diretamente (sem chamar current_empresa_id()) para evitar recursão.
-- =========================================================
drop policy if exists "usuarios: select da própria empresa" on public.usuarios;
drop policy if exists "usuarios: insert do próprio usuário" on public.usuarios;
drop policy if exists "usuarios: update do próprio usuário" on public.usuarios;

create policy "usuarios: select da própria empresa"
  on public.usuarios
  for select
  to authenticated
  using (
    -- Sempre vejo a mim mesmo
    id = auth.uid()
    -- E vejo colegas da mesma empresa (lookup direto, sem recursão:
    -- a sub-select sai pela própria policy via auth.uid() = id)
    or empresa_id = (
      select u.empresa_id from public.usuarios u where u.id = auth.uid()
    )
  );

-- Self-signup: o próprio usuário cria seu registro (id = auth.uid()).
create policy "usuarios: insert do próprio usuário"
  on public.usuarios
  for insert
  to authenticated
  with check (id = auth.uid());

-- Edição: usuário só edita o próprio registro, e NÃO pode mudar empresa nem role.
create policy "usuarios: update do próprio usuário"
  on public.usuarios
  for update
  to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and empresa_id = (select u.empresa_id from public.usuarios u where u.id = auth.uid())
    and role       = (select u.role        from public.usuarios u where u.id = auth.uid())
  );

-- DELETE não criado ⇒ negado (somente service_role).

-- =========================================================
-- user_context
-- 1 linha por usuário; só o próprio dono lê/escreve.
-- =========================================================
drop policy if exists "user_context: select próprio"  on public.user_context;
drop policy if exists "user_context: insert próprio"  on public.user_context;
drop policy if exists "user_context: update próprio"  on public.user_context;
drop policy if exists "user_context: delete próprio"  on public.user_context;

create policy "user_context: select próprio"
  on public.user_context
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "user_context: insert próprio"
  on public.user_context
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "user_context: update próprio"
  on public.user_context
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "user_context: delete próprio"
  on public.user_context
  for delete
  to authenticated
  using (user_id = auth.uid());

-- =========================================================
-- developer_logs
-- Sem acesso pelo cliente nesta etapa (apenas service_role).
-- =========================================================
-- Nenhuma policy criada ⇒ deny total para authenticated/anon.

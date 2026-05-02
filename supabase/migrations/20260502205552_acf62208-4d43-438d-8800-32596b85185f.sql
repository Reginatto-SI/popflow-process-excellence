-- Remove policies recursivas
drop policy if exists "usuarios: select da própria empresa" on public.usuarios;
drop policy if exists "usuarios: insert do próprio usuário" on public.usuarios;
drop policy if exists "usuarios: update do próprio usuário" on public.usuarios;

-- SELECT: apenas o próprio registro (raiz de identidade, sem subquery em usuarios)
create policy "usuarios: select próprio"
  on public.usuarios
  for select
  to authenticated
  using (id = auth.uid());

-- INSERT: apenas o próprio id
create policy "usuarios: insert próprio"
  on public.usuarios
  for insert
  to authenticated
  with check (id = auth.uid());

-- UPDATE: apenas o próprio registro (sem travar empresa_id/role aqui;
-- isso voltará via tabela user_roles separada quando implementarmos PRD 4)
create policy "usuarios: update próprio"
  on public.usuarios
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());
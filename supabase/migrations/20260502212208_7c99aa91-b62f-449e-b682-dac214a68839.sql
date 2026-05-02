-- Bucket público (decisão TEMPORÁRIA do MVP — migrar para privado + signed URLs no futuro)
insert into storage.buckets (id, name, public)
values ('pop-midias', 'pop-midias', true)
on conflict (id) do nothing;

-- Policies em storage.objects: usam current_empresa_id() (SECURITY DEFINER) — NÃO recursivo,
-- pois current_empresa_id lê public.usuarios cuja policy usa apenas auth.uid().
-- Path convencionado: {empresa_id}/{pop_id}/{arquivo}

drop policy if exists "pop-midias: select da empresa" on storage.objects;
drop policy if exists "pop-midias: insert da empresa" on storage.objects;
drop policy if exists "pop-midias: update da empresa" on storage.objects;
drop policy if exists "pop-midias: delete da empresa" on storage.objects;

create policy "pop-midias: select da empresa"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'pop-midias'
    and (storage.foldername(name))[1] = public.current_empresa_id()::text
  );

create policy "pop-midias: insert da empresa"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'pop-midias'
    and (storage.foldername(name))[1] = public.current_empresa_id()::text
  );

create policy "pop-midias: update da empresa"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'pop-midias'
    and (storage.foldername(name))[1] = public.current_empresa_id()::text
  )
  with check (
    bucket_id = 'pop-midias'
    and (storage.foldername(name))[1] = public.current_empresa_id()::text
  );

create policy "pop-midias: delete da empresa"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'pop-midias'
    and (storage.foldername(name))[1] = public.current_empresa_id()::text
  );
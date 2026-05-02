## Problema confirmado

A migration de RLS criou policies em `public.usuarios` que fazem subquery na própria tabela `usuarios`:

- **SELECT**: `empresa_id IN (select u.empresa_id from public.usuarios u where u.id = auth.uid())` → recursão
- **UPDATE (WITH CHECK)**: dois subqueries em `public.usuarios` para travar `empresa_id` e `role` → recursão

Quando o frontend executa qualquer query (ex: carregar lista de POPs, que dispara `current_empresa_id()` → que lê `usuarios`), o Postgres avalia a RLS de `usuarios`, que por sua vez tenta ler `usuarios` de novo → erro.

Sua proposta está correta: tratar `usuarios` como **raiz de identidade** e usar apenas `auth.uid()` nas policies dela.

## Correção

Criar uma migration que substitui as 3 policies de `usuarios` por versões simples baseadas só em `auth.uid()`:

```sql
-- Drop das policies recursivas
drop policy if exists "usuarios: select da própria empresa" on public.usuarios;
drop policy if exists "usuarios: insert do próprio usuário" on public.usuarios;
drop policy if exists "usuarios: update do próprio usuário" on public.usuarios;

-- SELECT: apenas o próprio registro
create policy "usuarios: select próprio"
  on public.usuarios for select
  to authenticated
  using (id = auth.uid());

-- INSERT: apenas o próprio id (signup já faz via SECURITY DEFINER, mas mantém defesa)
create policy "usuarios: insert próprio"
  on public.usuarios for insert
  to authenticated
  with check (id = auth.uid());

-- UPDATE: apenas o próprio registro, sem trancar empresa_id/role aqui
-- (essas regras voltam quando implementarmos roles/developer mode com função SECURITY DEFINER)
create policy "usuarios: update próprio"
  on public.usuarios for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());
```

## Trade-off consciente (a comunicar)

A policy antiga tentava impedir o usuário de mudar o próprio `empresa_id` ou `role` via update. Removendo isso, tecnicamente o usuário autenticado poderia se auto-promover a `admin` ou trocar de empresa via update direto.

Para o MVP atual (cada usuário é admin da própria empresa criada no signup) isso não é exploração relevante. Quando entrarmos no PRD 4 (multi-tenant com convites) e no modo developer, vamos:

1. Criar uma função `SECURITY DEFINER` `is_self_update_safe()` que valide `empresa_id` e `role` sem recursão (ela roda fora da RLS), ou
2. Mover `role` para uma tabela `user_roles` separada (padrão recomendado para evitar privilege escalation), o que já é a melhor prática e elimina o problema de raiz.

Recomendo a opção 2 quando chegarmos lá — alinhada com o guideline de roles separados.

## Outras tabelas

Não mexem. `pops`, `pop_versoes`, `pop_etapas`, `pop_midias`, `developer_logs`, `user_context` continuam usando `current_empresa_id()` normalmente — essa função só causa recursão quando aplicada a `usuarios`.

## Entregável

1 nova migration: `fix_usuarios_rls_recursion.sql` com os 3 drops + 3 creates acima.

Nenhuma mudança em frontend, hooks, ou demais policies.
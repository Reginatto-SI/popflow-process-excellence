-- Arquivamento lógico para preservar rastreabilidade de POPs com histórico de execução.
ALTER TABLE public.pops
  ADD COLUMN IF NOT EXISTS arquivado boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_pops_empresa_arquivado
  ON public.pops(empresa_id, arquivado);

-- Permissão mínima para ações de gestão de POPs (inclui excluir/arquivar).
CREATE OR REPLACE FUNCTION public.current_user_can_manage_pops()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.usuarios u
    WHERE u.id = auth.uid()
      AND u.empresa_id = public.current_empresa_id()
      AND u.role IN ('admin', 'gestor', 'criador', 'developer')
  )
$$;

REVOKE ALL ON FUNCTION public.current_user_can_manage_pops() FROM public;
GRANT EXECUTE ON FUNCTION public.current_user_can_manage_pops() TO authenticated;

DROP POLICY IF EXISTS "pops: update da empresa" ON public.pops;
CREATE POLICY "pops: update da empresa" ON public.pops FOR UPDATE TO authenticated
  USING (empresa_id = public.current_empresa_id() AND public.current_user_can_manage_pops())
  WITH CHECK (empresa_id = public.current_empresa_id() AND public.current_user_can_manage_pops());

DROP POLICY IF EXISTS "pops: delete da empresa" ON public.pops;
CREATE POLICY "pops: delete da empresa" ON public.pops FOR DELETE TO authenticated
  USING (empresa_id = public.current_empresa_id() AND public.current_user_can_manage_pops());

DROP POLICY IF EXISTS "pop_versoes: update da empresa" ON public.pop_versoes;
CREATE POLICY "pop_versoes: update da empresa" ON public.pop_versoes FOR UPDATE TO authenticated
  USING (empresa_id = public.current_empresa_id() AND public.current_user_can_manage_pops())
  WITH CHECK (empresa_id = public.current_empresa_id() AND public.current_user_can_manage_pops());

DROP POLICY IF EXISTS "pop_versoes: delete da empresa" ON public.pop_versoes;
CREATE POLICY "pop_versoes: delete da empresa" ON public.pop_versoes FOR DELETE TO authenticated
  USING (empresa_id = public.current_empresa_id() AND public.current_user_can_manage_pops());

DROP POLICY IF EXISTS "pop_etapas: update da empresa" ON public.pop_etapas;
CREATE POLICY "pop_etapas: update da empresa" ON public.pop_etapas FOR UPDATE TO authenticated
  USING (empresa_id = public.current_empresa_id() AND public.current_user_can_manage_pops())
  WITH CHECK (empresa_id = public.current_empresa_id() AND public.current_user_can_manage_pops());

DROP POLICY IF EXISTS "pop_etapas: delete da empresa" ON public.pop_etapas;
CREATE POLICY "pop_etapas: delete da empresa" ON public.pop_etapas FOR DELETE TO authenticated
  USING (empresa_id = public.current_empresa_id() AND public.current_user_can_manage_pops());

DROP POLICY IF EXISTS "pop_midias: update da empresa" ON public.pop_midias;
CREATE POLICY "pop_midias: update da empresa" ON public.pop_midias FOR UPDATE TO authenticated
  USING (empresa_id = public.current_empresa_id() AND public.current_user_can_manage_pops())
  WITH CHECK (empresa_id = public.current_empresa_id() AND public.current_user_can_manage_pops());

DROP POLICY IF EXISTS "pop_midias: delete da empresa" ON public.pop_midias;
CREATE POLICY "pop_midias: delete da empresa" ON public.pop_midias FOR DELETE TO authenticated
  USING (empresa_id = public.current_empresa_id() AND public.current_user_can_manage_pops());

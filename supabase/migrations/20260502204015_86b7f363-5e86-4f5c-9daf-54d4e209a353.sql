-- Revogar EXECUTE público das funções SECURITY DEFINER
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_validate_pop_versao_ativa() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_set_updated_at() FROM PUBLIC, anon, authenticated;

-- developer_logs estava com RLS habilitado mas sem policies (deny-by-default está OK,
-- mas o linter sinaliza). Adicionar policy mínima de SELECT para o próprio user na empresa atual.
CREATE POLICY "developer_logs: select próprios da empresa atual"
  ON public.developer_logs FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND empresa_id = public.current_empresa_id());
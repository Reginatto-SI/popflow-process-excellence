-- Registro cronológico de atividades dos POPs.
-- Escopo MVP: eventos legíveis sem diff campo a campo.

CREATE TABLE IF NOT EXISTS public.pop_atividades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  pop_id uuid NOT NULL REFERENCES public.pops(id) ON DELETE CASCADE,
  pop_versao_id uuid REFERENCES public.pop_versoes(id) ON DELETE SET NULL,
  usuario_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE RESTRICT,
  acao text NOT NULL,
  alvo_tipo text NOT NULL,
  alvo_id uuid,
  descricao text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pop_atividades_empresa_pop_created_at
  ON public.pop_atividades(empresa_id, pop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pop_atividades_usuario_id
  ON public.pop_atividades(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pop_atividades_pop_versao_id
  ON public.pop_atividades(pop_versao_id);

ALTER TABLE public.pop_atividades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pop_atividades: select da empresa"
  ON public.pop_atividades
  FOR SELECT
  TO authenticated
  USING (empresa_id = public.current_empresa_id());

CREATE POLICY "pop_atividades: insert própria empresa"
  ON public.pop_atividades
  FOR INSERT
  TO authenticated
  WITH CHECK (empresa_id = public.current_empresa_id() AND usuario_id = auth.uid());

COMMENT ON TABLE public.pop_atividades IS 'Registro cronológico simples de atividades de POPs por empresa.';


-- Tabelas de execução de POP
-- NOTA MVP: execução permitida também para POPs em rascunho temporariamente.
-- Quando o fluxo de revisão/publicação estiver pronto, restringir para versão publicada.

CREATE TABLE public.execucoes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id uuid NOT NULL,
  pop_id uuid NOT NULL,
  pop_versao_id uuid NOT NULL,
  usuario_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'em_andamento' CHECK (status IN ('em_andamento','concluida','cancelada')),
  data_inicio timestamptz NOT NULL DEFAULT now(),
  data_fim timestamptz,
  tempo_total_segundos integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_execucoes_pop ON public.execucoes(pop_id);
CREATE INDEX idx_execucoes_usuario_status ON public.execucoes(usuario_id, status);
CREATE INDEX idx_execucoes_empresa ON public.execucoes(empresa_id);

ALTER TABLE public.execucoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "execucoes: select da empresa" ON public.execucoes
  FOR SELECT TO authenticated
  USING (empresa_id = public.current_empresa_id());

CREATE POLICY "execucoes: insert da empresa" ON public.execucoes
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.current_empresa_id() AND usuario_id = auth.uid());

CREATE POLICY "execucoes: update da empresa" ON public.execucoes
  FOR UPDATE TO authenticated
  USING (empresa_id = public.current_empresa_id())
  WITH CHECK (empresa_id = public.current_empresa_id());

CREATE POLICY "execucoes: delete da empresa" ON public.execucoes
  FOR DELETE TO authenticated
  USING (empresa_id = public.current_empresa_id());

CREATE TRIGGER set_updated_at_execucoes
  BEFORE UPDATE ON public.execucoes
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.execucao_etapas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id uuid NOT NULL,
  execucao_id uuid NOT NULL REFERENCES public.execucoes(id) ON DELETE CASCADE,
  etapa_id uuid NOT NULL REFERENCES public.pop_etapas(id) ON DELETE RESTRICT,
  usuario_id uuid NOT NULL,
  data_inicio timestamptz,
  data_fim timestamptz,
  tempo_gasto_segundos integer,
  concluido boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (execucao_id, etapa_id)
);

CREATE INDEX idx_execucao_etapas_execucao ON public.execucao_etapas(execucao_id);
CREATE INDEX idx_execucao_etapas_empresa ON public.execucao_etapas(empresa_id);

ALTER TABLE public.execucao_etapas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "execucao_etapas: select da empresa" ON public.execucao_etapas
  FOR SELECT TO authenticated
  USING (empresa_id = public.current_empresa_id());

CREATE POLICY "execucao_etapas: insert da empresa" ON public.execucao_etapas
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.current_empresa_id() AND usuario_id = auth.uid());

CREATE POLICY "execucao_etapas: update da empresa" ON public.execucao_etapas
  FOR UPDATE TO authenticated
  USING (empresa_id = public.current_empresa_id())
  WITH CHECK (empresa_id = public.current_empresa_id());

CREATE POLICY "execucao_etapas: delete da empresa" ON public.execucao_etapas
  FOR DELETE TO authenticated
  USING (empresa_id = public.current_empresa_id());

CREATE TRIGGER set_updated_at_execucao_etapas
  BEFORE UPDATE ON public.execucao_etapas
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

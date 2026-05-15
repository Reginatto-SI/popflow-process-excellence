-- Base de Conhecimento MVP: tabela única para artigos, dúvidas, soluções de erro e anotações.
CREATE TYPE public.base_conhecimento_tipo AS ENUM ('artigo', 'duvida', 'solucao_erro', 'anotacao');
CREATE TYPE public.base_conhecimento_status AS ENUM ('rascunho', 'revisao', 'publicado', 'arquivado', 'aberta', 'resolvida');

CREATE TABLE public.base_conhecimento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  tipo public.base_conhecimento_tipo NOT NULL DEFAULT 'artigo',
  titulo text NOT NULL,
  resumo text NOT NULL DEFAULT '',
  conteudo text NOT NULL DEFAULT '',
  pergunta text NOT NULL DEFAULT '',
  resposta text NOT NULL DEFAULT '',
  sistema_relacionado text NOT NULL DEFAULT '',
  erro_relacionado text NOT NULL DEFAULT '',
  causa text NOT NULL DEFAULT '',
  solucao text NOT NULL DEFAULT '',
  observacoes text NOT NULL DEFAULT '',
  categoria text NOT NULL DEFAULT '',
  departamento text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  status public.base_conhecimento_status NOT NULL DEFAULT 'rascunho',
  visibilidade public.pop_visibilidade NOT NULL DEFAULT 'empresa',
  responsavel_id uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  autor_id uuid NOT NULL REFERENCES public.usuarios(id),
  pop_id uuid REFERENCES public.pops(id) ON DELETE SET NULL,
  etapa_id uuid REFERENCES public.pop_etapas(id) ON DELETE SET NULL,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT base_conhecimento_status_tipo_check CHECK (
    (tipo = 'artigo' AND status IN ('rascunho', 'revisao', 'publicado', 'arquivado'))
    OR (tipo = 'duvida' AND status IN ('aberta', 'resolvida', 'arquivado'))
    OR (tipo = 'solucao_erro' AND status IN ('rascunho', 'publicado', 'resolvida', 'arquivado'))
    OR (tipo = 'anotacao' AND status IN ('rascunho', 'publicado', 'arquivado'))
  )
);

CREATE INDEX idx_base_conhecimento_empresa_updated_at ON public.base_conhecimento(empresa_id, updated_at DESC);
CREATE INDEX idx_base_conhecimento_empresa_tipo ON public.base_conhecimento(empresa_id, tipo);
CREATE INDEX idx_base_conhecimento_empresa_status ON public.base_conhecimento(empresa_id, status);
CREATE INDEX idx_base_conhecimento_empresa_visibilidade ON public.base_conhecimento(empresa_id, visibilidade);
CREATE INDEX idx_base_conhecimento_tags ON public.base_conhecimento USING gin(tags);

ALTER TABLE public.base_conhecimento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "base_conhecimento: select por empresa e visibilidade" ON public.base_conhecimento
  FOR SELECT TO authenticated
  USING (
    empresa_id = public.current_empresa_id()
    AND (
      -- Privados são estritamente pessoais; conteúdos de empresa só abrem para todos quando publicados/resolvidos.
      autor_id = auth.uid()
      OR (
        visibilidade = 'empresa'
        AND (
          status IN ('publicado', 'resolvida')
          OR (
            status IN ('rascunho', 'revisao', 'arquivado')
            AND (responsavel_id = auth.uid() OR public.current_user_can_manage_pops())
          )
        )
      )
    )
  );

CREATE POLICY "base_conhecimento: insert própria empresa" ON public.base_conhecimento
  FOR INSERT TO authenticated
  WITH CHECK (
    empresa_id = public.current_empresa_id()
    AND autor_id = auth.uid()
    AND (visibilidade = 'empresa' OR autor_id = auth.uid())
    AND (pop_id IS NULL OR EXISTS (
      SELECT 1 FROM public.pops p WHERE p.id = base_conhecimento.pop_id AND p.empresa_id = base_conhecimento.empresa_id
    ))
    AND (etapa_id IS NULL OR EXISTS (
      SELECT 1 FROM public.pop_etapas e WHERE e.id = base_conhecimento.etapa_id AND e.empresa_id = base_conhecimento.empresa_id
    ))
  );

CREATE POLICY "base_conhecimento: update autor ou gestor" ON public.base_conhecimento
  FOR UPDATE TO authenticated
  USING (
    empresa_id = public.current_empresa_id()
    AND (autor_id = auth.uid() OR public.current_user_can_manage_pops())
  )
  WITH CHECK (
    empresa_id = public.current_empresa_id()
    AND (autor_id = auth.uid() OR public.current_user_can_manage_pops())
    AND (pop_id IS NULL OR EXISTS (
      SELECT 1 FROM public.pops p WHERE p.id = base_conhecimento.pop_id AND p.empresa_id = base_conhecimento.empresa_id
    ))
    AND (etapa_id IS NULL OR EXISTS (
      SELECT 1 FROM public.pop_etapas e WHERE e.id = base_conhecimento.etapa_id AND e.empresa_id = base_conhecimento.empresa_id
    ))
  );

CREATE POLICY "base_conhecimento: delete autor ou gestor" ON public.base_conhecimento
  FOR DELETE TO authenticated
  USING (
    empresa_id = public.current_empresa_id()
    AND (autor_id = auth.uid() OR public.current_user_can_manage_pops())
  );

CREATE TRIGGER set_updated_at_base_conhecimento
  BEFORE UPDATE ON public.base_conhecimento
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

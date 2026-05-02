-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE public.pop_status AS ENUM ('rascunho', 'revisao', 'publicado');
CREATE TYPE public.pop_visibilidade AS ENUM ('privado', 'empresa');
CREATE TYPE public.pop_midia_tipo AS ENUM ('imagem', 'audio', 'video', 'documento');

-- ============================================================
-- TABELAS
-- ============================================================

-- pops: metadados estáveis
CREATE TABLE public.pops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descricao text NOT NULL DEFAULT '',
  departamento text NOT NULL DEFAULT '',
  responsavel text NOT NULL DEFAULT '',
  visibilidade public.pop_visibilidade NOT NULL DEFAULT 'empresa',
  owner_id uuid NOT NULL REFERENCES public.usuarios(id),
  versao_ativa_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- pop_versoes: snapshot do POP em determinado momento (PRD 10)
CREATE TABLE public.pop_versoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pop_id uuid NOT NULL REFERENCES public.pops(id) ON DELETE CASCADE,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  numero text NOT NULL DEFAULT 'v1.0',
  status public.pop_status NOT NULL DEFAULT 'rascunho',
  descricao_mudanca text,
  created_by uuid NOT NULL REFERENCES public.usuarios(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- FK pendente: pops.versao_ativa_id -> pop_versoes.id
ALTER TABLE public.pops
  ADD CONSTRAINT pops_versao_ativa_fk
  FOREIGN KEY (versao_ativa_id) REFERENCES public.pop_versoes(id) ON DELETE SET NULL;

-- pop_etapas: pertencem à versão (PRD 10)
CREATE TABLE public.pop_etapas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pop_versao_id uuid NOT NULL REFERENCES public.pop_versoes(id) ON DELETE CASCADE,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  ordem int NOT NULL,
  titulo text NOT NULL DEFAULT '',
  descricao text NOT NULL DEFAULT '',
  tempo_estimado text NOT NULL DEFAULT '',
  pre_requisito text NOT NULL DEFAULT '',
  resultado_esperado text NOT NULL DEFAULT '',
  erro_comum text NOT NULL DEFAULT '',
  -- jsonb com formato [{"id": "uuid", "texto": "..."}] preparado para tracking futuro (PRD 2)
  checklist jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- pop_midias: também na versão (PRD 12)
CREATE TABLE public.pop_midias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pop_versao_id uuid NOT NULL REFERENCES public.pop_versoes(id) ON DELETE CASCADE,
  etapa_id uuid REFERENCES public.pop_etapas(id) ON DELETE SET NULL,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  referencia text NOT NULL,
  nome text NOT NULL DEFAULT '',
  tipo public.pop_midia_tipo NOT NULL,
  url text,
  ordem int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pop_midias_referencia_unique UNIQUE (pop_versao_id, referencia)
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX idx_pops_empresa ON public.pops(empresa_id);
CREATE INDEX idx_pops_owner ON public.pops(owner_id);
CREATE INDEX idx_pop_versoes_pop ON public.pop_versoes(pop_id);
CREATE INDEX idx_pop_versoes_empresa ON public.pop_versoes(empresa_id);
CREATE INDEX idx_pop_etapas_versao ON public.pop_etapas(pop_versao_id);
CREATE INDEX idx_pop_etapas_empresa ON public.pop_etapas(empresa_id);
CREATE INDEX idx_pop_midias_versao ON public.pop_midias(pop_versao_id);
CREATE INDEX idx_pop_midias_etapa ON public.pop_midias(etapa_id);
CREATE INDEX idx_pop_midias_empresa ON public.pop_midias(empresa_id);

-- ============================================================
-- FUNÇÕES E TRIGGERS UTILITÁRIAS
-- ============================================================

-- updated_at automático
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_pops_updated_at BEFORE UPDATE ON public.pops
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER set_pop_versoes_updated_at BEFORE UPDATE ON public.pop_versoes
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER set_pop_etapas_updated_at BEFORE UPDATE ON public.pop_etapas
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Garantir que versao_ativa_id pertence ao mesmo pop_id
CREATE OR REPLACE FUNCTION public.tg_validate_pop_versao_ativa()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_pop_id uuid;
BEGIN
  IF NEW.versao_ativa_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT pop_id INTO v_pop_id FROM public.pop_versoes WHERE id = NEW.versao_ativa_id;

  IF v_pop_id IS NULL THEN
    RAISE EXCEPTION 'versao_ativa_id % não existe', NEW.versao_ativa_id;
  END IF;

  IF v_pop_id <> NEW.id THEN
    RAISE EXCEPTION 'versao_ativa_id % pertence ao pop %, esperado %',
      NEW.versao_ativa_id, v_pop_id, NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_pop_versao_ativa
  BEFORE INSERT OR UPDATE OF versao_ativa_id ON public.pops
  FOR EACH ROW EXECUTE FUNCTION public.tg_validate_pop_versao_ativa();

-- ============================================================
-- AUTH: trigger de signup (cria empresa + usuario automaticamente)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_empresa_id uuid;
  v_nome text;
  v_empresa_nome text;
BEGIN
  v_nome := COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1));
  v_empresa_nome := COALESCE(NEW.raw_user_meta_data->>'empresa_nome', 'Empresa de ' || v_nome);

  INSERT INTO public.empresas (nome) VALUES (v_empresa_nome) RETURNING id INTO v_empresa_id;

  INSERT INTO public.usuarios (id, nome, email, empresa_id, role)
  VALUES (NEW.id, v_nome, NEW.email, v_empresa_id, 'admin');

  INSERT INTO public.user_context (user_id, empresa_ativa_id)
  VALUES (NEW.id, v_empresa_id);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.pops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pop_versoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pop_etapas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pop_midias ENABLE ROW LEVEL SECURITY;

-- pops
CREATE POLICY "pops: select da empresa" ON public.pops FOR SELECT TO authenticated
  USING (empresa_id = public.current_empresa_id());
CREATE POLICY "pops: insert da empresa" ON public.pops FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.current_empresa_id() AND owner_id = auth.uid());
CREATE POLICY "pops: update da empresa" ON public.pops FOR UPDATE TO authenticated
  USING (empresa_id = public.current_empresa_id())
  WITH CHECK (empresa_id = public.current_empresa_id());
CREATE POLICY "pops: delete da empresa" ON public.pops FOR DELETE TO authenticated
  USING (empresa_id = public.current_empresa_id());

-- pop_versoes
CREATE POLICY "pop_versoes: select da empresa" ON public.pop_versoes FOR SELECT TO authenticated
  USING (empresa_id = public.current_empresa_id());
CREATE POLICY "pop_versoes: insert da empresa" ON public.pop_versoes FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.current_empresa_id());
CREATE POLICY "pop_versoes: update da empresa" ON public.pop_versoes FOR UPDATE TO authenticated
  USING (empresa_id = public.current_empresa_id())
  WITH CHECK (empresa_id = public.current_empresa_id());
CREATE POLICY "pop_versoes: delete da empresa" ON public.pop_versoes FOR DELETE TO authenticated
  USING (empresa_id = public.current_empresa_id());

-- pop_etapas
CREATE POLICY "pop_etapas: select da empresa" ON public.pop_etapas FOR SELECT TO authenticated
  USING (empresa_id = public.current_empresa_id());
CREATE POLICY "pop_etapas: insert da empresa" ON public.pop_etapas FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.current_empresa_id());
CREATE POLICY "pop_etapas: update da empresa" ON public.pop_etapas FOR UPDATE TO authenticated
  USING (empresa_id = public.current_empresa_id())
  WITH CHECK (empresa_id = public.current_empresa_id());
CREATE POLICY "pop_etapas: delete da empresa" ON public.pop_etapas FOR DELETE TO authenticated
  USING (empresa_id = public.current_empresa_id());

-- pop_midias
CREATE POLICY "pop_midias: select da empresa" ON public.pop_midias FOR SELECT TO authenticated
  USING (empresa_id = public.current_empresa_id());
CREATE POLICY "pop_midias: insert da empresa" ON public.pop_midias FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.current_empresa_id());
CREATE POLICY "pop_midias: update da empresa" ON public.pop_midias FOR UPDATE TO authenticated
  USING (empresa_id = public.current_empresa_id())
  WITH CHECK (empresa_id = public.current_empresa_id());
CREATE POLICY "pop_midias: delete da empresa" ON public.pop_midias FOR DELETE TO authenticated
  USING (empresa_id = public.current_empresa_id());
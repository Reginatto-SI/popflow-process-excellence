-- Gestão controlada de departamentos por empresa.
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE OR REPLACE FUNCTION public.normalize_departamento_nome(value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT regexp_replace(lower(unaccent(trim(coalesce(value, '')))), '\s+', ' ', 'g');
$$;

CREATE TABLE IF NOT EXISTS public.departamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome text NOT NULL,
  nome_normalizado text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT departamentos_nome_not_blank CHECK (trim(nome) <> ''),
  CONSTRAINT departamentos_nome_normalizado_not_blank CHECK (trim(nome_normalizado) <> '')
);

CREATE UNIQUE INDEX IF NOT EXISTS departamentos_empresa_nome_normalizado_key
  ON public.departamentos(empresa_id, nome_normalizado);
CREATE UNIQUE INDEX IF NOT EXISTS departamentos_empresa_id_id_key
  ON public.departamentos(empresa_id, id);
CREATE INDEX IF NOT EXISTS idx_departamentos_empresa_ativo_nome
  ON public.departamentos(empresa_id, ativo, nome);

CREATE TRIGGER set_departamentos_updated_at
  BEFORE UPDATE ON public.departamentos
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE OR REPLACE FUNCTION public.tg_departamentos_normalize_nome()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.nome := trim(regexp_replace(NEW.nome, '\s+', ' ', 'g'));
  NEW.nome_normalizado := public.normalize_departamento_nome(NEW.nome);
  RETURN NEW;
END;
$$;

CREATE TRIGGER normalize_departamentos_nome
  BEFORE INSERT OR UPDATE OF nome ON public.departamentos
  FOR EACH ROW EXECUTE FUNCTION public.tg_departamentos_normalize_nome();

ALTER TABLE public.pops ADD COLUMN IF NOT EXISTS departamento_id uuid REFERENCES public.departamentos(id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS idx_pops_departamento_id ON public.pops(departamento_id);

ALTER TABLE public.departamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "departamentos: select da empresa" ON public.departamentos
  FOR SELECT USING (empresa_id = public.current_empresa_id());
CREATE POLICY "departamentos: insert gestores" ON public.departamentos
  FOR INSERT WITH CHECK (empresa_id = public.current_empresa_id() AND public.current_user_can_manage_pops());
CREATE POLICY "departamentos: update gestores" ON public.departamentos
  FOR UPDATE USING (empresa_id = public.current_empresa_id() AND public.current_user_can_manage_pops())
  WITH CHECK (empresa_id = public.current_empresa_id() AND public.current_user_can_manage_pops());
CREATE POLICY "departamentos: delete gestores sem pops" ON public.departamentos
  FOR DELETE USING (
    empresa_id = public.current_empresa_id()
    AND public.current_user_can_manage_pops()
    AND NOT EXISTS (SELECT 1 FROM public.pops p WHERE p.departamento_id = departamentos.id)
  );

WITH raw_departamentos AS (
  SELECT DISTINCT ON (empresa_id, public.normalize_departamento_nome(departamento))
    empresa_id,
    trim(regexp_replace(departamento, '\s+', ' ', 'g')) AS nome,
    public.normalize_departamento_nome(departamento) AS nome_normalizado
  FROM public.pops
  WHERE trim(coalesce(departamento, '')) <> ''
  ORDER BY empresa_id, public.normalize_departamento_nome(departamento), trim(regexp_replace(departamento, '\s+', ' ', 'g'))
)
INSERT INTO public.departamentos (empresa_id, nome, nome_normalizado)
SELECT empresa_id, nome, nome_normalizado
FROM raw_departamentos
ON CONFLICT (empresa_id, nome_normalizado) DO NOTHING;

UPDATE public.pops p
SET departamento_id = d.id,
    departamento = d.nome
FROM public.departamentos d
WHERE p.empresa_id = d.empresa_id
  AND public.normalize_departamento_nome(p.departamento) = d.nome_normalizado
  AND p.departamento_id IS NULL;

ALTER TABLE public.pops
  ADD CONSTRAINT pops_departamento_empresa_fk
  FOREIGN KEY (empresa_id, departamento_id)
  REFERENCES public.departamentos(empresa_id, id)
  ON DELETE RESTRICT
  NOT VALID;

-- Barreira de integridade complementar ao índice único.
-- Pode ser criada mesmo quando existem duplicatas antigas que ainda impedem o índice único.
CREATE OR REPLACE FUNCTION public.tg_prevent_duplicate_pop_etapas_ordem()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.pop_etapas e
    WHERE e.pop_versao_id = NEW.pop_versao_id
      AND e.ordem = NEW.ordem
      AND e.id <> NEW.id
  ) THEN
    RAISE EXCEPTION 'Já existe etapa para a versão % na ordem %', NEW.pop_versao_id, NEW.ordem
      USING ERRCODE = 'unique_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_duplicate_pop_etapas_ordem ON public.pop_etapas;
CREATE TRIGGER prevent_duplicate_pop_etapas_ordem
  BEFORE INSERT OR UPDATE OF pop_versao_id, ordem ON public.pop_etapas
  FOR EACH ROW EXECUTE FUNCTION public.tg_prevent_duplicate_pop_etapas_ordem();

REVOKE ALL ON FUNCTION public.tg_prevent_duplicate_pop_etapas_ordem() FROM public, anon, authenticated;

-- Permite que a Base de Conhecimento reutilize a tabela de metadados existente para mídia inline (@referencia),
-- mantendo anexos legados compatíveis sem expor uma aba duplicada na UI.
ALTER TABLE public.base_conhecimento_anexos
  ADD COLUMN IF NOT EXISTS referencia text,
  ADD COLUMN IF NOT EXISTS uso text NOT NULL DEFAULT 'anexo';

ALTER TABLE public.base_conhecimento_anexos
  DROP CONSTRAINT IF EXISTS base_conhecimento_anexos_uso_check;

ALTER TABLE public.base_conhecimento_anexos
  ADD CONSTRAINT base_conhecimento_anexos_uso_check CHECK (uso IN ('anexo', 'inline'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_base_conhecimento_anexos_inline_ref
  ON public.base_conhecimento_anexos(base_conhecimento_id, referencia)
  WHERE uso = 'inline' AND referencia IS NOT NULL;

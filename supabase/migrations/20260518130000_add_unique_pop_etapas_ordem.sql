-- Proteção de integridade: dentro de uma versão de POP, cada ordem deve existir uma única vez.
-- Se houver dados antigos duplicados, não falha a migration; a limpeza manual deve ser feita antes de criar o índice.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.pop_etapas
    GROUP BY pop_versao_id, ordem
    HAVING count(*) > 1
  ) THEN
    RAISE NOTICE 'idx_pop_etapas_versao_ordem_unique não criado: existem duplicatas em public.pop_etapas por pop_versao_id + ordem.';
  ELSE
    CREATE UNIQUE INDEX IF NOT EXISTS idx_pop_etapas_versao_ordem_unique
      ON public.pop_etapas(pop_versao_id, ordem);
  END IF;
END $$;

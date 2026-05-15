-- Anexos da Base de Conhecimento: metadados em tabela própria e arquivos no bucket público já existente `pop-midias`.
-- Path convencionado no storage: {empresa_id}/base-conhecimento/{base_conhecimento_id}/{uuid-nome-arquivo}
CREATE TABLE public.base_conhecimento_anexos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  base_conhecimento_id uuid NOT NULL REFERENCES public.base_conhecimento(id) ON DELETE CASCADE,
  nome_arquivo text NOT NULL,
  tipo_arquivo text NOT NULL DEFAULT 'arquivo',
  mime_type text NOT NULL DEFAULT 'application/octet-stream',
  tamanho bigint,
  storage_path text NOT NULL,
  url text NOT NULL,
  criado_por uuid NOT NULL REFERENCES public.usuarios(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT base_conhecimento_anexos_tamanho_check CHECK (tamanho IS NULL OR (tamanho >= 0 AND tamanho <= 26214400)),
  CONSTRAINT base_conhecimento_anexos_storage_path_check CHECK (storage_path <> '')
);

CREATE INDEX idx_base_conhecimento_anexos_conteudo ON public.base_conhecimento_anexos(base_conhecimento_id, created_at DESC);
CREATE INDEX idx_base_conhecimento_anexos_empresa ON public.base_conhecimento_anexos(empresa_id);

ALTER TABLE public.base_conhecimento_anexos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "base_conhecimento_anexos: select conforme conteúdo pai" ON public.base_conhecimento_anexos
  FOR SELECT TO authenticated
  USING (
    empresa_id = public.current_empresa_id()
    AND EXISTS (
      SELECT 1
      FROM public.base_conhecimento bc
      WHERE bc.id = base_conhecimento_anexos.base_conhecimento_id
        AND bc.empresa_id = base_conhecimento_anexos.empresa_id
        AND (
          bc.autor_id = auth.uid()
          OR (
            bc.visibilidade = 'empresa'
            AND (
              bc.status IN ('publicado', 'resolvida')
              OR (
                bc.status IN ('rascunho', 'revisao', 'arquivado')
                AND (bc.responsavel_id = auth.uid() OR public.current_user_can_manage_pops())
              )
            )
          )
        )
    )
  );

CREATE POLICY "base_conhecimento_anexos: insert autor ou gestor" ON public.base_conhecimento_anexos
  FOR INSERT TO authenticated
  WITH CHECK (
    empresa_id = public.current_empresa_id()
    AND criado_por = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.base_conhecimento bc
      WHERE bc.id = base_conhecimento_anexos.base_conhecimento_id
        AND bc.empresa_id = base_conhecimento_anexos.empresa_id
        AND (bc.autor_id = auth.uid() OR public.current_user_can_manage_pops())
    )
    AND (storage.foldername(storage_path))[1] = empresa_id::text
  );

CREATE POLICY "base_conhecimento_anexos: delete autor anexo conteúdo ou gestor" ON public.base_conhecimento_anexos
  FOR DELETE TO authenticated
  USING (
    empresa_id = public.current_empresa_id()
    AND (
      criado_por = auth.uid()
      OR public.current_user_can_manage_pops()
      OR EXISTS (
        SELECT 1
        FROM public.base_conhecimento bc
        WHERE bc.id = base_conhecimento_anexos.base_conhecimento_id
          AND bc.empresa_id = base_conhecimento_anexos.empresa_id
          AND bc.autor_id = auth.uid()
      )
    )
  );

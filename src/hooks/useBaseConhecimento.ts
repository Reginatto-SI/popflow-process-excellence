import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type KnowledgeType = "artigo" | "duvida" | "solucao_erro" | "anotacao";
export type KnowledgeStatus = "rascunho" | "revisao" | "publicado" | "arquivado" | "aberta" | "resolvida";
export type KnowledgeVisibility = "privado" | "empresa";

export interface KnowledgeUser {
  id: string;
  nome: string;
  email: string;
}

export interface KnowledgePopLink {
  id: string;
  titulo: string;
}

export interface KnowledgeAttachment {
  id: string;
  empresa_id: string;
  base_conhecimento_id: string;
  nome_arquivo: string;
  tipo_arquivo: string;
  mime_type: string;
  tamanho: number | null;
  storage_path: string;
  url: string;
  referencia: string | null;
  uso: "anexo" | "inline";
  criado_por: string;
  created_at: string;
}

export interface KnowledgeContent {
  id: string;
  empresa_id: string;
  tipo: KnowledgeType;
  titulo: string;
  resumo: string;
  conteudo: string;
  pergunta: string;
  resposta: string;
  sistema_relacionado: string;
  erro_relacionado: string;
  causa: string;
  solucao: string;
  observacoes: string;
  categoria: string;
  departamento: string;
  tags: string[];
  status: KnowledgeStatus;
  visibilidade: KnowledgeVisibility;
  responsavel_id: string | null;
  autor_id: string;
  pop_id: string | null;
  etapa_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  autor: KnowledgeUser | null;
  responsavel: KnowledgeUser | null;
  pop: KnowledgePopLink | null;
  anexos?: KnowledgeAttachment[];
}

export interface KnowledgeContentInput {
  tipo: KnowledgeType;
  titulo: string;
  resumo: string;
  conteudo: string;
  pergunta: string;
  resposta: string;
  sistema_relacionado: string;
  erro_relacionado: string;
  causa: string;
  solucao: string;
  observacoes: string;
  categoria: string;
  departamento: string;
  tags: string[];
  status: KnowledgeStatus;
  visibilidade: KnowledgeVisibility;
  responsavel_id: string | null;
  pop_id: string | null;
  etapa_id: string | null;
}

export function useKnowledgeContents() {
  return useQuery({
    queryKey: ["base-conhecimento"],
    queryFn: async (): Promise<KnowledgeContent[]> => {
      // A visibilidade privada e o isolamento por empresa são reforçados por RLS na tabela base_conhecimento.
      const { data, error } = await supabase
        .from("base_conhecimento")
        .select(
          "*, autor:usuarios!base_conhecimento_autor_id_fkey(id,nome,email), responsavel:usuarios!base_conhecimento_responsavel_id_fkey(id,nome,email), pop:pops(id,titulo), anexos:base_conhecimento_anexos(*)",
        )
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as KnowledgeContent[];
    },
  });
}

async function currentUserEmpresaId(userId: string) {
  const { data: usuario, error } = await supabase
    .from("usuarios")
    .select("empresa_id")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!usuario) throw new Error("Usuário sem empresa");
  return usuario.empresa_id;
}

export function useKnowledgeAttachments(contentId?: string | null) {
  return useQuery({
    enabled: !!contentId,
    queryKey: ["base-conhecimento-anexos", contentId],
    queryFn: async (): Promise<KnowledgeAttachment[]> => {
      // A RLS da tabela de anexos replica a autorização do conteúdo pai e bloqueia acesso cross-tenant.
      const { data, error } = await supabase
        .from("base_conhecimento_anexos")
        .select("*")
        .eq("base_conhecimento_id", contentId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as KnowledgeAttachment[];
    },
  });
}

const attachmentKind = (mimeType: string, fileName: string) => {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (mimeType.startsWith("image/")) return "imagem";
  if (mimeType === "application/pdf" || extension === "pdf") return "pdf";
  if (["doc", "docx"].includes(extension)) return "documento";
  if (["xls", "xlsx"].includes(extension)) return "planilha";
  if (mimeType.startsWith("text/") || extension === "txt") return "texto";
  return extension || "arquivo";
};

const safeFileName = (fileName: string) => fileName.replace(/[^A-Za-z0-9._-]/g, "_");

export function useUploadKnowledgeAttachment() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ contentId, file }: { contentId: string; file: File }) => {
      if (!user) throw new Error("Não autenticado");
      const empresa_id = await currentUserEmpresaId(user.id);
      const safeName = safeFileName(file.name);
      const storage_path = `${empresa_id}/base-conhecimento/${contentId}/${crypto.randomUUID()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("pop-midias")
        .upload(storage_path, file, { contentType: file.type || "application/octet-stream", upsert: false });
      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage.from("pop-midias").getPublicUrl(storage_path);
      const { data, error } = await supabase
        .from("base_conhecimento_anexos")
        .insert({
          empresa_id,
          base_conhecimento_id: contentId,
          nome_arquivo: file.name,
          tipo_arquivo: attachmentKind(file.type, file.name),
          mime_type: file.type || "application/octet-stream",
          tamanho: file.size,
          storage_path,
          url: publicUrl.publicUrl,
          criado_por: user.id,
        })
        .select("*")
        .single();
      if (error) {
        await supabase.storage.from("pop-midias").remove([storage_path]);
        throw error;
      }
      return data as KnowledgeAttachment;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["base-conhecimento"] });
      qc.invalidateQueries({ queryKey: ["base-conhecimento-anexos", variables.contentId] });
    },
  });
}

export function useDeleteKnowledgeAttachment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (attachment: KnowledgeAttachment) => {
      if (attachment.storage_path) {
        // Remove primeiro do storage para não informar sucesso quando o arquivo público continua acessível.
        const { error: storageError } = await supabase.storage.from("pop-midias").remove([attachment.storage_path]);
        if (storageError) {
          throw new Error(`Não foi possível remover o arquivo do storage: ${storageError.message}`);
        }
      }

      const { error } = await supabase.from("base_conhecimento_anexos").delete().eq("id", attachment.id);
      if (error) throw error;
    },
    onSuccess: (_data, attachment) => {
      qc.invalidateQueries({ queryKey: ["base-conhecimento"] });
      qc.invalidateQueries({ queryKey: ["base-conhecimento-anexos", attachment.base_conhecimento_id] });
    },
  });
}

export function useCreateKnowledgeContent() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: KnowledgeContentInput) => {
      if (!user) throw new Error("Não autenticado");
      const empresa_id = await currentUserEmpresaId(user.id);
      const { data, error } = await supabase
        .from("base_conhecimento")
        .insert({
          ...input,
          empresa_id,
          autor_id: user.id,
          responsavel_id: input.responsavel_id || null,
          pop_id: input.pop_id || null,
          etapa_id: input.etapa_id || null,
          published_at: input.status === "publicado" ? new Date().toISOString() : null,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["base-conhecimento"] }),
  });
}

export function useUpdateKnowledgeContent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: KnowledgeContentInput }) => {
      const { error } = await supabase
        .from("base_conhecimento")
        .update({
          ...input,
          responsavel_id: input.responsavel_id || null,
          pop_id: input.pop_id || null,
          etapa_id: input.etapa_id || null,
          published_at: input.status === "publicado" ? new Date().toISOString() : null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["base-conhecimento"] }),
  });
}

export function useDeleteKnowledgeContent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("base_conhecimento").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["base-conhecimento"] }),
  });
}

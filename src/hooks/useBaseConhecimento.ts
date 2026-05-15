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
          "*, autor:usuarios!base_conhecimento_autor_id_fkey(id,nome,email), responsavel:usuarios!base_conhecimento_responsavel_id_fkey(id,nome,email), pop:pops(id,titulo)",
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

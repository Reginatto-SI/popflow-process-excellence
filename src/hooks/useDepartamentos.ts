import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface DepartamentoRow {
  id: string;
  empresa_id: string;
  nome: string;
  nome_normalizado: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export const normalizeDepartamentoNome = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

export function useDepartamentos(options?: { incluirInativos?: boolean }) {
  return useQuery({
    queryKey: ["departamentos", options?.incluirInativos ?? false],
    queryFn: async (): Promise<DepartamentoRow[]> => {
      let query = supabase
        .from("departamentos")
        .select("*")
        .order("nome", { ascending: true });

      if (!options?.incluirInativos) query = query.eq("ativo", true);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as DepartamentoRow[];
    },
  });
}

export function useCreateDepartamento() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (nome: string) => {
      if (!user) throw new Error("Não autenticado");
      const nomeLimpo = nome.trim().replace(/\s+/g, " ");
      if (!nomeLimpo) throw new Error("Informe o nome do departamento.");

      const { data: usuario, error: usuarioError } = await supabase
        .from("usuarios")
        .select("empresa_id")
        .eq("id", user.id)
        .maybeSingle();
      if (usuarioError) throw usuarioError;
      if (!usuario?.empresa_id) throw new Error("Empresa do usuário não encontrada.");

      const { data, error } = await supabase
        .from("departamentos")
        .insert({ empresa_id: usuario.empresa_id, nome: nomeLimpo })
        .select()
        .single();
      if (error) {
        if (error.code === "23505") throw new Error("Já existe um departamento equivalente cadastrado.");
        throw error;
      }
      return data as unknown as DepartamentoRow;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["departamentos"] }),
  });
}

export function useUpdateDepartamento() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, nome, ativo }: { id: string; nome?: string; ativo?: boolean }) => {
      const payload: { nome?: string; ativo?: boolean } = {};
      if (nome !== undefined) {
        const nomeLimpo = nome.trim().replace(/\s+/g, " ");
        if (!nomeLimpo) throw new Error("Informe o nome do departamento.");
        payload.nome = nomeLimpo;
      }
      if (ativo !== undefined) payload.ativo = ativo;

      const { data, error } = await supabase
        .from("departamentos")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
      if (error) {
        if (error.code === "23505") throw new Error("Já existe um departamento equivalente cadastrado.");
        throw error;
      }
      return data as unknown as DepartamentoRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["departamentos"] });
      qc.invalidateQueries({ queryKey: ["pops"] });
    },
  });
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { PopEtapaRow, PopMidiaRow, PopRow, PopVersaoRow } from "@/hooks/usePops";

export type ExecucaoStatus = "em_andamento" | "concluida" | "cancelada";

export interface ExecucaoRow {
  id: string;
  empresa_id: string;
  pop_id: string;
  pop_versao_id: string;
  usuario_id: string;
  status: ExecucaoStatus;
  data_inicio: string;
  data_fim: string | null;
  tempo_total_segundos: number | null;
}

export interface ExecucaoEtapaRow {
  id: string;
  empresa_id: string;
  execucao_id: string;
  etapa_id: string;
  usuario_id: string;
  data_inicio: string | null;
  data_fim: string | null;
  tempo_gasto_segundos: number | null;
  concluido: boolean;
}

export interface ExecucaoFull {
  execucao: ExecucaoRow;
  pop: PopRow;
  versao: PopVersaoRow;
  etapas: PopEtapaRow[];
  midias: PopMidiaRow[];
}

// MVP: permite iniciar execução também para POP em rascunho.
// TODO: quando o fluxo de revisão/publicação estiver pronto,
// restringir para versões com status = 'publicado'.
export function useStartExecucao() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ popId, popVersaoId }: { popId: string; popVersaoId: string }) => {
      if (!user) throw new Error("Não autenticado");
      const { data: usuario, error: uerr } = await supabase
        .from("usuarios")
        .select("empresa_id")
        .eq("id", user.id)
        .maybeSingle();
      if (uerr) throw uerr;
      if (!usuario) throw new Error("Usuário sem empresa");

      const { data, error } = await supabase
        .from("execucoes")
        .insert({
          empresa_id: usuario.empresa_id,
          pop_id: popId,
          pop_versao_id: popVersaoId,
          usuario_id: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["execucoes"] }),
  });
}

export function useExecucao(execucaoId: string | undefined) {
  return useQuery({
    enabled: !!execucaoId,
    queryKey: ["execucao", execucaoId],
    queryFn: async (): Promise<ExecucaoFull | null> => {
      if (!execucaoId) return null;
      const { data: execucao, error } = await supabase
        .from("execucoes")
        .select("*")
        .eq("id", execucaoId)
        .maybeSingle();
      if (error) throw error;
      if (!execucao) return null;

      const [{ data: pop }, { data: versao }, { data: etapas }, { data: midias }] = await Promise.all([
        supabase.from("pops").select("*").eq("id", execucao.pop_id).maybeSingle(),
        supabase.from("pop_versoes").select("*").eq("id", execucao.pop_versao_id).maybeSingle(),
        supabase.from("pop_etapas").select("*").eq("pop_versao_id", execucao.pop_versao_id).order("ordem"),
        supabase.from("pop_midias").select("*").eq("pop_versao_id", execucao.pop_versao_id).order("ordem"),
      ]);

      if (!pop || !versao) return null;
      return {
        execucao: execucao as unknown as ExecucaoRow,
        pop: pop as unknown as PopRow,
        versao: versao as unknown as PopVersaoRow,
        etapas: (etapas ?? []) as unknown as PopEtapaRow[],
        midias: (midias ?? []) as unknown as PopMidiaRow[],
      };
    },
  });
}

export function useExecucaoEtapas(execucaoId: string | undefined) {
  return useQuery({
    enabled: !!execucaoId,
    queryKey: ["execucao-etapas", execucaoId],
    queryFn: async (): Promise<ExecucaoEtapaRow[]> => {
      if (!execucaoId) return [];
      const { data, error } = await supabase
        .from("execucao_etapas")
        .select("*")
        .eq("execucao_id", execucaoId);
      if (error) throw error;
      return (data ?? []) as unknown as ExecucaoEtapaRow[];
    },
  });
}

export function useConcluirEtapa() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      execucaoId,
      etapaId,
      empresaId,
      iniciadaEm,
    }: {
      execucaoId: string;
      etapaId: string;
      empresaId: string;
      iniciadaEm: string;
    }) => {
      if (!user) throw new Error("Não autenticado");
      const agora = new Date();
      const inicio = new Date(iniciadaEm);
      const tempo = Math.max(0, Math.round((agora.getTime() - inicio.getTime()) / 1000));

      const { error } = await supabase
        .from("execucao_etapas")
        .upsert(
          {
            execucao_id: execucaoId,
            etapa_id: etapaId,
            empresa_id: empresaId,
            usuario_id: user.id,
            data_inicio: iniciadaEm,
            data_fim: agora.toISOString(),
            tempo_gasto_segundos: tempo,
            concluido: true,
          },
          { onConflict: "execucao_id,etapa_id" }
        );
      if (error) throw error;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["execucao-etapas", vars.execucaoId] }),
  });
}

export function useFinalizarExecucao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ execucaoId, inicio }: { execucaoId: string; inicio: string }) => {
      const agora = new Date();
      const tempo = Math.max(0, Math.round((agora.getTime() - new Date(inicio).getTime()) / 1000));
      const { error } = await supabase
        .from("execucoes")
        .update({
          status: "concluida",
          data_fim: agora.toISOString(),
          tempo_total_segundos: tempo,
        })
        .eq("id", execucaoId);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["execucao", vars.execucaoId] }),
  });
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// ===== Tipos compartilhados =====
export type PopStatus = "rascunho" | "revisao" | "publicado";
export type PopVisibilidade = "privado" | "empresa";
export type PopMidiaTipo = "imagem" | "audio" | "video" | "documento";

export interface ChecklistItem {
  id: string;
  texto: string;
}

export interface PopEtapaRow {
  id: string;
  pop_versao_id: string;
  ordem: number;
  titulo: string;
  descricao: string;
  tempo_estimado: string;
  pre_requisito: string;
  resultado_esperado: string;
  erro_comum: string;
  checklist: ChecklistItem[];
}

export interface PopMidiaRow {
  id: string;
  pop_versao_id: string;
  etapa_id: string | null;
  referencia: string;
  nome: string;
  tipo: PopMidiaTipo;
  url: string | null;
  ordem: number;
}

export interface PopVersaoRow {
  id: string;
  pop_id: string;
  numero: string;
  status: PopStatus;
  created_at: string;
}

export interface PopRow {
  id: string;
  empresa_id: string;
  arquivado: boolean;
  titulo: string;
  descricao: string;
  departamento: string;
  responsavel: string;
  visibilidade: PopVisibilidade;
  owner_id: string;
  versao_ativa_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PopWithVersion extends PopRow {
  versao_ativa: PopVersaoRow | null;
}

export interface PopFull extends PopRow {
  versao_ativa: (PopVersaoRow & {
    etapas: PopEtapaRow[];
    midias: PopMidiaRow[];
  }) | null;
}

// ===== Lista =====
export function usePops() {
  return useQuery({
    queryKey: ["pops"],
    queryFn: async (): Promise<PopWithVersion[]> => {
      const { data, error } = await supabase
        .from("pops")
        .select("*, versao_ativa:pop_versoes!pops_versao_ativa_fk(id, pop_id, numero, status, created_at)")
        .eq("arquivado", false)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as PopWithVersion[];
    },
  });
}

// ===== Detalhe completo =====
export function usePop(id: string | undefined) {
  return useQuery({
    enabled: !!id,
    queryKey: ["pop", id],
    queryFn: async (): Promise<PopFull | null> => {
      if (!id) return null;
      const { data: pop, error } = await supabase
        .from("pops")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!pop) return null;

      let versao_ativa: PopFull["versao_ativa"] = null;
      if (pop.versao_ativa_id) {
        const { data: v } = await supabase
          .from("pop_versoes")
          .select("*")
          .eq("id", pop.versao_ativa_id)
          .maybeSingle();

        if (v) {
          const [{ data: etapas }, { data: midias }] = await Promise.all([
            supabase.from("pop_etapas").select("*").eq("pop_versao_id", v.id).order("ordem"),
            supabase.from("pop_midias").select("*").eq("pop_versao_id", v.id).order("ordem"),
          ]);
          versao_ativa = {
            ...(v as PopVersaoRow),
            etapas: (etapas ?? []) as unknown as PopEtapaRow[],
            midias: (midias ?? []) as unknown as PopMidiaRow[],
          };
        }
      }

      return { ...(pop as PopRow), versao_ativa };
    },
  });
}

// ===== Payloads de salvamento =====
export interface EtapaInput {
  ordem: number;
  titulo: string;
  descricao: string;
  tempo_estimado: string;
  pre_requisito: string;
  resultado_esperado: string;
  erro_comum: string;
  checklist: ChecklistItem[];
}

export interface MidiaInput {
  etapa_ordem: number | null; // ligamos por ordem para mídia ↔ etapa
  referencia: string;
  nome: string;
  tipo: PopMidiaTipo;
  ordem: number;
  url?: string | null;
}

export interface CreatePopInput {
  titulo: string;
  descricao: string;
  departamento: string;
  responsavel: string;
  visibilidade: PopVisibilidade;
  etapas: EtapaInput[];
  midias: MidiaInput[];
}

// ===== Criar POP completo =====
export function useCreatePop() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreatePopInput) => {
      if (!user) throw new Error("Não autenticado");

      // Buscar empresa_id do usuário
      const { data: usuario, error: uerr } = await supabase
        .from("usuarios")
        .select("empresa_id")
        .eq("id", user.id)
        .maybeSingle();
      if (uerr) throw uerr;
      if (!usuario) throw new Error("Usuário sem empresa");
      const empresa_id = usuario.empresa_id;

      // 1) pops
      const { data: pop, error: perr } = await supabase
        .from("pops")
        .insert({
          empresa_id,
          owner_id: user.id,
          titulo: input.titulo,
          descricao: input.descricao,
          departamento: input.departamento,
          responsavel: input.responsavel,
          visibilidade: input.visibilidade,
        })
        .select()
        .single();
      if (perr) throw perr;

      // 2) versão inicial v1.0 / rascunho
      const { data: versao, error: verr } = await supabase
        .from("pop_versoes")
        .insert({
          pop_id: pop.id,
          empresa_id,
          numero: "v1.0",
          status: "rascunho",
          created_by: user.id,
        })
        .select()
        .single();
      if (verr) throw verr;

      // 3) etapas
      const etapasInsert = input.etapas.map((e) => ({
        pop_versao_id: versao.id,
        empresa_id,
        ordem: e.ordem,
        titulo: e.titulo,
        descricao: e.descricao,
        tempo_estimado: e.tempo_estimado,
        pre_requisito: e.pre_requisito,
        resultado_esperado: e.resultado_esperado,
        erro_comum: e.erro_comum,
        checklist: e.checklist as unknown as never,
      }));
      const { data: etapasCriadas, error: eerr } = await supabase
        .from("pop_etapas")
        .insert(etapasInsert)
        .select();
      if (eerr) throw eerr;

      // 4) mídias (vincular etapa por ordem)
      if (input.midias.length > 0) {
        const ordemToId = new Map<number, string>();
        (etapasCriadas ?? []).forEach((e: { ordem: number; id: string }) => ordemToId.set(e.ordem, e.id));

        const midiasInsert = input.midias.map((m) => ({
          pop_versao_id: versao.id,
          empresa_id,
          etapa_id: m.etapa_ordem != null ? ordemToId.get(m.etapa_ordem) ?? null : null,
          referencia: m.referencia,
          nome: m.nome,
          tipo: m.tipo,
          ordem: m.ordem,
          url: m.url ?? null,
        }));
        const { error: merr } = await supabase.from("pop_midias").insert(midiasInsert);
        if (merr) throw merr;
      }

      // 5) marcar versão ativa
      const { error: uperr } = await supabase
        .from("pops")
        .update({ versao_ativa_id: versao.id })
        .eq("id", pop.id);
      if (uperr) throw uperr;

      return pop.id as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pops"] });
    },
  });
}

// ===== Atualizar POP existente (sobrescreve etapas/mídias da versão atual) =====
export function useUpdatePop() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ popId, input }: { popId: string; input: CreatePopInput }) => {
      if (!user) throw new Error("Não autenticado");

      const { data: pop, error: gerr } = await supabase
        .from("pops")
        .select("*")
        .eq("id", popId)
        .maybeSingle();
      if (gerr) throw gerr;
      if (!pop) throw new Error("POP não encontrado");
      if (!pop.versao_ativa_id) throw new Error("POP sem versão ativa");

      // Atualizar campos do POP
      const { error: uerr } = await supabase
        .from("pops")
        .update({
          titulo: input.titulo,
          descricao: input.descricao,
          departamento: input.departamento,
          responsavel: input.responsavel,
          visibilidade: input.visibilidade,
        })
        .eq("id", popId);
      if (uerr) throw uerr;

      // No MVP: edição direta da versão atual em rascunho. Limpar e recriar etapas/mídias.
      // (Próxima etapa do PRD 10: criar nova versão se status != rascunho)
      await supabase.from("pop_midias").delete().eq("pop_versao_id", pop.versao_ativa_id);
      await supabase.from("pop_etapas").delete().eq("pop_versao_id", pop.versao_ativa_id);

      const etapasInsert = input.etapas.map((e) => ({
        pop_versao_id: pop.versao_ativa_id!,
        empresa_id: pop.empresa_id,
        ordem: e.ordem,
        titulo: e.titulo,
        descricao: e.descricao,
        tempo_estimado: e.tempo_estimado,
        pre_requisito: e.pre_requisito,
        resultado_esperado: e.resultado_esperado,
        erro_comum: e.erro_comum,
        checklist: e.checklist as unknown as never,
      }));
      const { data: etapasCriadas, error: eerr } = await supabase
        .from("pop_etapas")
        .insert(etapasInsert)
        .select();
      if (eerr) throw eerr;

      if (input.midias.length > 0) {
        const ordemToId = new Map<number, string>();
        (etapasCriadas ?? []).forEach((e: { ordem: number; id: string }) => ordemToId.set(e.ordem, e.id));
        const midiasInsert = input.midias.map((m) => ({
          pop_versao_id: pop.versao_ativa_id!,
          empresa_id: pop.empresa_id,
          etapa_id: m.etapa_ordem != null ? ordemToId.get(m.etapa_ordem) ?? null : null,
          referencia: m.referencia,
          nome: m.nome,
          tipo: m.tipo,
          ordem: m.ordem,
          url: m.url ?? null,
        }));
        const { error: merr } = await supabase.from("pop_midias").insert(midiasInsert);
        if (merr) throw merr;
      }

      return popId;
    },
    onSuccess: (popId) => {
      qc.invalidateQueries({ queryKey: ["pops"] });
      qc.invalidateQueries({ queryKey: ["pop", popId] });
    },
  });
}

// ===== Excluir / arquivar com segurança =====
export interface PopDeleteImpact {
  hasExecutions: boolean;
}

const canManagePops = (role?: string | null) => role === "admin" || role === "gestor" || role === "criador" || role === "developer";

async function getPopDeleteImpact(popId: string, empresaId?: string): Promise<PopDeleteImpact> {
  const execucoesQuery = supabase
    .from("execucoes")
    .select("id", { count: "exact", head: true })
    .eq("pop_id", popId);
  const { count: execucoesCount, error: execucoesError } = await (empresaId
    ? execucoesQuery.eq("empresa_id", empresaId)
    : execucoesQuery);
  if (execucoesError) throw execucoesError;
  if ((execucoesCount ?? 0) > 0) return { hasExecutions: true };

  const versoesQuery = supabase.from("pop_versoes").select("id").eq("pop_id", popId);
  const { data: versoes, error: versoesError } = await (empresaId
    ? versoesQuery.eq("empresa_id", empresaId)
    : versoesQuery);
  if (versoesError) throw versoesError;

  const versaoIds = (versoes ?? []).map((v) => v.id);
  if (versaoIds.length === 0) return { hasExecutions: false };

  const etapasQuery = supabase.from("pop_etapas").select("id").in("pop_versao_id", versaoIds);
  const { data: etapas, error: etapasError } = await (empresaId
    ? etapasQuery.eq("empresa_id", empresaId)
    : etapasQuery);
  if (etapasError) throw etapasError;

  const etapaIds = (etapas ?? []).map((e) => e.id);
  if (etapaIds.length === 0) return { hasExecutions: false };

  const execucaoEtapasQuery = supabase
    .from("execucao_etapas")
    .select("id", { count: "exact", head: true })
    .in("etapa_id", etapaIds);
  const { count: execucaoEtapasCount, error: execucaoEtapasError } = await (empresaId
    ? execucaoEtapasQuery.eq("empresa_id", empresaId)
    : execucaoEtapasQuery);
  if (execucaoEtapasError) throw execucaoEtapasError;

  return { hasExecutions: (execucaoEtapasCount ?? 0) > 0 };
}

export function usePopDeleteImpact(popId: string | null) {
  return useQuery({
    enabled: !!popId,
    queryKey: ["pop-delete-impact", popId],
    queryFn: async () => {
      if (!popId) return { hasExecutions: false };
      return getPopDeleteImpact(popId);
    },
  });
}

export function useDeletePop() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (popId: string): Promise<"deleted" | "archived"> => {
      if (!user) throw new Error("Não autenticado");

      const [{ data: usuario, error: usuarioError }, { data: pop, error: popError }] = await Promise.all([
        supabase.from("usuarios").select("role, empresa_id").eq("id", user.id).maybeSingle(),
        supabase.from("pops").select("id, empresa_id").eq("id", popId).maybeSingle(),
      ]);
      if (usuarioError) throw usuarioError;
      if (popError) throw popError;
      if (!usuario) throw new Error("Usuário sem perfil cadastrado");
      if (!canManagePops(usuario.role)) throw new Error("Você não tem permissão para excluir ou arquivar POPs.");
      if (!pop) throw new Error("POP não encontrado");
      if (pop.empresa_id !== usuario.empresa_id) throw new Error("POP não pertence à empresa ativa.");

      const impact = await getPopDeleteImpact(popId, pop.empresa_id);
      if (impact.hasExecutions) {
        const { error } = await supabase
          .from("pops")
          .update({ arquivado: true })
          .eq("id", popId)
          .eq("empresa_id", pop.empresa_id);
        if (error) throw error;
        return "archived";
      }

      const { data: versoes, error: versoesError } = await supabase
        .from("pop_versoes")
        .select("id")
        .eq("pop_id", popId)
        .eq("empresa_id", pop.empresa_id);
      if (versoesError) throw versoesError;
      const versaoIds = (versoes ?? []).map((v) => v.id);

      // Sem histórico operacional: remove dependências versionadas antes do POP raiz para evitar órfãos e respeitar FKs.
      if (versaoIds.length > 0) {
        const { error: midiasError } = await supabase
          .from("pop_midias")
          .delete()
          .eq("empresa_id", pop.empresa_id)
          .in("pop_versao_id", versaoIds);
        if (midiasError) throw midiasError;

        const { error: etapasError } = await supabase
          .from("pop_etapas")
          .delete()
          .eq("empresa_id", pop.empresa_id)
          .in("pop_versao_id", versaoIds);
        if (etapasError) throw etapasError;
      }

      const { error: clearActiveError } = await supabase
        .from("pops")
        .update({ versao_ativa_id: null })
        .eq("id", popId)
        .eq("empresa_id", pop.empresa_id);
      if (clearActiveError) throw clearActiveError;

      if (versaoIds.length > 0) {
        const { error: versoesDeleteError } = await supabase
          .from("pop_versoes")
          .delete()
          .eq("empresa_id", pop.empresa_id)
          .eq("pop_id", popId);
        if (versoesDeleteError) throw versoesDeleteError;
      }

      const { error: popDeleteError } = await supabase
        .from("pops")
        .delete()
        .eq("id", popId)
        .eq("empresa_id", pop.empresa_id);
      if (popDeleteError) throw popDeleteError;

      return "deleted";
    },
    onSuccess: (_result, popId) => {
      qc.invalidateQueries({ queryKey: ["pops"] });
      qc.invalidateQueries({ queryKey: ["pop", popId] });
      qc.invalidateQueries({ queryKey: ["pop-delete-impact", popId] });
    },
  });
}

// ===== Atualizar status da versão =====
export function useUpdateVersaoStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ versaoId, status }: { versaoId: string; status: PopStatus }) => {
      const { error } = await supabase.from("pop_versoes").update({ status }).eq("id", versaoId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pops"] });
    },
  });
}

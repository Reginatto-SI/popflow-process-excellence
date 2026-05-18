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

export interface PopAtividadeRow {
  id: string;
  empresa_id: string;
  pop_id: string;
  pop_versao_id: string | null;
  usuario_id: string;
  acao: string;
  alvo_tipo: string;
  alvo_id: string | null;
  descricao: string;
  metadata: Record<string, unknown>;
  created_at: string;
  usuario?: { nome: string } | null;
}

const normalizeStepValue = (value: unknown) =>
  String(value ?? "").trim();

const etapaLogicalKey = (etapa: PopEtapaRow) =>
  [
    etapa.pop_versao_id,
    etapa.ordem,
    normalizeStepValue(etapa.titulo),
    normalizeStepValue(etapa.descricao),
    normalizeStepValue(etapa.tempo_estimado),
    normalizeStepValue(etapa.pre_requisito),
    normalizeStepValue(etapa.resultado_esperado),
    normalizeStepValue(etapa.erro_comum),
    JSON.stringify(etapa.checklist ?? []),
  ].join("|");

export const dedupePopEtapas = (etapas: PopEtapaRow[]) => {
  const seen = new Set<string>();

  return etapas.filter((etapa) => {
    const key = etapaLogicalKey(etapa);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

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
            supabase.from("pop_etapas").select("*").eq("pop_versao_id", v.id).order("ordem").order("created_at"),
            supabase.from("pop_midias").select("*").eq("pop_versao_id", v.id).order("ordem"),
          ]);
          const etapasCarregadas = (etapas ?? []) as unknown as PopEtapaRow[];
          versao_ativa = {
            ...(v as PopVersaoRow),
            // Fallback visual: não substitui a integridade de dados por pop_versao_id + ordem no banco/salvamento.
            etapas: dedupePopEtapas(etapasCarregadas),
            midias: (midias ?? []) as unknown as PopMidiaRow[],
          };
        }
      }

      return { ...(pop as PopRow), versao_ativa };
    },
  });
}

// ===== Registro de atividades =====
export function usePopAtividades(popId: string | undefined) {
  return useQuery({
    enabled: !!popId,
    queryKey: ["pop-atividades", popId],
    queryFn: async (): Promise<PopAtividadeRow[]> => {
      if (!popId) return [];
      const { data, error } = await supabase
        .from("pop_atividades")
        .select("*, usuario:usuarios(nome)")
        .eq("pop_id", popId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as PopAtividadeRow[];
    },
  });
}

// ===== Payloads de salvamento =====
export interface EtapaInput {
  id?: string;
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
  id?: string;
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

export const normalizeEtapasInputOrder = (etapas: EtapaInput[]): EtapaInput[] =>
  etapas.map((etapa, index) => ({
    ...etapa,
    ordem: index + 1,
  }));

const getActorName = async (userId: string) => {
  const { data, error } = await supabase.from("usuarios").select("nome").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data?.nome?.trim() || "Usuário";
};

const etapaLabel = (etapa: Pick<EtapaInput | PopEtapaRow, "ordem" | "titulo">) =>
  `Etapa ${etapa.ordem}${etapa.titulo?.trim() ? ` — ${etapa.titulo.trim()}` : ""}`;

const stepChanged = (before: PopEtapaRow, after: EtapaInput) =>
  before.ordem !== after.ordem
  || before.titulo !== after.titulo
  || before.descricao !== after.descricao
  || before.tempo_estimado !== after.tempo_estimado
  || before.pre_requisito !== after.pre_requisito
  || before.resultado_esperado !== after.resultado_esperado
  || before.erro_comum !== after.erro_comum
  || JSON.stringify(before.checklist ?? []) !== JSON.stringify(after.checklist ?? []);

const mediaChanged = (before: PopMidiaRow, after: MidiaInput) =>
  before.referencia !== after.referencia
  || before.nome !== after.nome
  || before.tipo !== after.tipo
  || before.ordem !== after.ordem
  || (before.url ?? null) !== (after.url ?? null);

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
      // Normaliza antes de persistir para nunca enviar duas etapas com a mesma ordem na versão.
      const etapasNormalizadas = normalizeEtapasInputOrder(input.etapas);
      const etapasInsert = etapasNormalizadas.map((e) => ({
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

      const actorName = await getActorName(user.id);
      // Registra a criação do POP no histórico consultado pelo modal de atividades.
      const { error: activityError } = await supabase.from("pop_atividades").insert({
        empresa_id,
        pop_id: pop.id,
        pop_versao_id: versao.id,
        usuario_id: user.id,
        acao: "pop_criado",
        alvo_tipo: "pop",
        alvo_id: pop.id,
        descricao: `${actorName} criou o POP`,
        metadata: { titulo: input.titulo } as never,
      });
      if (activityError) throw activityError;

      return pop.id as string;
    },
    onSuccess: (popId) => {
      qc.invalidateQueries({ queryKey: ["pops"] });
      qc.invalidateQueries({ queryKey: ["pop-atividades", popId] });
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

      const [{ data: etapasAtuais, error: etapasAtuaisError }, { data: midiasAtuais, error: midiasAtuaisError }] = await Promise.all([
        supabase.from("pop_etapas").select("*").eq("pop_versao_id", pop.versao_ativa_id).order("ordem"),
        supabase.from("pop_midias").select("*").eq("pop_versao_id", pop.versao_ativa_id).order("ordem"),
      ]);
      if (etapasAtuaisError) throw etapasAtuaisError;
      if (midiasAtuaisError) throw midiasAtuaisError;

      const oldEtapas = (etapasAtuais ?? []) as unknown as PopEtapaRow[];
      const oldMidias = (midiasAtuais ?? []) as unknown as PopMidiaRow[];
      const oldEtapasById = new Map(oldEtapas.map((etapa) => [etapa.id, etapa]));
      const oldMidiasById = new Map(oldMidias.map((midia) => [midia.id, midia]));
      const actorName = await getActorName(user.id);

      const oldEtapaIds = oldEtapas.map((etapa) => etapa.id);
      if (oldEtapaIds.length > 0) {
        // Valida bloqueio antes de qualquer DELETE destrutivo: execuções usam FK RESTRICT para etapas.
        const { count: execucoesVinculadas, error: execucoesVinculadasError } = await supabase
          .from("execucao_etapas")
          .select("id", { count: "exact", head: true })
          .in("etapa_id", oldEtapaIds);
        if (execucoesVinculadasError) throw execucoesVinculadasError;
        if ((execucoesVinculadas ?? 0) > 0) {
          throw new Error("Este POP já possui execuções vinculadas. Para alterar etapas, será necessário criar uma nova versão do POP.");
        }
      }

      const atividades: Array<{
        empresa_id: string;
        pop_id: string;
        pop_versao_id: string | null;
        usuario_id: string;
        acao: string;
        alvo_tipo: string;
        alvo_id: string | null;
        descricao: string;
        metadata: Record<string, unknown>;
      }> = [];

      if (
        pop.titulo !== input.titulo
        || pop.descricao !== input.descricao
        || pop.departamento !== input.departamento
        || pop.responsavel !== input.responsavel
        || pop.visibilidade !== input.visibilidade
      ) {
        // Registra edição geral de forma resumida, sem diff campo a campo no MVP.
        atividades.push({
          empresa_id: pop.empresa_id,
          pop_id: popId,
          pop_versao_id: pop.versao_ativa_id,
          usuario_id: user.id,
          acao: "pop_informacoes_editadas",
          alvo_tipo: "pop",
          alvo_id: popId,
          descricao: `${actorName} editou as informações gerais do POP`,
          metadata: {},
        });
      }

      // No MVP: edição direta da versão atual em rascunho. Limpar e recriar etapas/mídias.
      // (Próxima etapa do PRD 10: criar nova versão se status != rascunho)
      // Não ignore falhas: mídias são vinculadas às etapas e devem ser recriadas antes da troca de etapas.
      const { data: midiasRemovidas, error: deleteMidiasError } = await supabase
        .from("pop_midias")
        .delete()
        .eq("pop_versao_id", pop.versao_ativa_id)
        .select("id");
      if (deleteMidiasError) throw deleteMidiasError;
      if (oldMidias.length > 0 && (midiasRemovidas?.length ?? 0) !== oldMidias.length) {
        throw new Error("Não foi possível remover todas as mídias antigas do POP. Verifique permissões/RLS antes de salvar novamente.");
      }

      // Não ignore falhas: se etapas antigas permanecerem, o salvamento não deve inserir cópias novas.
      const { data: etapasRemovidas, error: deleteEtapasError } = await supabase
        .from("pop_etapas")
        .delete()
        .eq("pop_versao_id", pop.versao_ativa_id)
        .select("id");
      if (deleteEtapasError) throw deleteEtapasError;
      if (oldEtapas.length > 0 && (etapasRemovidas?.length ?? 0) !== oldEtapas.length) {
        throw new Error("Não foi possível remover todas as etapas antigas do POP. Verifique permissões/RLS antes de salvar novamente.");
      }

      // Normaliza antes de persistir para nunca recriar etapas com ordem duplicada na versão ativa.
      const etapasNormalizadas = normalizeEtapasInputOrder(input.etapas);
      const etapasInsert = etapasNormalizadas.map((e) => ({
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

      const createdEtapas = (etapasCriadas ?? []) as unknown as PopEtapaRow[];
      const createdEtapaByOrdem = new Map(createdEtapas.map((etapa) => [etapa.ordem, etapa]));

      const realEtapaId = (etapa: EtapaInput) =>
        etapa.id && oldEtapasById.has(etapa.id) ? etapa.id : undefined;
      const inputEtapaIds = new Set(etapasNormalizadas.map(realEtapaId).filter(Boolean));
      for (const etapaAntiga of oldEtapas) {
        if (!inputEtapaIds.has(etapaAntiga.id)) {
          // Registra remoção de etapa detectada pelo formulário de edição.
          atividades.push({
            empresa_id: pop.empresa_id,
            pop_id: popId,
            pop_versao_id: pop.versao_ativa_id,
            usuario_id: user.id,
            acao: "etapa_removida",
            alvo_tipo: "etapa",
            alvo_id: etapaAntiga.id,
            descricao: `${actorName} removeu a ${etapaLabel(etapaAntiga)}`,
            metadata: { ordem: etapaAntiga.ordem, titulo: etapaAntiga.titulo },
          });
        }
      }

      for (const etapaNova of etapasNormalizadas) {
        const etapaIdReal = realEtapaId(etapaNova);
        const etapaAntiga = etapaIdReal ? oldEtapasById.get(etapaIdReal) : undefined;
        if (!etapaAntiga) {
          const etapaCriada = createdEtapaByOrdem.get(etapaNova.ordem);
          // Registra etapa nova somente quando não há ID real correspondente no banco.
          atividades.push({
            empresa_id: pop.empresa_id,
            pop_id: popId,
            pop_versao_id: pop.versao_ativa_id,
            usuario_id: user.id,
            acao: "etapa_adicionada",
            alvo_tipo: "etapa",
            alvo_id: etapaCriada?.id ?? null,
            descricao: `${actorName} adicionou a ${etapaLabel(etapaNova)}`,
            metadata: { ordem: etapaNova.ordem, titulo: etapaNova.titulo },
          });
        } else if (stepChanged(etapaAntiga, etapaNova)) {
          // Registra edição de etapa sem detalhar diff campo a campo.
          atividades.push({
            empresa_id: pop.empresa_id,
            pop_id: popId,
            pop_versao_id: pop.versao_ativa_id,
            usuario_id: user.id,
            acao: "etapa_editada",
            alvo_tipo: "etapa",
            alvo_id: etapaAntiga.id,
            descricao: `${actorName} editou a ${etapaLabel(etapaNova)}`,
            metadata: { ordem: etapaNova.ordem, titulo: etapaNova.titulo },
          });
        }
      }

      if (input.midias.length > 0) {
        const ordemToId = new Map<number, string>();
        createdEtapas.forEach((e) => ordemToId.set(e.ordem, e.id));
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

      const realMidiaId = (midia: MidiaInput) =>
        midia.id && oldMidiasById.has(midia.id) ? midia.id : undefined;
      const inputMidiaIds = new Set(input.midias.map(realMidiaId).filter(Boolean));
      for (const midiaAntiga of oldMidias) {
        const etapaAntiga = midiaAntiga.etapa_id ? oldEtapasById.get(midiaAntiga.etapa_id) : undefined;
        if (!inputMidiaIds.has(midiaAntiga.id)) {
          // Registra remoção de mídia quando ela some do formulário.
          atividades.push({
            empresa_id: pop.empresa_id,
            pop_id: popId,
            pop_versao_id: pop.versao_ativa_id,
            usuario_id: user.id,
            acao: "midia_removida",
            alvo_tipo: "midia",
            alvo_id: midiaAntiga.id,
            descricao: `${actorName} removeu uma mídia${etapaAntiga ? ` na ${etapaLabel(etapaAntiga)}` : " do POP"}`,
            metadata: { nome: midiaAntiga.nome, referencia: midiaAntiga.referencia },
          });
        }
      }

      for (const midiaNova of input.midias) {
        const midiaIdReal = realMidiaId(midiaNova);
        const midiaAntiga = midiaIdReal ? oldMidiasById.get(midiaIdReal) : undefined;
        const etapaNova = midiaNova.etapa_ordem != null ? createdEtapaByOrdem.get(midiaNova.etapa_ordem) : undefined;
        if (!midiaAntiga) {
          // Registra adição de mídia identificada no formulário.
          atividades.push({
            empresa_id: pop.empresa_id,
            pop_id: popId,
            pop_versao_id: pop.versao_ativa_id,
            usuario_id: user.id,
            acao: "midia_adicionada",
            alvo_tipo: "midia",
            alvo_id: null,
            descricao: `${actorName} adicionou uma mídia${etapaNova ? ` na ${etapaLabel(etapaNova)}` : " ao POP"}`,
            metadata: { nome: midiaNova.nome, referencia: midiaNova.referencia },
          });
        } else if (mediaChanged(midiaAntiga, midiaNova)) {
          // Registra alteração de mídia de forma resumida.
          atividades.push({
            empresa_id: pop.empresa_id,
            pop_id: popId,
            pop_versao_id: pop.versao_ativa_id,
            usuario_id: user.id,
            acao: "midia_alterada",
            alvo_tipo: "midia",
            alvo_id: midiaAntiga.id,
            descricao: `${actorName} alterou uma mídia${etapaNova ? ` na ${etapaLabel(etapaNova)}` : " do POP"}`,
            metadata: { nome: midiaNova.nome, referencia: midiaNova.referencia },
          });
        }
      }

      // Atualiza dados gerais só depois das exclusões/inserções de etapas e mídias passarem sem erro.
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

      if (atividades.length > 0) {
        const { error: atividadeError } = await supabase.from("pop_atividades").insert(atividades as never);
        if (atividadeError) throw atividadeError;
      }

      return popId;
    },
    onSuccess: (popId) => {
      qc.invalidateQueries({ queryKey: ["pops"] });
      qc.invalidateQueries({ queryKey: ["pop", popId] });
      qc.invalidateQueries({ queryKey: ["pop-atividades", popId] });
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

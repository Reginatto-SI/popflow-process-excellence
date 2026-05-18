import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Building2, CheckCircle2, ChevronDown, ChevronRight, Circle, Eye, FileText, Image, Info, ListChecks, Mic, Plus, Shield, Trash2, User, Video, X } from "lucide-react";

import { AppLayout } from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  usePop,
  useCreatePop,
  useUpdatePop,
  normalizeEtapasInputOrder,
  type ChecklistItem,
  type CreatePopInput,
  type PopMidiaTipo,
  type PopVisibilidade,
} from "@/hooks/usePops";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MediaMentionTextarea, type MediaMentionTextareaHandle } from "@/components/MediaMentionTextarea";
import { InsertMediaDialog, type InsertedMedia } from "@/components/InsertMediaDialog";
import { MediaViewer } from "@/components/MediaViewer";
import { renderMarkdownPreview } from "@/lib/markdownPreview";

type TabKey = "informacoes" | "etapas" | "midias" | "revisao";

interface StepItem {
  uid: string; // local
  ordem: number;
  titulo: string;
  descricao: string;
  tempo: string;
  resultadoEsperado: string;
  erroComum: string;
  preRequisito: string;
  checklist: string; // texto separado por ; — convertemos antes de salvar
}

interface MidiaItem {
  uid: string;
  tipo: PopMidiaTipo;
  nome: string;
  referencia: string;
  etapaOrdem: number | null;
  ordem: number;
  url: string | null;
  uploading?: boolean;
  refTouched?: boolean; // se o usuário editou manualmente a referência
}

const tabs: { key: TabKey; label: string; icon: typeof FileText }[] = [
  { key: "informacoes", label: "Informações Gerais", icon: FileText },
  { key: "etapas", label: "Etapas", icon: ListChecks },
  { key: "midias", label: "Mídias", icon: Image },
  { key: "revisao", label: "Revisão Final", icon: CheckCircle2 },
];

const tipoLabel: Record<PopMidiaTipo, string> = {
  imagem: "Imagem",
  audio: "Áudio",
  video: "Vídeo",
  documento: "Documento/PDF",
};

const tipoIcon: Record<PopMidiaTipo, React.ComponentType<{ className?: string }>> = {
  imagem: Image,
  audio: Mic,
  video: Video,
  documento: FileText,
};

const acceptByTipo: Record<PopMidiaTipo, string> = {
  imagem: "image/*",
  audio: "audio/*",
  video: "video/*",
  documento: "application/pdf,.pdf,.doc,.docx,.xls,.xlsx,.txt",
};

const uid = () => Math.random().toString(36).slice(2, 10);

const MEDIA_REF_REGEX = /@([A-Za-zÀ-ÿ0-9_-]+)/g;

/**
 * Gera slug seguro para referência inline de mídia.
 * Garante que não tenha espaços ou caracteres que quebrem o regex `@([A-Za-zÀ-ÿ0-9_-]+)`.
 * Ex: "Acesso a Tela" → "acesso-a-tela"
 */
const slugifyRef = (s: string): string =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "");

const checklistFromString = (s: string): ChecklistItem[] =>
  s.split(";").map((t) => t.trim()).filter(Boolean).map((texto) => ({ id: crypto.randomUUID(), texto }));

const checklistToString = (items: ChecklistItem[]): string => items.map((i) => i.texto).join("; ");

const hasAdditionalStepInfo = (step: Pick<StepItem, "resultadoEsperado" | "erroComum" | "preRequisito" | "checklist">) =>
  [step.resultadoEsperado, step.erroComum, step.preRequisito, step.checklist].some((value) => value.trim().length > 0);

const PopCreateEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const { data: popData, isLoading } = usePop(id);
  const createPop = useCreatePop();
  const updatePop = useUpdatePop();
  const { user } = useAuth();

  const { data: perfilUsuarioLogado } = useQuery({
    enabled: !!user?.id && !isEdit,
    queryKey: ["perfil", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("usuarios")
        .select("nome")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const nomeResponsavelUsuarioLogado = useMemo(() => {
    const metadata = user?.user_metadata ?? {};
    return (
      perfilUsuarioLogado?.nome?.trim() ||
      (typeof metadata.nome === "string" ? metadata.nome.trim() : "") ||
      (typeof metadata.name === "string" ? metadata.name.trim() : "") ||
      (typeof metadata.full_name === "string" ? metadata.full_name.trim() : "") ||
      user?.email?.trim() ||
      ""
    );
  }, [perfilUsuarioLogado?.nome, user?.email, user?.user_metadata]);

  const responsavelEditadoPeloUsuarioRef = useRef(false);

  const [activeTab, setActiveTab] = useState<TabKey>("informacoes");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [visibilidade, setVisibilidade] = useState<PopVisibilidade>("empresa");
  const [steps, setSteps] = useState<StepItem[]>([
    { uid: uid(), ordem: 1, titulo: "Nova etapa 1", descricao: "", tempo: "5 min", resultadoEsperado: "", erroComum: "", preRequisito: "", checklist: "" },
  ]);
  const [midias, setMidias] = useState<MidiaItem[]>([]);
  const [expandedMidiaUid, setExpandedMidiaUid] = useState<string | null>(null);
  const [expandedStepUid, setExpandedStepUid] = useState<string | null>(null);
  const [allStepsExpanded, setAllStepsExpanded] = useState(false);
  const [additionalInfoOpenByStep, setAdditionalInfoOpenByStep] = useState<Record<string, boolean>>({});
  const [previewStepUid, setPreviewStepUid] = useState<string | null>(null);
  const [previewMidia, setPreviewMidia] = useState<MidiaItem | null>(null);
  const saveInProgressRef = useRef(false);
  const [isSaving, setIsSaving] = useState(false);

  // Carregar dados em modo edição
  useEffect(() => {
    if (!isEdit || !popData) return;
    setTitulo(popData.titulo);
    setDescricao(popData.descricao);
    setDepartamento(popData.departamento);
    setResponsavel(popData.responsavel);
    setVisibilidade(popData.visibilidade);
    const etapas = popData.versao_ativa?.etapas ?? [];
    const loadedSteps = etapas.map((e) => ({
      uid: e.id,
      ordem: e.ordem,
      titulo: e.titulo,
      descricao: e.descricao,
      tempo: e.tempo_estimado,
      resultadoEsperado: e.resultado_esperado,
      erroComum: e.erro_comum,
      preRequisito: e.pre_requisito,
      checklist: checklistToString(e.checklist ?? []),
    }));
    setSteps(loadedSteps);
    // Abre informações adicionais já preenchidas para evitar que dados existentes fiquem escondidos.
    setAdditionalInfoOpenByStep(Object.fromEntries(loadedSteps.map((step) => [step.uid, hasAdditionalStepInfo(step)])));
    if (etapas.length > 0) setExpandedStepUid(etapas[0].id);
    const ms = popData.versao_ativa?.midias ?? [];
    const ordemPorEtapaId = new Map(etapas.map((e) => [e.id, e.ordem]));
    setMidias(ms.map((m) => {
      // Normaliza referências antigas que podem conter espaços/caracteres inválidos
      const safeRef = slugifyRef(m.referencia) || slugifyRef(m.nome) || `midia-${m.ordem}`;
      return {
        uid: m.id,
        tipo: m.tipo,
        nome: m.nome,
        referencia: safeRef,
        etapaOrdem: m.etapa_id ? ordemPorEtapaId.get(m.etapa_id) ?? null : null,
        ordem: m.ordem,
        url: m.url ?? null,
        refTouched: true, // referência veio do banco — não sobrescrever automaticamente
      };
    }));
  }, [isEdit, popData]);

  useEffect(() => {
    // Preenche somente novos POPs com o usuário logado; edição preserva o responsável salvo e o campo continua editável.
    if (isEdit || responsavelEditadoPeloUsuarioRef.current || responsavel.trim() || !nomeResponsavelUsuarioLogado) return;
    setResponsavel(nomeResponsavelUsuarioLogado);
  }, [isEdit, nomeResponsavelUsuarioLogado, responsavel]);

  const versaoNumero = popData?.versao_ativa?.numero ?? "v1.0";
  const versaoStatus = popData?.versao_ativa?.status ?? "rascunho";
  const tempoEstimado = useMemo(
    () => `${steps.reduce((acc, s) => acc + Number(s.tempo.replace(/\D/g, "") || 0), 0)} min`,
    [steps],
  );

  const updateStep = (uidStep: string, field: keyof Omit<StepItem, "uid" | "ordem">, value: string) =>
    setSteps((prev) => prev.map((s) => (s.uid === uidStep ? { ...s, [field]: value } : s)));

  const moveStep = (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= steps.length) return;
    const next = [...steps];
    [next[index], next[target]] = [next[target], next[index]];
    next.forEach((s, i) => (s.ordem = i + 1));
    setSteps(next);
  };

  const addStep = () => {
    const newUid = uid();
    setSteps([...steps, {
      uid: newUid, ordem: steps.length + 1,
      titulo: `Nova etapa ${steps.length + 1}`, descricao: "", tempo: "5 min",
      resultadoEsperado: "", erroComum: "", preRequisito: "", checklist: "",
    }]);
    setAdditionalInfoOpenByStep((prev) => ({ ...prev, [newUid]: false }));
    setExpandedStepUid(newUid);
    setAllStepsExpanded(false);
  };

  const addStepBelow = (index: number) => {
    const newUid = uid();
    const next = [...steps];
    next.splice(index + 1, 0, {
      uid: newUid, ordem: 0,
      titulo: `Nova etapa`, descricao: "", tempo: "5 min",
      resultadoEsperado: "", erroComum: "", preRequisito: "", checklist: "",
    });
    next.forEach((s, i) => (s.ordem = i + 1));
    setSteps(next);
    setAdditionalInfoOpenByStep((prev) => ({ ...prev, [newUid]: false }));
    setExpandedStepUid(newUid);
    setAllStepsExpanded(false);
  };

  const removeStep = (uidStep: string) => {
    const next = steps.filter((s) => s.uid !== uidStep);
    next.forEach((s, i) => (s.ordem = i + 1));
    setSteps(next);
    if (expandedStepUid === uidStep) setExpandedStepUid(null);
    setAdditionalInfoOpenByStep((prev) => {
      const nextOpen = { ...prev };
      delete nextOpen[uidStep];
      return nextOpen;
    });
  };

  const toggleStep = (uidStep: string) => {
    if (allStepsExpanded) {
      setAllStepsExpanded(false);
      setExpandedStepUid(uidStep);
      return;
    }
    setExpandedStepUid((cur) => (cur === uidStep ? null : uidStep));
  };

  const isStepComplete = (s: StepItem) =>
    s.titulo.trim().length > 0 && s.descricao.trim().length > 0 && s.resultadoEsperado.trim().length > 0;

  const checklistCount = (s: StepItem) =>
    s.checklist.split(";").map((t) => t.trim()).filter(Boolean).length;

  const stepsIncompletas = useMemo(() => steps.filter((s) => !isStepComplete(s)).length, [steps]);
  const previewStep = steps.find((step) => step.uid === previewStepUid) ?? null;

  const addMidia = () => {
    const newUid = uid();
    const n = midias.length + 1;
    setMidias([...midias, {
      uid: newUid,
      tipo: "imagem",
      nome: `Anexo ${n}`,
      referencia: `midia-${n}`,
      etapaOrdem: null,
      ordem: n,
      url: null,
      refTouched: false,
    }]);
    setExpandedMidiaUid(newUid);
  };

  const updateMidia = (
    uidM: string,
    field: keyof Omit<MidiaItem, "uid" | "ordem">,
    value: string | number | null,
  ) =>
    setMidias((prev) => prev.map((m) => {
      if (m.uid !== uidM) return m;
      // Edição manual da referência → sanitiza e marca como tocada
      if (field === "referencia") {
        return { ...m, referencia: slugifyRef(String(value ?? "")), refTouched: true };
      }
      // Auto-gera referência a partir do nome enquanto o usuário não a editou manualmente
      if (field === "nome") {
        const nextNome = String(value ?? "");
        const next: MidiaItem = { ...m, nome: nextNome };
        if (!m.refTouched) next.referencia = slugifyRef(nextNome) || m.referencia;
        return next;
      }
      return { ...m, [field]: value } as MidiaItem;
    }));

  const removeMidia = (uidM: string) => {
    const m = midias.find((x) => x.uid === uidM);
    if (m) {
      const refRegex = new RegExp(`@${m.referencia}(?![A-Za-zÀ-ÿ0-9_-])`);
      const usadaEm = steps.filter((s) => refRegex.test(s.descricao)).map((s) => `Etapa ${s.ordem}`);
      if (usadaEm.length > 0) {
        const ok = window.confirm(
          `A mídia @${m.referencia} ainda está referenciada em: ${usadaEm.join(", ")}.\n\nRemover mesmo assim? As referências no texto ficarão órfãs.`,
        );
        if (!ok) return;
      }
    }
    setMidias((prev) => prev.filter((x) => x.uid !== uidM));
  };

  // ===== Inserção inline de mídia (a partir da aba Etapas) =====
  const textareaRefs = useRef<Map<string, MediaMentionTextareaHandle | null>>(new Map());
  const [insertDialog, setInsertDialog] = useState<{ stepUid: string; file: File | null } | null>(null);

  /** Upload genérico (não vinculado a um MidiaItem prévio). Usado pelo diálogo "Inserir mídia". */
  const uploadFileToBucket = async (file: File): Promise<string> => {
    if (!user) throw new Error("Sessão expirada. Faça login novamente.");
    const { data: usuario, error: uerr } = await supabase
      .from("usuarios").select("empresa_id").eq("id", user.id).maybeSingle();
    if (uerr) throw uerr;
    if (!usuario) throw new Error("Empresa do usuário não encontrada");
    const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, "_");
    const path = `${usuario.empresa_id}/${id ?? "_new"}/${uid()}-${safeName}`;
    const { error: upErr } = await supabase.storage
      .from("pop-midias")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) throw upErr;
    const { data: pub } = supabase.storage.from("pop-midias").getPublicUrl(path);
    return pub.publicUrl;
  };

  const openInsertDialog = (stepUid: string, file: File | null = null) => {
    setInsertDialog({ stepUid, file });
  };

  const handleInsertMediaConfirm = (m: InsertedMedia) => {
    if (!insertDialog) return;
    const step = steps.find((s) => s.uid === insertDialog.stepUid);
    if (!step) return;
    const newUid = uid();
    const ordemNova = midias.length + 1;
    setMidias((prev) => [
      ...prev,
      {
        uid: newUid,
        tipo: m.tipo,
        nome: m.nome,
        referencia: m.referencia,
        etapaOrdem: step.ordem,
        ordem: ordemNova,
        url: m.url,
        refTouched: true,
      },
    ]);
    // Insere @ref na posição atual do cursor do textarea da etapa
    requestAnimationFrame(() => {
      textareaRefs.current.get(insertDialog.stepUid)?.insertReferenceAtCursor(m.referencia);
    });
  };

  /** Mídias usadas em uma etapa (referenciadas no texto OU vinculadas pela ordem). */
  const midiasDaEtapa = (step: StepItem) => {
    const usadas = new Set<string>();
    for (const m of step.descricao.matchAll(MEDIA_REF_REGEX)) usadas.add(m[1]);
    return midias.filter((m) => usadas.has(m.referencia) || m.etapaOrdem === step.ordem);
  };

  const previewStepMidias = previewStep ? midiasDaEtapa(previewStep) : [];

  const removeRefFromStep = (step: StepItem, ref: string) => {
    const re = new RegExp(`\\s?@${ref}(?![A-Za-zÀ-ÿ0-9_-])`, "g");
    updateStep(step.uid, "descricao", step.descricao.replace(re, ""));
  };


  const buildPayload = (): CreatePopInput => ({
    titulo, descricao, departamento, responsavel, visibilidade,
    // Reordena pelo array atual para impedir payload com ordens duplicadas mesmo se o estado local ficar inconsistente.
    etapas: normalizeEtapasInputOrder(steps.map((s) => ({
      ordem: s.ordem,
      titulo: s.titulo,
      descricao: s.descricao,
      tempo_estimado: s.tempo,
      pre_requisito: s.preRequisito,
      resultado_esperado: s.resultadoEsperado,
      erro_comum: s.erroComum,
      checklist: checklistFromString(s.checklist),
    }))),
    midias: midias.map((m) => ({
      etapa_ordem: m.etapaOrdem,
      referencia: m.referencia,
      nome: m.nome,
      tipo: m.tipo,
      ordem: m.ordem,
      url: m.url,
    })),
  });

  /**
   * Upload de arquivo para o bucket `pop-midias`.
   * Path: {empresa_id}/{pop_id ou _new}/{uid}-{nome}
   * Bucket é PÚBLICO no MVP. Migrar para signed URLs no futuro (POPs podem conter dados sensíveis).
   */
  const uploadMidiaFile = async (uidM: string, file: File) => {
    if (!user) {
      toast.error("Sessão expirada. Faça login novamente.");
      return;
    }
    setMidias((prev) => prev.map((m) => (m.uid === uidM ? { ...m, uploading: true } : m)));
    try {
      const { data: usuario, error: uerr } = await supabase
        .from("usuarios").select("empresa_id").eq("id", user.id).maybeSingle();
      if (uerr) throw uerr;
      if (!usuario) throw new Error("Empresa do usuário não encontrada");

      const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, "_");
      const path = `${usuario.empresa_id}/${id ?? "_new"}/${uidM}-${safeName}`;
      const { error: upErr } = await supabase.storage
        .from("pop-midias")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from("pop-midias").getPublicUrl(path);
      setMidias((prev) => prev.map((m) =>
        m.uid === uidM
          ? { ...m, url: pub.publicUrl, nome: m.nome || file.name, uploading: false }
          : m,
      ));
      toast.success("Arquivo enviado");
    } catch (err) {
      // Falha: NÃO marca como válida — mantém url anterior (ou null) e remove flag
      setMidias((prev) => prev.map((m) => (m.uid === uidM ? { ...m, uploading: false } : m)));
      toast.error(`Falha no upload: ${(err as Error).message}`);
    }
  };

  const handleSave = async () => {
    if (saveInProgressRef.current) return;
    if (!titulo.trim()) {
      toast.error("Informe o título");
      return;
    }

    // Bloqueio síncrono evita duplo clique antes do React atualizar o disabled do botão.
    saveInProgressRef.current = true;
    setIsSaving(true);

    try {
      if (isEdit && id) {
        await updatePop.mutateAsync({ popId: id, input: buildPayload() });
        toast.success("POP atualizado");
        navigate(`/pops/${id}`);
      } else {
        const newId = await createPop.mutateAsync(buildPayload());
        toast.success("POP criado");
        navigate(`/pops/${newId}`);
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      saveInProgressRef.current = false;
      setIsSaving(false);
    }
  };

  const handleDiscard = () => navigate("/pops");

  if (isEdit && isLoading) {
    return <AppLayout title="Editando POP"><p className="p-6 text-sm text-muted-foreground">Carregando...</p></AppLayout>;
  }

  return (
    <AppLayout title={isEdit ? "Editar POP" : "Criar Novo POP"}>
      <div className="mx-auto w-full max-w-7xl space-y-5">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{isEdit ? "Editar POP" : "Criar Novo POP"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Configure as informações, etapas, mídias e revisão.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDiscard}>Descartar</Button>
            <Button onClick={handleSave} disabled={isSaving || createPop.isPending || updatePop.isPending}>Salvar</Button>
          </div>
        </header>

        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
          <Badge variant="outline" className="bg-background text-foreground">{versaoNumero}</Badge>
          <span className="capitalize">{versaoStatus}</span>
          <span className="text-border">·</span>
          <span>{steps.length} {steps.length === 1 ? "etapa" : "etapas"}</span>
          <span className="text-border">·</span>
          <span>{tempoEstimado}</span>
          <span className="text-border">·</span>
          <span>{midias.length} {midias.length === 1 ? "mídia" : "mídias"}</span>
          <span className="text-border">·</span>
          <span className={stepsIncompletas > 0 ? "font-medium text-amber-700" : "font-medium text-emerald-700"}>
            {stepsIncompletas} {stepsIncompletas === 1 ? "pendência" : "pendências"}
          </span>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
          <div className="overflow-x-auto pb-1">
            {/* Ajuste visual: container com tokens do tema para separar as abas sem pesar no modo claro/escuro. */}
            <TabsList className="h-auto min-w-max justify-start gap-1.5 rounded-xl border bg-muted/50 p-1.5 shadow-inner shadow-background/30">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                // Ajuste visual: aba ativa ganha aparência de item selecionado com borda, fundo, sombra e ícone em destaque.
                return (
                  <TabsTrigger
                    key={tab.key}
                    value={tab.key}
                    className="gap-2 rounded-lg border border-transparent px-3.5 py-2 text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground data-[state=active]:border-border data-[state=active]:bg-background data-[state=active]:font-semibold data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:shadow-foreground/10 data-[state=active]:[&>svg]:text-primary"
                  >
                    <Icon className="h-4 w-4 transition-colors" />
                    {tab.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>
        </Tabs>

        <div className="mx-auto w-full max-w-6xl space-y-4">
            {activeTab === "informacoes" && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Dados principais do POP</CardTitle>
                  <CardDescription>Defina as informações básicas antes de estruturar as etapas.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-5 p-6 pt-0 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    {/* Ajuste visual: labels com ícones pequenos melhoram escaneabilidade sem alterar campos ou validações. */}
                    <Label className="flex items-center gap-2 font-semibold text-foreground"><FileText className="h-4 w-4 text-muted-foreground" />Título do POP</Label>
                    <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="flex items-center gap-2 font-semibold text-foreground"><ListChecks className="h-4 w-4 text-muted-foreground" />Descrição detalhada</Label>
                    <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={4} />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 font-semibold text-foreground"><Building2 className="h-4 w-4 text-muted-foreground" />Departamento</Label>
                    <Input value={departamento} onChange={(e) => setDepartamento(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 font-semibold text-foreground"><User className="h-4 w-4 text-muted-foreground" />Responsável</Label>
                    <Input
                      value={responsavel}
                      onChange={(e) => {
                        responsavelEditadoPeloUsuarioRef.current = true;
                        setResponsavel(e.target.value);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 font-semibold text-foreground"><Eye className="h-4 w-4 text-muted-foreground" />Visibilidade</Label>
                    <Select value={visibilidade} onValueChange={(v) => setVisibilidade(v as PopVisibilidade)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="privado">Privado</SelectItem><SelectItem value="empresa">Empresa</SelectItem></SelectContent></Select>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "etapas" && (
              <Card>
                <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
                  <CardTitle>Etapas</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setAllStepsExpanded(true); setExpandedStepUid(null); }}
                    >
                      Expandir todas
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setAllStepsExpanded(false); setExpandedStepUid(null); }}
                    >
                      Recolher todas
                    </Button>
                    <Button onClick={addStep} size="sm" className="gap-1">
                      <Plus className="h-4 w-4" /> Adicionar etapa
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {steps.map((step, index) => {
                    const isOpen = allStepsExpanded || expandedStepUid === step.uid;
                    const linked = midiasDaEtapa(step);
                    const cl = checklistCount(step);
                    const complete = isStepComplete(step);
                    return (
                      <Card key={step.uid} className="overflow-hidden">
                        {/* Header (sempre visível, clicável) */}
                        <button
                          type="button"
                          onClick={() => toggleStep(step.uid)}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/40"
                        >
                          {isOpen ? (
                            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold">Etapa {step.ordem}</span>
                              <span className="truncate text-sm text-foreground">— {step.titulo || "(sem título)"}</span>
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                              <span>{step.tempo || "—"}</span>
                              <span>·</span>
                              <span>{linked.length} {linked.length === 1 ? "mídia" : "mídias"}</span>
                              {cl > 0 && (<><span>·</span><span>{cl} {cl === 1 ? "item de checklist" : "itens de checklist"}</span></>)}
                            </div>
                          </div>
                          <span
                            className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${
                              complete
                                ? "border border-emerald-300 bg-emerald-50 text-emerald-800"
                                : "border border-amber-300 bg-amber-50 text-amber-800"
                            }`}
                          >
                            {complete ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                            {complete ? "Completa" : "Incompleta"}
                          </span>
                        </button>

                        {/* Corpo expandido */}
                        {isOpen && (
                          <div className="border-t">
                            <div className="grid gap-4 p-5 md:grid-cols-2">
                              <div className="space-y-1"><Label>Título da etapa</Label><Input value={step.titulo} onChange={(e) => updateStep(step.uid, "titulo", e.target.value)} /></div>
                              <div className="space-y-1"><Label>Tempo estimado</Label><Input value={step.tempo} onChange={(e) => updateStep(step.uid, "tempo", e.target.value)} /></div>
                              <div className="space-y-2 md:col-span-2">
                                <Label>Descrição (digite @ para inserir uma mídia cadastrada)</Label>
                                <MediaMentionTextarea
                                  ref={(el) => {
                                    if (el) textareaRefs.current.set(step.uid, el);
                                    else textareaRefs.current.delete(step.uid);
                                  }}
                                  value={step.descricao}
                                  onChange={(v) => updateStep(step.uid, "descricao", v)}
                                  midias={midias.map((m) => ({ referencia: m.referencia, nome: m.nome, tipo: m.tipo }))}
                                  // Altura maior porque descrições de POP costumam conter instruções longas.
                                  rows={10}
                                  textareaClassName="min-h-[260px]"
                                  onRequestInsertMedia={(file) => openInsertDialog(step.uid, file)}
                                  onOpenInsertMedia={() => openInsertDialog(step.uid)}
                                  onPreview={() => setPreviewStepUid(step.uid)}
                                />
                                {linked.length > 0 && (
                                  <div className="rounded-md border bg-muted/20 p-2">
                                    <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                      Mídias vinculadas nesta etapa
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {linked.map((m) => {
                                        const Icon = tipoIcon[m.tipo];
                                        const inText = new RegExp(`@${m.referencia}(?![A-Za-zÀ-ÿ0-9_-])`).test(step.descricao);
                                        return (
                                          <span
                                            key={m.uid}
                                            className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs text-primary"
                                          >
                                            <Icon className="h-3 w-3" />
                                            @{m.referencia}
                                            <span className="text-[10px] text-primary/70">— {tipoLabel[m.tipo]}</span>
                                            {inText && (
                                              <button
                                                type="button"
                                                onClick={() => removeRefFromStep(step, m.referencia)}
                                                aria-label={`Remover referência @${m.referencia} do texto`}
                                                className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20"
                                              >
                                                <X className="h-3 w-3" />
                                              </button>
                                            )}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                              {(() => {
                                const additionalInfoOpen = additionalInfoOpenByStep[step.uid] ?? hasAdditionalStepInfo(step);
                                return (
                                  <Collapsible
                                    open={additionalInfoOpen}
                                    onOpenChange={(open) => setAdditionalInfoOpenByStep((prev) => ({ ...prev, [step.uid]: open }))}
                                    className="md:col-span-2 rounded-lg border bg-muted/10"
                                  >
                                    {/* Mantém campos menos usados recolhidos para reduzir ruído visual na edição de etapas. */}
                                    <CollapsibleTrigger asChild>
                                      <button type="button" className="flex w-full items-center gap-3 p-3 text-left hover:bg-muted/40">
                                        {additionalInfoOpen ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
                                        <Info className="h-4 w-4 shrink-0 text-muted-foreground" />
                                        <div className="min-w-0 flex-1">
                                          <p className="text-sm font-medium text-foreground">Informações adicionais da etapa</p>
                                          <p className="text-xs text-muted-foreground">Resultado esperado, erros comuns, pré-requisitos e checklist</p>
                                        </div>
                                        {hasAdditionalStepInfo(step) && (
                                          <Badge variant="secondary" className="shrink-0 text-[10px]">Com conteúdo</Badge>
                                        )}
                                      </button>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                      <div className="grid gap-4 border-t p-4 md:grid-cols-2">
                                        <div className="space-y-1"><Label>Resultado esperado</Label><Input value={step.resultadoEsperado} onChange={(e) => updateStep(step.uid, "resultadoEsperado", e.target.value)} /></div>
                                        <div className="space-y-1"><Label>Erro comum</Label><Input value={step.erroComum} onChange={(e) => updateStep(step.uid, "erroComum", e.target.value)} /></div>
                                        <div className="space-y-1"><Label>Pré-requisito</Label><Input value={step.preRequisito} onChange={(e) => updateStep(step.uid, "preRequisito", e.target.value)} /></div>
                                        <div className="space-y-1"><Label>Checklist (separe por ;)</Label><Input value={step.checklist} onChange={(e) => updateStep(step.uid, "checklist", e.target.value)} /></div>
                                      </div>
                                    </CollapsibleContent>
                                  </Collapsible>
                                );
                              })()}
                              <div className="md:col-span-2 flex flex-wrap items-center gap-2 border-t pt-3">
                                <Button variant="outline" size="sm" onClick={() => moveStep(index, "up")} disabled={index === 0} className="gap-1">
                                  <ArrowUp className="h-3.5 w-3.5" /> Mover para cima
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => moveStep(index, "down")} disabled={index === steps.length - 1} className="gap-1">
                                  <ArrowDown className="h-3.5 w-3.5" /> Mover para baixo
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => addStepBelow(index)} className="gap-1">
                                  <Plus className="h-3.5 w-3.5" /> Adicionar etapa abaixo
                                </Button>
                                <div className="ml-auto">
                                  <Button variant="ghost" size="sm" onClick={() => removeStep(step.uid)} className="gap-1 text-destructive hover:text-destructive">
                                    <Trash2 className="h-3.5 w-3.5" /> Remover
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {activeTab === "midias" && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Mídias</CardTitle><Button onClick={addMidia}>Adicionar mídia</Button></CardHeader>
                <CardContent className="space-y-2">
                  {midias.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma mídia ainda.</p>}
                  <ul className="divide-y rounded-md border">
                    {midias.map((m) => {
                      const Icon = tipoIcon[m.tipo];
                      const expanded = expandedMidiaUid === m.uid;
                      const etapa = steps.find((s) => s.ordem === m.etapaOrdem);
                      return (
                        <li key={m.uid} className="bg-card">
                          {/* Linha compacta */}
                          <div className="flex items-center gap-3 px-3 py-2">
                            <button
                              type="button"
                              onClick={() => setExpandedMidiaUid(expanded ? null : m.uid)}
                              className="text-muted-foreground hover:text-foreground"
                              aria-label={expanded ? "Recolher" : "Expandir"}
                            >
                              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </button>
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded border bg-muted">
                              {m.tipo === "imagem" && m.url ? (
                                <img src={m.url} alt={m.nome} className="h-full w-full object-cover" />
                              ) : (
                                <Icon className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium">{m.nome || "(sem nome)"}</div>
                              <div className="truncate text-xs text-muted-foreground">@{m.referencia || "—"}</div>
                            </div>
                            <Badge variant="outline" className="hidden text-[10px] sm:inline-flex">{tipoLabel[m.tipo]}</Badge>
                            <Badge variant="secondary" className="hidden text-[10px] md:inline-flex">
                              {etapa ? `Etapa ${etapa.ordem}` : "Sem vínculo"}
                            </Badge>
                            {m.uploading && <span className="text-xs text-muted-foreground">Enviando…</span>}
                            {!m.url && !m.uploading && (
                              <span className="hidden text-[10px] text-amber-700 lg:inline">sem arquivo</span>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => setExpandedMidiaUid(expanded ? null : m.uid)}>
                              {expanded ? "Concluir" : "Editar"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeMidia(m.uid)}
                              aria-label="Remover mídia"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Modo edição */}
                          {expanded && (
                            <div className="grid gap-3 border-t bg-muted/20 p-4 md:grid-cols-2">
                              <div className="space-y-1"><Label>Nome</Label><Input value={m.nome} onChange={(e) => updateMidia(m.uid, "nome", e.target.value)} /></div>
                              <div className="space-y-1">
                                <Label>Referência (sem espaços)</Label>
                                <Input
                                  value={m.referencia}
                                  placeholder="ex: acesso-a-tela"
                                  onChange={(e) => updateMidia(m.uid, "referencia", e.target.value)}
                                />
                                <p className="text-[11px] text-muted-foreground">Use no texto como <code>@{m.referencia || "referencia"}</code></p>
                              </div>
                              <div className="space-y-1">
                                <Label>Tipo</Label>
                                <Select value={m.tipo} onValueChange={(v) => updateMidia(m.uid, "tipo", v as PopMidiaTipo)}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="imagem">Imagem</SelectItem>
                                    <SelectItem value="audio">Áudio</SelectItem>
                                    <SelectItem value="video">Vídeo</SelectItem>
                                    <SelectItem value="documento">Documento</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1">
                                <Label>Etapa vinculada</Label>
                                <Select
                                  value={m.etapaOrdem != null ? String(m.etapaOrdem) : "none"}
                                  onValueChange={(v) => updateMidia(m.uid, "etapaOrdem", v === "none" ? null : Number(v))}
                                >
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">Sem vínculo</SelectItem>
                                    {steps.map((s) => <SelectItem key={s.uid} value={String(s.ordem)}>Etapa {s.ordem} — {s.titulo}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1 md:col-span-2">
                                <Label>Arquivo</Label>
                                {m.url ? (
                                  <div className="flex flex-wrap items-center gap-2 rounded-md border bg-background p-2 text-xs">
                                    {m.tipo === "imagem" && (
                                      <img src={m.url} alt={m.nome} className="h-12 w-12 rounded object-cover" />
                                    )}
                                    <a href={m.url} target="_blank" rel="noreferrer" className="font-medium text-primary underline">
                                      {m.nome || "Abrir arquivo"}
                                    </a>
                                    <label className="ml-auto cursor-pointer text-xs text-muted-foreground underline">
                                      Substituir
                                      <input
                                        type="file"
                                        className="hidden"
                                        accept={acceptByTipo[m.tipo]}
                                        onChange={(e) => e.target.files?.[0] && uploadMidiaFile(m.uid, e.target.files[0])}
                                      />
                                    </label>
                                  </div>
                                ) : (
                                  <Input
                                    type="file"
                                    accept={acceptByTipo[m.tipo]}
                                    disabled={m.uploading}
                                    onChange={(e) => e.target.files?.[0] && uploadMidiaFile(m.uid, e.target.files[0])}
                                  />
                                )}
                                {m.tipo === "imagem" && (
                                  <div
                                    tabIndex={0}
                                    onPaste={(e) => {
                                      const items = e.clipboardData?.items;
                                      if (!items) return;
                                      for (const it of items) {
                                        if (it.kind === "file" && it.type.startsWith("image/")) {
                                          const file = it.getAsFile();
                                          if (file) {
                                            e.preventDefault();
                                            const ext = file.type.split("/")[1] || "png";
                                            const named = file.name && file.name !== "image.png"
                                              ? file
                                              : new File([file], `print-${Date.now()}.${ext}`, { type: file.type });
                                            uploadMidiaFile(m.uid, named);
                                            return;
                                          }
                                        }
                                      }
                                      toast.message("Nenhuma imagem no clipboard. Tire um print e tente Ctrl+V novamente.");
                                    }}
                                    className="mt-2 cursor-text rounded-md border border-dashed bg-muted/20 p-3 text-center text-xs text-muted-foreground outline-none transition-colors focus:border-primary focus:bg-primary/5"
                                  >
                                    Clique aqui e pressione <kbd className="rounded border bg-background px-1">Ctrl</kbd>+<kbd className="rounded border bg-background px-1">V</kbd> para colar uma imagem do clipboard
                                  </div>
                                )}
                                {m.uploading && <p className="text-xs text-muted-foreground">Enviando…</p>}
                                {!m.url && !m.uploading && (
                                  <p className="text-xs text-muted-foreground">Sem arquivo enviado. A referência inline aparecerá, mas sem visualização.</p>
                                )}
                              </div>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>
            )}

            {activeTab === "revisao" && (() => {
              // Mesma regex usada no PopDetail (cobre @Sintegra, @midia1, etc.)
              const refRegex = /@([A-Za-zÀ-ÿ0-9_-]+)/g;
              const refsNoTexto = new Set<string>();
              steps.forEach((s) => {
                for (const m of s.descricao.matchAll(refRegex)) refsNoTexto.add(m[1]);
              });
              const refsCadastradas = new Set(midias.map((m) => m.referencia));
              const refsSemMidia = [...refsNoTexto].filter((r) => !refsCadastradas.has(r));
              const midiasNaoUsadas = midias.filter((m) => !refsNoTexto.has(m.referencia));
              const semUpload = midias.filter((m) => !m.url);

              return (
                <Card>
                  <CardHeader><CardTitle>Revisão Final</CardTitle></CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p><strong>Título:</strong> {titulo}</p>
                    <p><strong>Departamento:</strong> {departamento}</p>
                    <p><strong>Responsável:</strong> {responsavel}</p>
                    <p><strong>Visibilidade:</strong> {visibilidade === "privado" ? "Privado" : "Empresa"}</p>
                    <p><strong>Etapas:</strong> {steps.length}</p>
                    <p><strong>Mídias:</strong> {midias.length}</p>

                    {refsSemMidia.length === 0 && midiasNaoUsadas.length === 0 && semUpload.length === 0 ? (
                      <p className="rounded-md border border-emerald-300 bg-emerald-50/50 p-2 text-emerald-800">
                        Tudo certo: todas as referências têm mídia e todas as mídias estão referenciadas e enviadas.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {refsSemMidia.length > 0 && (
                          <div className="rounded-md border border-amber-300 bg-amber-50/50 p-2 text-amber-900">
                            <p className="font-medium">Referências sem mídia ({refsSemMidia.length})</p>
                            <p className="text-xs">Estas referências aparecem no texto mas não têm mídia cadastrada:</p>
                            <p className="mt-1 text-xs">{refsSemMidia.map((r) => `@${r}`).join(", ")}</p>
                          </div>
                        )}
                        {midiasNaoUsadas.length > 0 && (
                          <div className="rounded-md border border-amber-300 bg-amber-50/50 p-2 text-amber-900">
                            <p className="font-medium">Mídias não referenciadas ({midiasNaoUsadas.length})</p>
                            <p className="text-xs">Estas mídias foram cadastradas mas não aparecem em nenhuma etapa:</p>
                            <p className="mt-1 text-xs">{midiasNaoUsadas.map((m) => `@${m.referencia}`).join(", ")}</p>
                          </div>
                        )}
                        {semUpload.length > 0 && (
                          <div className="rounded-md border border-amber-300 bg-amber-50/50 p-2 text-amber-900">
                            <p className="font-medium">Mídias sem arquivo ({semUpload.length})</p>
                            <p className="text-xs">Estas mídias não têm arquivo enviado — a referência inline aparecerá sem visualização:</p>
                            <p className="mt-1 text-xs">{semUpload.map((m) => `@${m.referencia}`).join(", ")}</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button onClick={handleSave} disabled={isSaving || createPop.isPending || updatePop.isPending}>
                        {isEdit ? "Salvar alterações" : "Criar POP"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}
          <Card className="bg-muted/20">
            <CardContent className="grid gap-4 p-4 text-sm text-muted-foreground md:grid-cols-[1.5fr_1fr]">
              <div>
                <p className="font-medium text-foreground">Ajuda rápida</p>
                <p className="mt-1">Descreva resultados esperados e erros comuns em cada etapa para reduzir retrabalho.</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                <span className="inline-flex items-center gap-1"><Image className="h-3 w-3" />Imagem</span>
                <span className="inline-flex items-center gap-1"><Mic className="h-3 w-3" />Áudio</span>
                <span className="inline-flex items-center gap-1"><Video className="h-3 w-3" />Vídeo</span>
                <span className="inline-flex items-center gap-1"><FileText className="h-3 w-3" />Documento</span>
                <span className="inline-flex items-center gap-1"><Building2 className="h-3 w-3" />Empresa</span>
                <span className="inline-flex items-center gap-1"><Shield className="h-3 w-3" />Privado</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={!!previewStep} onOpenChange={(open) => { if (!open) setPreviewStepUid(null); }}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pré-visualização da etapa</DialogTitle>
            <DialogDescription>
              {previewStep?.titulo || "Etapa sem título"}
            </DialogDescription>
          </DialogHeader>
          {/* Preview somente leitura: renderiza o Markdown sem alterar o texto salvo da descrição. */}
          <div className="rounded-lg border bg-muted/10 p-4">
            {previewStep?.descricao.trim() ? (
              <div className="space-y-4 text-sm text-foreground">
                {renderMarkdownPreview(previewStep.descricao, previewStepMidias, (m) => setPreviewMidia(m))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma descrição preenchida para pré-visualizar.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <MediaViewer
        open={!!previewMidia}
        onOpenChange={(open) => { if (!open) setPreviewMidia(null); }}
        tipo={previewMidia?.tipo ?? null}
        url={previewMidia?.url ?? null}
        nome={previewMidia?.nome ?? "Mídia"}
      />

      <InsertMediaDialog
        open={!!insertDialog}
        onOpenChange={(v) => { if (!v) setInsertDialog(null); }}
        initialFile={insertDialog?.file ?? null}
        existingRefs={midias.map((m) => m.referencia)}
        uploadFile={uploadFileToBucket}
        onConfirm={handleInsertMediaConfirm}
        slugify={slugifyRef}
      />
    </AppLayout>
  );
};

export default PopCreateEdit;

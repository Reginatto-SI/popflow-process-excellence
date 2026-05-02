import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Building2, FileText, Image, Mic, Shield, User, Video } from "lucide-react";

import { AppLayout } from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  usePop,
  useCreatePop,
  useUpdatePop,
  type ChecklistItem,
  type CreatePopInput,
  type PopMidiaTipo,
  type PopVisibilidade,
} from "@/hooks/usePops";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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
}

const tabs: { key: TabKey; label: string }[] = [
  { key: "informacoes", label: "Informações Gerais" },
  { key: "etapas", label: "Etapas" },
  { key: "midias", label: "Mídias" },
  { key: "revisao", label: "Revisão Final" },
];

const tipoLabel: Record<PopMidiaTipo, string> = {
  imagem: "Imagem",
  audio: "Áudio",
  video: "Vídeo",
  documento: "Documento/PDF",
};

const uid = () => Math.random().toString(36).slice(2, 10);

const checklistFromString = (s: string): ChecklistItem[] =>
  s.split(";").map((t) => t.trim()).filter(Boolean).map((texto) => ({ id: crypto.randomUUID(), texto }));

const checklistToString = (items: ChecklistItem[]): string => items.map((i) => i.texto).join("; ");

const PopCreateEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const { data: popData, isLoading } = usePop(id);
  const createPop = useCreatePop();
  const updatePop = useUpdatePop();

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

  // Carregar dados em modo edição
  useEffect(() => {
    if (!isEdit || !popData) return;
    setTitulo(popData.titulo);
    setDescricao(popData.descricao);
    setDepartamento(popData.departamento);
    setResponsavel(popData.responsavel);
    setVisibilidade(popData.visibilidade);
    const etapas = popData.versao_ativa?.etapas ?? [];
    setSteps(etapas.map((e) => ({
      uid: e.id,
      ordem: e.ordem,
      titulo: e.titulo,
      descricao: e.descricao,
      tempo: e.tempo_estimado,
      resultadoEsperado: e.resultado_esperado,
      erroComum: e.erro_comum,
      preRequisito: e.pre_requisito,
      checklist: checklistToString(e.checklist ?? []),
    })));
    const ms = popData.versao_ativa?.midias ?? [];
    const ordemPorEtapaId = new Map(etapas.map((e) => [e.id, e.ordem]));
    setMidias(ms.map((m) => ({
      uid: m.id,
      tipo: m.tipo,
      nome: m.nome,
      referencia: m.referencia,
      etapaOrdem: m.etapa_id ? ordemPorEtapaId.get(m.etapa_id) ?? null : null,
      ordem: m.ordem,
    })));
  }, [isEdit, popData]);

  const currentTabIndex = tabs.findIndex((t) => t.key === activeTab);
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

  const addStep = () =>
    setSteps([...steps, {
      uid: uid(), ordem: steps.length + 1,
      titulo: `Nova etapa ${steps.length + 1}`, descricao: "", tempo: "5 min",
      resultadoEsperado: "", erroComum: "", preRequisito: "", checklist: "",
    }]);

  const removeStep = (uidStep: string) => {
    const next = steps.filter((s) => s.uid !== uidStep);
    next.forEach((s, i) => (s.ordem = i + 1));
    setSteps(next);
  };

  const addMidia = () =>
    setMidias([...midias, {
      uid: uid(),
      tipo: "documento",
      nome: `Anexo ${midias.length + 1}`,
      referencia: `midia${midias.length + 1}`,
      etapaOrdem: null,
      ordem: midias.length + 1,
    }]);

  const updateMidia = (uidM: string, field: keyof Omit<MidiaItem, "uid" | "ordem">, value: string | number | null) =>
    setMidias((prev) => prev.map((m) => (m.uid === uidM ? { ...m, [field]: value } as MidiaItem : m)));

  const removeMidia = (uidM: string) => setMidias((prev) => prev.filter((m) => m.uid !== uidM));

  const buildPayload = (): CreatePopInput => ({
    titulo, descricao, departamento, responsavel, visibilidade,
    etapas: steps.map((s) => ({
      ordem: s.ordem,
      titulo: s.titulo,
      descricao: s.descricao,
      tempo_estimado: s.tempo,
      pre_requisito: s.preRequisito,
      resultado_esperado: s.resultadoEsperado,
      erro_comum: s.erroComum,
      checklist: checklistFromString(s.checklist),
    })),
    midias: midias.map((m) => ({
      etapa_ordem: m.etapaOrdem,
      referencia: m.referencia,
      nome: m.nome,
      tipo: m.tipo,
      ordem: m.ordem,
    })),
  });

  const handleSave = async () => {
    if (!titulo.trim()) {
      toast.error("Informe o título");
      return;
    }
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
    }
  };

  const handleDiscard = () => navigate("/pops");

  if (isEdit && isLoading) {
    return <AppLayout title="Editando POP"><p className="p-6 text-sm text-muted-foreground">Carregando...</p></AppLayout>;
  }

  return (
    <AppLayout title={isEdit ? "Editar POP" : "Criar Novo POP"}>
      <div className="mx-auto w-full max-w-7xl space-y-5 pb-24">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{isEdit ? "Editar POP" : "Criar Novo POP"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Configure as informações, etapas, mídias e revisão.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDiscard}>Descartar</Button>
            <Button onClick={handleSave} disabled={createPop.isPending || updatePop.isPending}>Salvar</Button>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
          <TabsList className="h-auto w-full justify-start rounded-none border-b bg-transparent p-0">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.key} value={tab.key} className="rounded-none border-b-2 border-transparent px-2 py-2 text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground">{tab.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            {activeTab === "informacoes" && (
              <Card><CardContent className="grid gap-4 p-5 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2"><Label>Título do POP</Label><Input value={titulo} onChange={(e) => setTitulo(e.target.value)} /></div>
                <div className="space-y-2 md:col-span-2"><Label>Descrição detalhada</Label><Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={4} /></div>
                <div className="space-y-2"><Label>Departamento</Label><Input value={departamento} onChange={(e) => setDepartamento(e.target.value)} /></div>
                <div className="space-y-2"><Label>Responsável</Label><div className="relative"><User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={responsavel} onChange={(e) => setResponsavel(e.target.value)} /></div></div>
                <div className="space-y-2"><Label>Visibilidade</Label><Select value={visibilidade} onValueChange={(v) => setVisibilidade(v as PopVisibilidade)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="privado">Privado</SelectItem><SelectItem value="empresa">Empresa</SelectItem></SelectContent></Select></div>
              </CardContent></Card>
            )}

            {activeTab === "etapas" && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Etapas</CardTitle><Button onClick={addStep}>Adicionar etapa</Button></CardHeader>
                <CardContent className="space-y-3">
                  {steps.map((step, index) => (
                    <Card key={step.uid}>
                      <CardContent className="grid gap-3 p-4 md:grid-cols-2">
                        <div className="space-y-1"><Label>Título da etapa</Label><Input value={step.titulo} onChange={(e) => updateStep(step.uid, "titulo", e.target.value)} /></div>
                        <div className="space-y-1"><Label>Tempo estimado</Label><Input value={step.tempo} onChange={(e) => updateStep(step.uid, "tempo", e.target.value)} /></div>
                        <div className="space-y-1 md:col-span-2"><Label>Descrição (use @midia1, @imagem1, @audio1, @video1, @documento1)</Label><Textarea value={step.descricao} onChange={(e) => updateStep(step.uid, "descricao", e.target.value)} rows={2} /></div>
                        <div className="space-y-1"><Label>Resultado esperado</Label><Input value={step.resultadoEsperado} onChange={(e) => updateStep(step.uid, "resultadoEsperado", e.target.value)} /></div>
                        <div className="space-y-1"><Label>Erro comum</Label><Input value={step.erroComum} onChange={(e) => updateStep(step.uid, "erroComum", e.target.value)} /></div>
                        <div className="space-y-1"><Label>Pré-requisito</Label><Input value={step.preRequisito} onChange={(e) => updateStep(step.uid, "preRequisito", e.target.value)} /></div>
                        <div className="space-y-1"><Label>Checklist (separe por ;)</Label><Input value={step.checklist} onChange={(e) => updateStep(step.uid, "checklist", e.target.value)} /></div>
                        <div className="md:col-span-2 flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" onClick={() => moveStep(index, "up")}>Mover para cima</Button>
                          <Button variant="outline" size="sm" onClick={() => moveStep(index, "down")}>Mover para baixo</Button>
                          <Button variant="destructive" size="sm" onClick={() => removeStep(step.uid)}>Remover</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            )}

            {activeTab === "midias" && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Mídias</CardTitle><Button onClick={addMidia}>Adicionar mídia</Button></CardHeader>
                <CardContent className="space-y-3">
                  {midias.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma mídia ainda.</p>}
                  {midias.map((m) => (
                    <Card key={m.uid}>
                      <CardContent className="grid gap-3 p-4 md:grid-cols-2">
                        <div className="space-y-1"><Label>Nome</Label><Input value={m.nome} onChange={(e) => updateMidia(m.uid, "nome", e.target.value)} /></div>
                        <div className="space-y-1"><Label>Referência (ex: midia1)</Label><Input value={m.referencia} onChange={(e) => updateMidia(m.uid, "referencia", e.target.value)} /></div>
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
                        <div className="md:col-span-2"><Button variant="destructive" size="sm" onClick={() => removeMidia(m.uid)}>Remover</Button></div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            )}

            {activeTab === "revisao" && (
              <Card>
                <CardHeader><CardTitle>Revisão Final</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><strong>Título:</strong> {titulo}</p>
                  <p><strong>Departamento:</strong> {departamento}</p>
                  <p><strong>Responsável:</strong> {responsavel}</p>
                  <p><strong>Visibilidade:</strong> {visibilidade === "privado" ? "Privado" : "Empresa"}</p>
                  <p><strong>Etapas:</strong> {steps.length}</p>
                  <p><strong>Mídias:</strong> {midias.length}</p>
                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleSave} disabled={createPop.isPending || updatePop.isPending}>
                      {isEdit ? "Salvar alterações" : "Criar POP"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <aside className="space-y-3">
            <Card><CardHeader><CardTitle>Resumo do POP</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
              <p><strong>Versão:</strong> {popData?.versao_ativa?.numero ?? "v1.0"} ({popData?.versao_ativa?.status ?? "rascunho"})</p>
              <p><strong>Tempo estimado:</strong> {tempoEstimado}</p>
              <p><strong>Etapas:</strong> {steps.length}</p>
              <p><strong>Mídias:</strong> {midias.length}</p>
            </CardContent></Card>
            <Card><CardHeader><CardTitle>Dica</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Descreva resultados esperados e erros comuns em cada etapa para reduzir retrabalho.</CardContent></Card>
            <Card><CardContent className="grid grid-cols-2 gap-2 p-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Image className="h-3 w-3" />Imagem</span>
              <span className="inline-flex items-center gap-1"><Mic className="h-3 w-3" />Áudio</span>
              <span className="inline-flex items-center gap-1"><Video className="h-3 w-3" />Vídeo</span>
              <span className="inline-flex items-center gap-1"><FileText className="h-3 w-3" />Documento</span>
              <span className="inline-flex items-center gap-1"><Building2 className="h-3 w-3" />Empresa</span>
              <span className="inline-flex items-center gap-1"><Shield className="h-3 w-3" />Privado</span>
            </CardContent></Card>
          </aside>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <Badge variant="outline">Etapa atual: {tabs[currentTabIndex].label}</Badge>
          <div className="flex gap-2">
            <Button variant="outline" disabled={currentTabIndex === 0} onClick={() => setActiveTab(tabs[currentTabIndex - 1].key)}>Voltar</Button>
            <Button onClick={() => currentTabIndex === tabs.length - 1 ? handleSave() : setActiveTab(tabs[currentTabIndex + 1].key)}>
              {currentTabIndex === tabs.length - 1 ? (isEdit ? "Salvar" : "Criar POP") : "Próxima etapa"}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default PopCreateEdit;

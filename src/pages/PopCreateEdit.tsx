import { useMemo, useState } from "react";
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

type TabKey = "informacoes" | "etapas" | "midias" | "revisao";
type Visibilidade = "privado" | "empresa";

type StepItem = { id: number; titulo: string; descricao: string; tempo: string; resultadoEsperado: string; erroComum: string; preRequisito: string; checklist: string };
type MidiaItem = { id: number; tipo: "Imagem" | "Áudio" | "Vídeo" | "Documento/PDF"; nome: string; referencia: string; etapaVinculada: string };

const tabs: { key: TabKey; label: string }[] = [
  { key: "informacoes", label: "Informações Gerais" },
  { key: "etapas", label: "Etapas" },
  { key: "midias", label: "Mídias" },
  { key: "revisao", label: "Revisão Final" },
];

// MOCK: dados temporários usados apenas para montar a interface.
// TODO(Lovable): substituir por dados reais do banco quando a estrutura estiver criada.
const defaultSteps: StepItem[] = [
  { id: 1, titulo: "Preparar ambiente", descricao: "Separar materiais e validar limpeza do local.", tempo: "10 min", resultadoEsperado: "Ambiente pronto para execução", erroComum: "Iniciar sem checklist", preRequisito: "Checklist de materiais concluído", checklist: "Mesa limpa; Equipamentos ligados" },
  { id: 2, titulo: "Executar procedimento", descricao: "Realizar etapa principal conforme padrão interno.", tempo: "20 min", resultadoEsperado: "Execução sem retrabalho", erroComum: "Pular validação intermediária", preRequisito: "Aprovação do responsável", checklist: "Conferir parâmetros; Registrar evidências" },
];

// MOCK: mídias de demonstração com referência inline @midiaX.
const defaultMidias: MidiaItem[] = [
  { id: 1, tipo: "Imagem", nome: "Foto do setup inicial", referencia: "@midia1", etapaVinculada: "Etapa 1" },
  { id: 2, tipo: "Vídeo", nome: "Demonstração de execução", referencia: "@midia2", etapaVinculada: "Etapa 2" },
];

const PopCreateEdit = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("informacoes");
  const [titulo, setTitulo] = useState("POP de abertura operacional");
  const [descricao, setDescricao] = useState("Procedimento padrão para abertura da unidade com foco em segurança e qualidade.");
  const [departamento, setDepartamento] = useState("Operações");
  const [responsavel, setResponsavel] = useState("Ana Lima");
  const [visibilidade, setVisibilidade] = useState<Visibilidade>("empresa");
  const [steps, setSteps] = useState<StepItem[]>(defaultSteps);
  const [midias, setMidias] = useState<MidiaItem[]>(defaultMidias);

  const currentTabIndex = tabs.findIndex((tab) => tab.key === activeTab);
  const tempoEstimado = useMemo(() => `${steps.reduce((acc, step) => acc + Number(step.tempo.replace(/\D/g, "") || 0), 0)} min`, [steps]);

  const updateStep = (id: number, field: keyof Omit<StepItem, "id">, value: string) => setSteps((prev) => prev.map((step) => (step.id === id ? { ...step, [field]: value } : step)));
  const moveStep = (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= steps.length) return;
    const next = [...steps];
    [next[index], next[target]] = [next[target], next[index]];
    setSteps(next);
  };

  const addStep = () => setSteps([...steps, { id: Date.now(), titulo: `Nova etapa ${steps.length + 1}`, descricao: "Descreva a execução desta etapa.", tempo: "5 min", resultadoEsperado: "Resultado esperado", erroComum: "Erro comum", preRequisito: "Pré-requisito", checklist: "Item 1; Item 2" }]);
  const addMidia = () => setMidias([...midias, { id: Date.now(), tipo: "Documento/PDF", nome: `Anexo de apoio ${midias.length + 1}`, referencia: `@midia${midias.length + 1}`, etapaVinculada: "Sem vínculo" }]);

  const handleDiscard = () => {
    // MOCK: ação temporária de descarte para resetar estados locais.
    // TODO(Lovable): integrar confirmação de descarte e navegação segura para /pops.
    setTitulo("POP de abertura operacional");
    setDescricao("Procedimento padrão para abertura da unidade com foco em segurança e qualidade.");
    setDepartamento("Operações");
    setResponsavel("Ana Lima");
    setVisibilidade("empresa");
    setSteps(defaultSteps);
    setMidias(defaultMidias);
    setActiveTab("informacoes");
  };

  const handleSubmitForReview = () => {
    // TODO(Lovable): enviar dados para backend e iniciar fluxo de revisão.
    console.log("Enviar para revisão (mock):", { titulo, descricao, departamento, responsavel, visibilidade, steps, midias, status: "revisão" });
  };

  // TODO(Lovable): empresa_id será obrigatório em todas as entidades do POP (pop, etapas, mídias e revisões).
  // TODO(Lovable): permissões por role devem controlar quem pode criar, editar, revisar e publicar.
  // TODO(Lovable): status suportados no fluxo real: rascunho, revisão, publicado.
  // TODO(Lovable): visibilidade do MVP: privado e empresa (expansão futura por departamento, sem implementar agora).
  // TODO(Lovable): ao editar POP publicado, criar nova versão e nunca sobrescrever a versão anterior.

  return (
    <AppLayout title="Criar Novo POP">
      <div className="mx-auto w-full max-w-7xl space-y-5 pb-24">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Criar Novo POP</h1>
            <p className="mt-1 text-sm text-muted-foreground">Configure as informações, etapas, mídias e revisão do procedimento.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDiscard}>Descartar</Button>
            <Button>Salvar Rascunho</Button>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabKey)}>
          <TabsList className="h-auto w-full justify-start rounded-none border-b bg-transparent p-0">
            {tabs.map((tab) => <TabsTrigger key={tab.key} value={tab.key} className="rounded-none border-b-2 border-transparent px-2 py-2 text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground">{tab.label}</TabsTrigger>)}
          </TabsList>
        </Tabs>

        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            {activeTab === "informacoes" && <Card><CardContent className="grid gap-4 p-5 md:grid-cols-2"> 
              <div className="space-y-2 md:col-span-2"><Label>Título do POP</Label><Input className="focus-visible:ring-2" value={titulo} onChange={(e) => setTitulo(e.target.value)} /></div>
              <div className="space-y-2 md:col-span-2"><Label>Descrição detalhada</Label><Textarea className="focus-visible:ring-2" value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={4} /></div>
              <div className="space-y-2"><Label>Departamento</Label><Input className="focus-visible:ring-2" value={departamento} onChange={(e) => setDepartamento(e.target.value)} /></div>
              <div className="space-y-2"><Label>Responsável</Label><div className="relative"><User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9 focus-visible:ring-2" placeholder="Buscar responsável..." value={responsavel} onChange={(e) => setResponsavel(e.target.value)} /></div></div>
              <div className="space-y-2"><Label>Visibilidade</Label><Select value={visibilidade} onValueChange={(v) => setVisibilidade(v as Visibilidade)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="privado">Privado</SelectItem><SelectItem value="empresa">Empresa</SelectItem></SelectContent></Select></div>
              <p className="text-xs text-muted-foreground md:col-span-2">Dados de demonstração — serão conectados ao banco posteriormente.</p>
            </CardContent></Card>}

            {activeTab === "etapas" && <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle>Etapas</CardTitle><Button onClick={addStep}>Adicionar etapa</Button></CardHeader><CardContent className="space-y-3">{steps.map((step, index) => (
              <Card key={step.id}><CardContent className="grid gap-3 p-4 md:grid-cols-2">
                <div className="space-y-1"><Label>Título da etapa</Label><Input className="focus-visible:ring-2" value={step.titulo} onChange={(e) => updateStep(step.id, "titulo", e.target.value)} /></div>
                <div className="space-y-1"><Label>Tempo estimado</Label><Input className="focus-visible:ring-2" value={step.tempo} onChange={(e) => updateStep(step.id, "tempo", e.target.value)} /></div>
                <div className="space-y-1 md:col-span-2"><Label>Descrição</Label><Textarea className="focus-visible:ring-2" value={step.descricao} onChange={(e) => updateStep(step.id, "descricao", e.target.value)} rows={2} /></div>
                <div className="space-y-1"><Label>Resultado esperado</Label><Input className="focus-visible:ring-2" value={step.resultadoEsperado} onChange={(e) => updateStep(step.id, "resultadoEsperado", e.target.value)} /></div>
                <div className="space-y-1"><Label>Erro comum</Label><Input className="focus-visible:ring-2" value={step.erroComum} onChange={(e) => updateStep(step.id, "erroComum", e.target.value)} /></div>
                <div className="space-y-1"><Label>Pré-requisito</Label><Input className="focus-visible:ring-2" value={step.preRequisito} onChange={(e) => updateStep(step.id, "preRequisito", e.target.value)} /></div>
                <div className="space-y-1"><Label>Checklist</Label><Input className="focus-visible:ring-2" value={step.checklist} onChange={(e) => updateStep(step.id, "checklist", e.target.value)} /></div>
                <div className="md:col-span-2 flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => moveStep(index, "up")}>Mover para cima</Button><Button variant="outline" size="sm" onClick={() => moveStep(index, "down")}>Mover para baixo</Button><Button variant="destructive" size="sm" onClick={() => setSteps(steps.filter((s) => s.id !== step.id))}>Remover</Button></div>
              </CardContent></Card>
            ))}</CardContent></Card>}

            {activeTab === "midias" && <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle>Mídias</CardTitle><Button onClick={addMidia}>Adicionar mídia</Button></CardHeader><CardContent className="space-y-3">{midias.map((midia) => (
              <div key={midia.id} className="rounded-md border p-3 text-sm">
                <p><strong>Tipo:</strong> {midia.tipo}</p><p><strong>Nome:</strong> {midia.nome}</p><p><strong>Referência:</strong> {midia.referencia}</p><p><strong>Etapa vinculada:</strong> {midia.etapaVinculada}</p>
              </div>
            ))}<p className="text-xs text-muted-foreground">Dados mockados — futuramente serão vinculados ao armazenamento e banco de dados pelo Lovable.</p></CardContent></Card>}

            {activeTab === "revisao" && <Card><CardHeader><CardTitle>Revisão Final</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><p><strong>Título:</strong> {titulo}</p><p><strong>Departamento:</strong> {departamento}</p><p><strong>Responsável:</strong> {responsavel}</p><p><strong>Visibilidade:</strong> {visibilidade === "privado" ? "Privado" : "Empresa"}</p><p><strong>Quantidade de etapas:</strong> {steps.length}</p><p><strong>Quantidade de mídias:</strong> {midias.length}</p><p><strong>Status inicial:</strong> Rascunho</p><div className="flex gap-2 pt-2"><Button variant="outline">Salvar Rascunho</Button><Button onClick={handleSubmitForReview}>Enviar para Revisão</Button></div></CardContent></Card>}
          </div>

          <aside className="space-y-3">
            <Card><CardHeader><CardTitle>Resumo do POP</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><p><strong>Versão:</strong> 1.0 (Rascunho)</p><p><strong>Tempo estimado:</strong> {tempoEstimado}</p><p><strong>Quantidade de etapas:</strong> {steps.length}</p><p><strong>Quantidade de mídias:</strong> {midias.length}</p><p><strong>Status:</strong> rascunho</p></CardContent></Card>
            <Card><CardHeader><CardTitle>Dica do especialista</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Descreva resultados esperados e erros comuns em cada etapa para reduzir retrabalho na execução operacional.</CardContent></Card>
            <Card><CardHeader><CardTitle>Observação de mock</CardTitle></CardHeader><CardContent className="text-xs text-muted-foreground">Esta tela usa dados mockados. A integração real com banco, autenticação, permissões e empresa_id será feita posteriormente pelo Lovable.</CardContent></Card>
            <Card><CardContent className="grid grid-cols-2 gap-2 p-4 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><Image className="h-3 w-3" />Imagem</span><span className="inline-flex items-center gap-1"><Mic className="h-3 w-3" />Áudio</span><span className="inline-flex items-center gap-1"><Video className="h-3 w-3" />Vídeo</span><span className="inline-flex items-center gap-1"><FileText className="h-3 w-3" />Documento/PDF</span><span className="inline-flex items-center gap-1"><Building2 className="h-3 w-3" />Empresa</span><span className="inline-flex items-center gap-1"><Shield className="h-3 w-3" />Privado</span></CardContent></Card>
          </aside>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <Badge variant="outline">Etapa atual: {tabs[currentTabIndex].label}</Badge>
          <div className="flex gap-2">
            <Button variant="outline" disabled={currentTabIndex === 0} onClick={() => setActiveTab(tabs[currentTabIndex - 1].key)}>Voltar</Button>
            <Button onClick={() => currentTabIndex === tabs.length - 1 ? handleSubmitForReview() : setActiveTab(tabs[currentTabIndex + 1].key)}>{currentTabIndex === tabs.length - 1 ? "Enviar para Revisão" : "Próxima etapa"}</Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default PopCreateEdit;

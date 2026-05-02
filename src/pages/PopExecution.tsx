import { useMemo, useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import { Check, CheckCircle2, Clock3, FileAudio2, FileImage, FileText, Film, Pause, Play } from "lucide-react";

import { AppSidebar } from "@/components/AppSidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { SidebarProvider } from "@/components/ui/sidebar";
import { usePop, type PopMidiaTipo, type PopMidiaRow } from "@/hooks/usePops";

const mediaIcons: Record<PopMidiaTipo, ReactNode> = {
  imagem: <FileImage className="h-3.5 w-3.5" />,
  audio: <FileAudio2 className="h-3.5 w-3.5" />,
  video: <Film className="h-3.5 w-3.5" />,
  documento: <FileText className="h-3.5 w-3.5" />,
};

export default function PopExecution() {
  const { id } = useParams();
  const { data: pop, isLoading } = usePop(id);

  const etapas = useMemo(() => pop?.versao_ativa?.etapas ?? [], [pop]);
  const midias = useMemo(() => pop?.versao_ativa?.midias ?? [], [pop]);

  const [etapaAtual, setEtapaAtual] = useState(0);
  const [checklistMarcado, setChecklistMarcado] = useState<Record<string, boolean>>({});
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [executionStatus, setExecutionStatus] = useState<"em_andamento" | "concluida">("em_andamento");
  const [erroChecklist, setErroChecklist] = useState(false);
  const [audioAberto, setAudioAberto] = useState<{ nome: string; tocando: boolean } | null>(null);

  if (isLoading) {
    return <SidebarProvider defaultOpen={false}><div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Carregando...</div></SidebarProvider>;
  }
  if (!pop || etapas.length === 0) {
    return (
      <SidebarProvider defaultOpen={false}>
        <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
          {pop ? "Este POP não tem etapas cadastradas." : "POP não encontrado."}
        </div>
      </SidebarProvider>
    );
  }

  const totalEtapas = etapas.length;
  const etapa = etapas[etapaAtual];
  const midiasDaEtapa: PopMidiaRow[] = midias.filter((m) => m.etapa_id === etapa.id);
  const progressoPercentual = Math.round((completedSteps.length / totalEtapas) * 100);
  const etapaConcluida = completedSteps.includes(etapa.id);
  const checklistKey = (itemId: string) => `${etapa.id}-${itemId}`;

  const concluirEtapa = () => {
    if (executionStatus === "concluida") return;
    const checklistCompleto = etapa.checklist.every((item) => checklistMarcado[checklistKey(item.id)]);
    if (etapa.checklist.length > 0 && !checklistCompleto) {
      setErroChecklist(true);
      return;
    }
    setErroChecklist(false);
    setCompletedSteps((prev) => (prev.includes(etapa.id) ? prev : [...prev, etapa.id]));

    if (etapaAtual === totalEtapas - 1) {
      setExecutionStatus("concluida");
      return;
    }
    setEtapaAtual((prev) => Math.min(totalEtapas - 1, prev + 1));
  };

  const renderInstruction = (texto: string) => {
    const matches = [...texto.matchAll(/@(\w+\d+)/g)];
    if (matches.length === 0) return texto;
    const parts: ReactNode[] = [];
    let cursor = 0;
    matches.forEach((match, idx) => {
      const token = match[0];
      const ref = match[1];
      const start = match.index ?? 0;
      const end = start + token.length;
      if (start > cursor) parts.push(texto.slice(cursor, start));
      const m = midiasDaEtapa.find((x) => x.referencia === ref);
      if (!m) parts.push(token);
      else parts.push(
        <button
          key={`${ref}-${idx}`}
          type="button"
          onClick={() => { if (m.tipo === "audio") setAudioAberto({ nome: m.nome, tocando: true }); }}
          className="mx-0.5 inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
        >
          {mediaIcons[m.tipo]}{token}
        </button>
      );
      cursor = end;
    });
    if (cursor < texto.length) parts.push(texto.slice(cursor));
    return parts;
  };

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-screen bg-muted/20">
        <AppSidebar />
        <main className="flex min-w-0 flex-1 flex-col">
          <header className="border-b bg-background px-6 py-4">
            <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-semibold">{pop.titulo}</h1>
                <p className="text-sm text-muted-foreground">{pop.departamento}</p>
                <p className="text-xs text-muted-foreground">POP {pop.id} • Versão {pop.versao_ativa?.numero ?? "v1.0"}</p>
              </div>
              <div className="w-full max-w-sm space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Etapa {etapaAtual + 1} de {totalEtapas}</span>
                  <span>{progressoPercentual}% concluído</span>
                </div>
                <Progress value={progressoPercentual} />
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="mx-auto w-full max-w-4xl space-y-5">
              {executionStatus === "concluida" && (
                <Card className="border-emerald-300 bg-emerald-50">
                  <CardContent className="py-3 text-sm font-medium text-emerald-800">Execução concluída com sucesso.</CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Etapa {etapa.ordem} — {etapa.titulo}</CardTitle>
                    {etapa.tempo_estimado && <Badge variant="secondary" className="gap-1"><Clock3 className="h-3.5 w-3.5" />{etapa.tempo_estimado}</Badge>}
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{renderInstruction(etapa.descricao)}</p>
                </CardHeader>
                <CardContent className="space-y-3 border-t pt-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Checklist da etapa</p>
                  {erroChecklist && <p className="text-sm text-destructive">Complete todos os itens antes de concluir.</p>}
                  {etapa.checklist.length === 0 && <p className="text-sm text-muted-foreground">Sem checklist nesta etapa.</p>}
                  {etapa.checklist.map((item) => {
                    const key = checklistKey(item.id);
                    return (
                      <label key={item.id} className="flex cursor-pointer items-center gap-2 rounded-md border p-2 hover:bg-muted/40">
                        <Checkbox
                          checked={checklistMarcado[key] ?? false}
                          disabled={etapaConcluida || executionStatus === "concluida"}
                          onCheckedChange={(value) => {
                            if (etapaConcluida || executionStatus === "concluida") return;
                            setErroChecklist(false);
                            setChecklistMarcado((prev) => ({ ...prev, [key]: Boolean(value) }));
                          }}
                        />
                        <span className="text-sm">{item.texto}</span>
                      </label>
                    );
                  })}
                </CardContent>
                <CardFooter className="justify-between border-t pt-4">
                  <Button variant="outline" disabled={etapaAtual === 0 || executionStatus === "concluida"} onClick={() => setEtapaAtual((p) => Math.max(0, p - 1))}>Voltar</Button>
                  <Button onClick={concluirEtapa} disabled={executionStatus === "concluida"}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {executionStatus === "concluida" ? "Execução finalizada" : etapaAtual === totalEtapas - 1 ? "Finalizar execução" : "Concluir etapa"}
                  </Button>
                </CardFooter>
              </Card>

              <div className="flex justify-center gap-2">
                {etapas.map((step, index) => {
                  const status = completedSteps.includes(step.id) ? "done" : index === etapaAtual ? "current" : "pending";
                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => { if (executionStatus !== "concluida") setEtapaAtual(index); }}
                      className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition-colors ${
                        status === "done" ? "border-primary bg-primary text-primary-foreground"
                        : status === "current" ? "border-primary bg-primary/15 text-primary"
                        : "border-border text-muted-foreground"
                      }`}
                    >
                      {status === "done" ? <Check className="h-3.5 w-3.5" /> : step.ordem}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </main>

        {audioAberto && (
          <div className="fixed bottom-6 right-6 w-80 rounded-xl border bg-primary p-4 text-primary-foreground shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium">Reproduzindo: {audioAberto.nome}</span>
              <Button size="icon" variant="secondary" className="h-7 w-7" onClick={() => setAudioAberto(null)}>×</Button>
            </div>
            <div className="flex items-center gap-3">
              <Button size="icon" variant="secondary" className="h-9 w-9" onClick={() => setAudioAberto((p) => p ? { ...p, tocando: !p.tocando } : p)}>
                {audioAberto.tocando ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <div className="flex-1">
                <div className="mb-1 flex justify-between text-xs opacity-90"><span>00:45</span><span>01:30</span></div>
                <div className="h-1.5 rounded-full bg-primary-foreground/25"><div className="h-full w-1/2 rounded-full bg-primary-foreground" /></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </SidebarProvider>
  );
}

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import { Check, CheckCircle2, Clock3, FileAudio2, FileImage, FileText, Film } from "lucide-react";

import { AppSidebar } from "@/components/AppSidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { SidebarProvider } from "@/components/ui/sidebar";
import { MediaViewer } from "@/components/MediaViewer";
import { useToast } from "@/hooks/use-toast";
import type { PopMidiaTipo, PopMidiaRow } from "@/hooks/usePops";
import {
  useConcluirEtapa,
  useExecucao,
  useExecucaoEtapas,
  useFinalizarExecucao,
} from "@/hooks/useExecucoes";

const mediaIcons: Record<PopMidiaTipo, ReactNode> = {
  imagem: <FileImage className="h-3.5 w-3.5" />,
  audio: <FileAudio2 className="h-3.5 w-3.5" />,
  video: <Film className="h-3.5 w-3.5" />,
  documento: <FileText className="h-3.5 w-3.5" />,
};

// Mesmo padrão usado no PopDetail (suporta @Sintegra, @midia1, @acesso-a-tela).
const REF_REGEX = /@([A-Za-zÀ-ÿ0-9_-]+)/g;

export default function PopExecution() {
  const { id } = useParams();
  const { toast } = useToast();
  const { data, isLoading } = useExecucao(id);
  const { data: etapasExec = [] } = useExecucaoEtapas(id);
  const concluirEtapaMut = useConcluirEtapa();
  const finalizarMut = useFinalizarExecucao();

  const etapas = useMemo(() => data?.etapas ?? [], [data]);
  const midias = useMemo(() => data?.midias ?? [], [data]);

  const completedSteps = useMemo(
    () => etapasExec.filter((e) => e.concluido).map((e) => e.etapa_id),
    [etapasExec]
  );

  const [etapaAtual, setEtapaAtual] = useState(0);
  const [checklistMarcado, setChecklistMarcado] = useState<Record<string, boolean>>({});
  const [erroChecklist, setErroChecklist] = useState(false);
  const [iniciadaEm, setIniciadaEm] = useState<string>(() => new Date().toISOString());
  const [viewer, setViewer] = useState<{ open: boolean; midia: PopMidiaRow | null }>({ open: false, midia: null });

  // Posiciona automaticamente na primeira etapa não concluída ao carregar
  useEffect(() => {
    if (etapas.length === 0) return;
    const idx = etapas.findIndex((e) => !completedSteps.includes(e.id));
    setEtapaAtual(idx === -1 ? etapas.length - 1 : idx);
  }, [etapas, completedSteps.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reinicia o "iniciadaEm" sempre que muda de etapa
  useEffect(() => {
    setIniciadaEm(new Date().toISOString());
    setErroChecklist(false);
  }, [etapaAtual]);

  if (isLoading) {
    return (
      <SidebarProvider defaultOpen={false}>
        <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Carregando...</div>
      </SidebarProvider>
    );
  }
  if (!data || etapas.length === 0) {
    return (
      <SidebarProvider defaultOpen={false}>
        <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
          {data ? "Esta versão do POP não tem etapas cadastradas." : "Execução não encontrada."}
        </div>
      </SidebarProvider>
    );
  }

  const { execucao, pop, versao } = data;
  const totalEtapas = etapas.length;
  const etapa = etapas[etapaAtual];
  const midiasDaEtapa: PopMidiaRow[] = midias.filter((m) => m.etapa_id === etapa.id);
  const progressoPercentual = Math.round((completedSteps.length / totalEtapas) * 100);
  const etapaConcluida = completedSteps.includes(etapa.id);
  const finalizada = execucao.status === "concluida";
  const checklistKey = (itemId: string) => `${etapa.id}-${itemId}`;

  const concluirEtapa = async () => {
    if (finalizada) return;
    const checklistCompleto = etapa.checklist.every((item) => checklistMarcado[checklistKey(item.id)]);
    if (etapa.checklist.length > 0 && !checklistCompleto) {
      setErroChecklist(true);
      return;
    }
    setErroChecklist(false);

    try {
      if (!etapaConcluida) {
        await concluirEtapaMut.mutateAsync({
          execucaoId: execucao.id,
          etapaId: etapa.id,
          empresaId: execucao.empresa_id,
          iniciadaEm,
        });
      }

      if (etapaAtual === totalEtapas - 1) {
        await finalizarMut.mutateAsync({ execucaoId: execucao.id, inicio: execucao.data_inicio });
        toast({ title: "Execução concluída", description: "Todas as etapas foram finalizadas." });
        return;
      }
      setEtapaAtual((p) => Math.min(totalEtapas - 1, p + 1));
    } catch (e) {
      toast({ title: "Erro ao concluir etapa", description: (e as Error).message, variant: "destructive" });
    }
  };

  const renderInstruction = (texto: string) => {
    if (!texto) return null;
    const matches = [...texto.matchAll(REF_REGEX)];
    if (matches.length === 0) return texto;
    const parts: ReactNode[] = [];
    let cursor = 0;
    matches.forEach((match, idx) => {
      const token = match[0];
      const ref = match[1];
      const start = match.index ?? 0;
      const end = start + token.length;
      if (start > cursor) parts.push(texto.slice(cursor, start));
      const m = midiasDaEtapa.find((x) => x.referencia === ref) ?? midias.find((x) => x.referencia === ref);
      if (!m) parts.push(token);
      else parts.push(
        <button
          key={`${ref}-${idx}`}
          type="button"
          onClick={() => setViewer({ open: true, midia: m })}
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
      <div className="flex min-h-screen w-full bg-muted/20">
        <AppSidebar />
        <main className="flex min-w-0 flex-1 flex-col">
          <header className="border-b bg-background px-6 py-4">
            <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-semibold">{pop.titulo}</h1>
                <p className="text-sm text-muted-foreground">{pop.departamento}</p>
                <p className="text-xs text-muted-foreground">Versão {versao.numero} • Execução {execucao.id.slice(0, 8)}</p>
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
              {finalizada && (
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
                  <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">{renderInstruction(etapa.descricao)}</p>
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
                          disabled={etapaConcluida || finalizada}
                          onCheckedChange={(value) => {
                            if (etapaConcluida || finalizada) return;
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
                  <Button variant="outline" disabled={etapaAtual === 0 || finalizada} onClick={() => setEtapaAtual((p) => Math.max(0, p - 1))}>Voltar</Button>
                  <Button onClick={concluirEtapa} disabled={finalizada || concluirEtapaMut.isPending || finalizarMut.isPending}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {finalizada ? "Execução finalizada" : etapaAtual === totalEtapas - 1 ? "Finalizar execução" : "Concluir etapa"}
                  </Button>
                </CardFooter>
              </Card>

              <div className="flex flex-wrap justify-center gap-2">
                {etapas.map((step, index) => {
                  const status = completedSteps.includes(step.id) ? "done" : index === etapaAtual ? "current" : "pending";
                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => { if (!finalizada) setEtapaAtual(index); }}
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

        <MediaViewer
          open={viewer.open}
          onOpenChange={(open) => setViewer((s) => ({ ...s, open }))}
          tipo={viewer.midia?.tipo ?? null}
          url={viewer.midia?.url ?? null}
          nome={viewer.midia?.nome ?? ""}
        />
      </div>
    </SidebarProvider>
  );
}

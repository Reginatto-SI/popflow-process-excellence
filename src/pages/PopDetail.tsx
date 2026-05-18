import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Activity, Building2, Clock3, FileAudio2, FileImage, FileText, Film, History, Loader2, Lock, PlayCircle, Share2 } from "lucide-react";
import type { ReactNode } from "react";

import { AppLayout } from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MediaViewer } from "@/components/MediaViewer";
import { renderMarkdownPreview } from "@/lib/markdownPreview";
import { useToast } from "@/hooks/use-toast";
import { usePop, usePopAtividades, type PopMidiaTipo, type PopStatus, type PopMidiaRow, type PopEtapaRow } from "@/hooks/usePops";
import { useStartExecucao } from "@/hooks/useExecucoes";

const statusLabel: Record<PopStatus, string> = {
  rascunho: "Rascunho",
  revisao: "Em revisão",
  publicado: "Publicado",
};

const statusClass: Record<PopStatus, string> = {
  rascunho: "bg-muted text-muted-foreground",
  revisao: "bg-amber-500 text-white",
  publicado: "bg-emerald-600 text-white",
};


const formatActivityDate = (value: string) => {
  const date = new Date(value);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const time = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(date);

  if (startOfDate === startOfToday) return `Hoje às ${time}`;
  if (startOfDate === startOfToday - 24 * 60 * 60 * 1000) return `Ontem às ${time}`;
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
};

const actionLabel: Record<string, string> = {
  pop_criado: "Criação",
  pop_informacoes_editadas: "Edição",
  etapa_adicionada: "Etapa",
  etapa_editada: "Etapa",
  etapa_removida: "Remoção",
  midia_adicionada: "Mídia",
  midia_removida: "Mídia",
  midia_alterada: "Mídia",
};

const mediaIconByType: Record<PopMidiaTipo, ReactNode> = {
  imagem: <FileImage className="h-3 w-3" />,
  audio: <FileAudio2 className="h-3 w-3" />,
  video: <Film className="h-3 w-3" />,
  documento: <FileText className="h-3 w-3" />,
};

const PopDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: pop, isLoading } = usePop(id);
  const { data: atividades = [], isLoading: isLoadingAtividades } = usePopAtividades(id);
  const startExec = useStartExecucao();
  const [viewer, setViewer] = useState<{ open: boolean; midia: PopMidiaRow | null }>({ open: false, midia: null });
  const [activitiesOpen, setActivitiesOpen] = useState(false);

  if (isLoading) return <AppLayout title="Detalhe do POP"><p className="p-6 text-sm text-muted-foreground">Carregando...</p></AppLayout>;
  if (!pop) return <AppLayout title="Detalhe do POP"><p className="p-6 text-sm text-muted-foreground">POP não encontrado.</p></AppLayout>;

  const versao = pop.versao_ativa;
  const status: PopStatus = versao?.status ?? "rascunho";
  const etapas = versao?.etapas ?? [];
  const midias = versao?.midias ?? [];
  const totalMin = etapas.reduce((acc, e) => acc + Number(e.tempo_estimado.replace(/\D/g, "") || 0), 0);

  const openMidia = (m: PopMidiaRow) => setViewer({ open: true, midia: m });

  // MVP: permitimos iniciar execução também em rascunho — comportamento temporário.
  // Quando o fluxo de revisão/publicação estiver pronto, restringir para 'publicado'.
  const podeExecutar = !!pop.versao_ativa_id && !!versao;
  const execucaoMotivo = !podeExecutar
    ? "Este POP ainda não tem versão ativa para executar."
    : status !== "publicado"
      ? "MVP: execução habilitada mesmo em rascunho. Será restrita a POPs publicados quando o fluxo de revisão estiver pronto."
      : "Iniciar execução guiada deste POP.";

  const iniciarExecucao = async () => {
    if (!podeExecutar || !versao) return;
    try {
      const execId = await startExec.mutateAsync({ popId: pop.id, popVersaoId: versao.id });
      navigate(`/execucao/${execId}`);
    } catch (e) {
      toast({ title: "Erro ao iniciar execução", description: (e as Error).message, variant: "destructive" });
    }
  };

  return (
    <AppLayout title="Detalhe do POP">
      <div className="mx-auto w-full max-w-7xl space-y-5">
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">POPs / {pop.departamento || "—"} / {pop.titulo}</p>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex gap-2">
                <Badge className={statusClass[status]}>{statusLabel[status]}</Badge>
                <Badge variant="outline" className="gap-1">
                  {pop.visibilidade === "privado" ? <Lock className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}
                  {pop.visibilidade === "privado" ? "Privado" : "Empresa"}
                </Badge>
              </div>
              <h1 className="text-2xl font-semibold">{pop.titulo}</h1>
              <p className="text-sm text-muted-foreground">{pop.departamento || "—"} • Versão {versao?.numero ?? "v1.0"}</p>
              {pop.descricao && <p className="text-sm text-muted-foreground max-w-3xl whitespace-pre-wrap">{pop.descricao}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline"><Share2 className="mr-2 h-4 w-4" />Compartilhar</Button>
              <Button variant="outline" onClick={() => setActivitiesOpen(true)}><History className="mr-2 h-4 w-4" />Atividades</Button>
              <Button variant="outline" onClick={() => navigate(`/pops/${pop.id}/editar`)}>Editar</Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0}>
                      <Button disabled={!podeExecutar || startExec.isPending} onClick={iniciarExecucao}>
                        {startExec.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
                        Iniciar Execução
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{execucaoMotivo}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {[
            ["Responsável", pop.responsavel || "—"],
            ["Tempo estimado", `${totalMin} min`],
            ["Departamento", pop.departamento || "—"],
            ["Versão", versao?.numero ?? "v1.0"],
            ["Etapas", String(etapas.length)],
            ["Mídias", String(midias.length)],
          ].map(([label, value]) => (
            <Card key={label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="font-semibold">{value}</p></CardContent></Card>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
          <section className="space-y-3">
            {etapas.length === 0 && <Card><CardContent className="p-6 text-sm text-muted-foreground">Nenhuma etapa cadastrada.</CardContent></Card>}
            {etapas.map((etapa: PopEtapaRow) => {
              const midiasDaEtapa = midias.filter((m) => m.etapa_id === etapa.id);
              const porReferencia = new Map<string, PopMidiaRow>();
              [...midiasDaEtapa, ...midias].forEach((m) => {
                if (!porReferencia.has(m.referencia)) porReferencia.set(m.referencia, m);
              });
              const midiasParaDescricao = [...porReferencia.values()];
              return (
                <Card key={etapa.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-lg font-semibold">Etapa {etapa.ordem} — {etapa.titulo}</CardTitle>
                      {etapa.tempo_estimado && <Badge variant="secondary" className="text-xs">{etapa.tempo_estimado}</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {/* Reutiliza o preview Markdown seguro do fluxo de execução/criação: sem dangerouslySetInnerHTML, mantendo HTML como texto e mídias como chips clicáveis. */}
                    <div className="space-y-4 text-muted-foreground">
                      {renderMarkdownPreview(etapa.descricao, midiasParaDescricao, openMidia)}
                    </div>
                    <div className="grid gap-2 md:grid-cols-3">
                      <div className="rounded-md border bg-muted/30 p-2"><p className="text-xs font-medium text-muted-foreground">Pré-requisito</p><p>{etapa.pre_requisito || "—"}</p></div>
                      <div className="rounded-md border bg-emerald-50/40 p-2"><p className="text-xs font-medium text-muted-foreground">Resultado esperado</p><p>{etapa.resultado_esperado || "—"}</p></div>
                      <div className="rounded-md border bg-amber-50/40 p-2"><p className="text-xs font-medium text-muted-foreground">Erro comum</p><p>{etapa.erro_comum || "—"}</p></div>
                    </div>
                    {etapa.checklist?.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <p className="mb-1 font-medium">Checklist</p>
                          <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">
                            {etapa.checklist.map((item) => <li key={item.id}>{item.texto}</li>)}
                          </ul>
                        </div>
                      </>
                    )}
                    {midiasDaEtapa.length > 0 && (
                      <div>
                        <p className="mb-1 font-medium">Mídias vinculadas</p>
                        <div className="flex flex-wrap gap-2">
                          {midiasDaEtapa.map((m) => (
                            <Button key={m.id} size="sm" variant="secondary" onClick={() => openMidia(m)}>
                              {mediaIconByType[m.tipo]}<span className="ml-1">{m.nome}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </section>

          <aside className="space-y-3">
            <Card>
              <CardHeader><CardTitle className="text-sm">Resumo Operacional</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>Tempo total: <strong>{totalMin} min</strong></p>
                <p>Etapas: <strong>{etapas.length}</strong></p>
                <p>Mídias: <strong>{midias.length}</strong></p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Clock3 className="h-4 w-4" />Versão atual</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {versao ? `${versao.numero} (${statusLabel[status]})` : "Sem versão ativa"}
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>


      <Dialog open={activitiesOpen} onOpenChange={setActivitiesOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registro de atividades</DialogTitle>
            <DialogDescription>Acompanhe as principais ações realizadas neste POP.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            {isLoadingAtividades ? (
              <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando atividades...
              </div>
            ) : atividades.length === 0 ? (
              <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">Nenhuma atividade registrada ainda.</div>
            ) : (
              <div className="space-y-3">
                {atividades.map((atividade) => (
                  <div key={atividade.id} className="flex gap-3 rounded-md border bg-background p-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <Activity className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium leading-relaxed">{atividade.descricao}</p>
                        <Badge variant="secondary" className="text-[10px]">{actionLabel[atividade.acao] ?? atividade.acao}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {atividade.usuario?.nome ?? "Usuário"} • {formatActivityDate(atividade.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <MediaViewer
        open={viewer.open}
        onOpenChange={(open) => setViewer((s) => ({ ...s, open }))}
        tipo={viewer.midia?.tipo ?? null}
        url={viewer.midia?.url ?? null}
        nome={viewer.midia?.nome ?? ""}
      />
    </AppLayout>
  );
};

export default PopDetail;

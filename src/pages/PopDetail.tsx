import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Building2, Clock3, FileAudio2, FileImage, FileText, Film, Loader2, Lock, PlayCircle, Share2 } from "lucide-react";
import type { ReactNode } from "react";

import { AppLayout } from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MediaViewer } from "@/components/MediaViewer";
import { useToast } from "@/hooks/use-toast";
import { usePop, type PopMidiaTipo, type PopStatus, type PopMidiaRow, type PopEtapaRow } from "@/hooks/usePops";
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

const mediaIconByType: Record<PopMidiaTipo, ReactNode> = {
  imagem: <FileImage className="h-3 w-3" />,
  audio: <FileAudio2 className="h-3 w-3" />,
  video: <Film className="h-3 w-3" />,
  documento: <FileText className="h-3 w-3" />,
};

// Regex permite letras (incl. acentos), dígitos, _ e -. Cobre @Sintegra, @midia1, @imagem1.
const REF_REGEX = /@([A-Za-zÀ-ÿ0-9_-]+)/g;

const PopDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: pop, isLoading } = usePop(id);
  const startExec = useStartExecucao();
  const [viewer, setViewer] = useState<{ open: boolean; midia: PopMidiaRow | null }>({ open: false, midia: null });

  if (isLoading) return <AppLayout title="Detalhe do POP"><p className="p-6 text-sm text-muted-foreground">Carregando...</p></AppLayout>;
  if (!pop) return <AppLayout title="Detalhe do POP"><p className="p-6 text-sm text-muted-foreground">POP não encontrado.</p></AppLayout>;

  const versao = pop.versao_ativa;
  const status: PopStatus = versao?.status ?? "rascunho";
  const etapas = versao?.etapas ?? [];
  const midias = versao?.midias ?? [];
  const totalMin = etapas.reduce((acc, e) => acc + Number(e.tempo_estimado.replace(/\D/g, "") || 0), 0);

  const openMidia = (m: PopMidiaRow) => setViewer({ open: true, midia: m });

  const renderInline = (descricao: string, midiasDaEtapa: PopMidiaRow[]) => {
    if (!descricao) return null;
    const matches = [...descricao.matchAll(REF_REGEX)];
    if (matches.length === 0) return descricao;
    const parts: ReactNode[] = [];
    let cursor = 0;
    matches.forEach((match, idx) => {
      const token = match[0]; // ex: "@Sintegra"
      const ref = match[1];   // ex: "Sintegra" — preservado (case-sensitive, sem mexer)
      const start = match.index ?? 0;
      const end = start + token.length;
      if (start > cursor) parts.push(descricao.slice(cursor, start));
      // Lookup: primeiro na etapa, depois fallback em todas as mídias do POP
      const m = midiasDaEtapa.find((x) => x.referencia === ref) ?? midias.find((x) => x.referencia === ref);
      if (!m) {
        parts.push(token);
      } else {
        parts.push(
          <button
            key={`${ref}-${idx}`}
            type="button"
            onClick={() => openMidia(m)}
            className="mx-0.5 inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/25"
          >
            {mediaIconByType[m.tipo]}{token}
          </button>
        );
      }
      cursor = end;
    });
    if (cursor < descricao.length) parts.push(descricao.slice(cursor));
    return parts;
  };

  const execucaoMotivo =
    status !== "publicado"
      ? "Publique o POP para habilitar a execução."
      : "A execução será habilitada quando o fluxo de execução for implementado.";

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
              <Button variant="outline" onClick={() => navigate(`/pops/${pop.id}/editar`)}>Editar</Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    {/* span para o tooltip funcionar mesmo com botão desabilitado */}
                    <span tabIndex={0}>
                      <Button disabled>
                        <PlayCircle className="mr-2 h-4 w-4" />Iniciar Execução
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
              return (
                <Card key={etapa.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-lg font-semibold">Etapa {etapa.ordem} — {etapa.titulo}</CardTitle>
                      {etapa.tempo_estimado && <Badge variant="secondary" className="text-xs">{etapa.tempo_estimado}</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p className="text-muted-foreground whitespace-pre-wrap">{renderInline(etapa.descricao, midiasDaEtapa)}</p>
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

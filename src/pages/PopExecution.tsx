import { useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import { Check, CheckCircle2, Clock3, FileAudio2, FileImage, FileText, Film, Pause, Play } from "lucide-react";

import { AppSidebar } from "@/components/AppSidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { SidebarProvider } from "@/components/ui/sidebar";

type MediaType = "imagem" | "audio" | "video" | "documento";

interface StepMedia { id: string; referencia: string; tipo: MediaType; nome: string; }
interface StepItem { numero: number; titulo: string; tempoEstimado: string; instrucao: string; checklist: string[]; midias: StepMedia[]; }

// MOCK:
// TODO(Lovable): substituir por dados reais de execução vinculados a pop_versao_id e empresa_id obrigatório.
const executionMock = {
  id: "execucao-001",
  popId: "pop-001",
  popVersaoId: "pop-versao-2.3",
  empresaId: "empresa-001",
  status: "em_andamento" as "em_andamento" | "concluida",
  popNome: "Execução de Recebimento de Mercadorias",
  contexto: "Unidade Central de Distribuição • Setor de Suprimentos",
  etapas: [
    {
      numero: 1,
      titulo: "Receber documentação da carga",
      tempoEstimado: "03:00",
      instrucao: "Confirme a integridade da nota fiscal e valide @documento1 antes de iniciar. Se necessário, consulte @imagem1.",
      checklist: ["Nota fiscal recebida", "Assinatura do transportador validada", "Número do pedido localizado"],
      midias: [
        { id: "midia-doc-1", referencia: "documento1", tipo: "documento", nome: "Modelo de conferência NF-e" },
        { id: "midia-img-1", referencia: "imagem1", tipo: "imagem", nome: "Exemplo de nota fiscal correta" },
      ],
    },
    {
      numero: 2,
      titulo: "Conferência de notas de entrada",
      tempoEstimado: "04:25",
      instrucao: "Verifique CNPJ e chave de acesso com @imagem2 e @documento2. Em divergência acima de 5%, ouça @audio1 e revise o fluxo com @video1.",
      checklist: ["CNPJ conferido com pedido", "Chave de acesso validada", "Divergências registradas no sistema"],
      midias: [
        { id: "midia-img-2", referencia: "imagem2", tipo: "imagem", nome: "Onde localizar o CNPJ na nota" },
        { id: "midia-doc-2", referencia: "documento2", tipo: "documento", nome: "Procedimento de validação da chave" },
        { id: "midia-audio-1", referencia: "audio1", tipo: "audio", nome: "Orientação rápida para divergências" },
        { id: "midia-video-1", referencia: "video1", tipo: "video", nome: "Exemplo prático de conferência" },
      ],
    },
    {
      numero: 3,
      titulo: "Registrar recebimento no ERP",
      tempoEstimado: "02:40",
      instrucao: "Finalize o registro no ERP e utilize @video2 para revisar o lançamento final.",
      checklist: ["Lançamento efetuado", "Quantidade validada", "Comprovante anexado"],
      midias: [{ id: "midia-video-2", referencia: "video2", tipo: "video", nome: "Tutorial de lançamento final" }],
    },
  ] as StepItem[],
};

const mediaIcons: Record<MediaType, ReactNode> = {
  imagem: <FileImage className="h-3.5 w-3.5" />,
  audio: <FileAudio2 className="h-3.5 w-3.5" />,
  video: <Film className="h-3.5 w-3.5" />,
  documento: <FileText className="h-3.5 w-3.5" />,
};

export default function PopExecution() {
  const { id } = useParams();
  const [etapaAtual, setEtapaAtual] = useState(0);
  const [checklistMarcado, setChecklistMarcado] = useState<Record<string, boolean>>({});
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [executionStatus, setExecutionStatus] = useState<"em_andamento" | "concluida">("em_andamento");
  const [erroChecklist, setErroChecklist] = useState(false);
  const [audioAberto, setAudioAberto] = useState<{ nome: string; tocando: boolean } | null>(null);

  const totalEtapas = executionMock.etapas.length;
  const etapa = executionMock.etapas[etapaAtual];
  const progressoPercentual = Math.round((completedSteps.length / totalEtapas) * 100);

  const checklistKey = (item: string) => `${etapa.numero}-${item}`;
  const etapaConcluida = completedSteps.includes(etapa.numero);

  const concluirEtapa = () => {
    if (executionStatus === "concluida") return;

    const checklistCompleto = etapa.checklist.every((item) => checklistMarcado[checklistKey(item)]);
    if (!checklistCompleto) {
      setErroChecklist(true);
      // TODO(Lovable): validar checklist no backend antes de concluir etapa.
      // TODO(Lovable): permitir exceções controladas via permissão (admin/gestor).
      return;
    }

    setErroChecklist(false);
    const numeroEtapaAtual = etapa.numero;

    setCompletedSteps((prev) => (prev.includes(numeroEtapaAtual) ? prev : [...prev, numeroEtapaAtual]));
    // TODO(Lovable): persistir conclusão da etapa no backend com usuário, data/hora e tempo gasto.
    // TODO(Lovable): registrar conclusão com usuário, data e evidência.

    if (etapaAtual === totalEtapas - 1) {
      setExecutionStatus("concluida");
      // TODO(Lovable): atualizar status da execução para concluida ao finalizar.
      return;
    }

    setEtapaAtual((prev) => Math.min(totalEtapas - 1, prev + 1));
  };

  const renderInstruction = (texto: string) => {
    const matches = [...texto.matchAll(/@(imagem|audio|video|documento)\d+/g)];
    if (matches.length === 0) return texto;

    const parts: ReactNode[] = [];
    let cursor = 0;

    matches.forEach((match, index) => {
      const token = match[0];
      const inicio = match.index ?? 0;
      const fim = inicio + token.length;
      if (inicio > cursor) parts.push(texto.slice(cursor, inicio));

      const midia = etapa.midias.find((item) => `@${item.referencia}` === token);
      if (!midia) {
        parts.push(token);
      } else {
        parts.push(
          <button
            key={`${token}-${index}`}
            type="button"
            onClick={() => {
              if (midia.tipo === "audio") {
                // MOCK: simulação de player de áudio
                // TODO(Lovable): integrar com player real.
                setAudioAberto({ nome: midia.nome, tocando: true });
              }
              // TODO(Lovable): abrir mídia em modal ou player contextual.
            }}
            className="mx-0.5 inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
          >
            {mediaIcons[midia.tipo]}
            @{midia.referencia}
          </button>,
        );
      }
      cursor = fim;
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
                <h1 className="text-xl font-semibold">{executionMock.popNome}</h1>
                <p className="text-sm text-muted-foreground">{executionMock.contexto}</p>
                <p className="text-xs text-muted-foreground">Execução {executionMock.id} • POP {id ?? executionMock.popId}</p>
              </div>
              <div className="w-full max-w-sm space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Etapa {etapaAtual + 1} de {totalEtapas}</span>
                  <span>{progressoPercentual}% concluído</span>
                </div>
                <Progress value={progressoPercentual} />
                {/* TODO(Lovable): calcular progresso oficial com base nas etapas concluídas persistidas. */}
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
                    <CardTitle className="text-lg">Etapa {etapa.numero} — {etapa.titulo}</CardTitle>
                    <Badge variant="secondary" className="gap-1"><Clock3 className="h-3.5 w-3.5" />{etapa.tempoEstimado}</Badge>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{renderInstruction(etapa.instrucao)}</p>
                </CardHeader>
                <CardContent className="space-y-3 border-t pt-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Checklist da etapa</p>
                  {erroChecklist && (
                    <p className="text-sm text-destructive">Complete todos os itens do checklist antes de concluir a etapa.</p>
                  )}
                  {etapa.checklist.map((item) => {
                    const key = checklistKey(item);
                    return (
                      <label key={item} className="flex cursor-pointer items-center gap-2 rounded-md border p-2 hover:bg-muted/40">
                        <Checkbox
                          checked={checklistMarcado[key] ?? false}
                          disabled={etapaConcluida || executionStatus === "concluida"}
                          onCheckedChange={(value) => {
                            if (etapaConcluida || executionStatus === "concluida") return;
                            setErroChecklist(false);
                            setChecklistMarcado((prev) => ({ ...prev, [key]: Boolean(value) }));
                          }}
                        />
                        <span className="text-sm">{item}</span>
                      </label>
                    );
                  })}
                </CardContent>
                <CardFooter className="justify-between border-t pt-4">
                  <Button variant="outline" disabled={etapaAtual === 0 || executionStatus === "concluida"} onClick={() => setEtapaAtual((prev) => Math.max(0, prev - 1))}>Voltar</Button>
                  <Button onClick={concluirEtapa} disabled={executionStatus === "concluida"}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />{executionStatus === "concluida" ? "Execução finalizada" : etapaAtual === totalEtapas - 1 ? "Finalizar execução" : "Concluir etapa"}
                  </Button>
                </CardFooter>
              </Card>

              <div className="flex justify-center gap-2">
                {executionMock.etapas.map((step, index) => {
                  const status = completedSteps.includes(step.numero)
                    ? "done"
                    : index === etapaAtual
                      ? "current"
                      : "pending";
                  return (
                    <button
                      key={step.numero}
                      type="button"
                      onClick={() => {
                        if (executionStatus === "concluida") return;
                        setEtapaAtual(index);
                      }}
                      className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition-colors ${
                        status === "done"
                          ? "border-primary bg-primary text-primary-foreground"
                          : status === "current"
                            ? "border-primary bg-primary/15 text-primary"
                            : "border-border text-muted-foreground"
                      }`}
                    >
                      {status === "done" ? <Check className="h-3.5 w-3.5" /> : step.numero}
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
              <Button size="icon" variant="secondary" className="h-9 w-9" onClick={() => setAudioAberto((prev) => (prev ? { ...prev, tocando: !prev.tocando } : prev))}>
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

      {/* TODO(Lovable): registrar tracking por etapa (início, conclusão e tempo gasto) ao integrar com backend. */}
      {/* TODO(Lovable): atualizar status da execução entre em_andamento e concluida no fechamento da última etapa. */}
    </SidebarProvider>
  );
}

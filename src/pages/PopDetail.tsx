import { Building2, Clock3, FileAudio2, FileImage, FileText, Film, GitBranch, ListChecks, Lock, PlayCircle, Share2 } from "lucide-react";
import type { ReactNode } from "react";

import { AppLayout } from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type PopStatus = "rascunho" | "revisão" | "publicado";
type PopVisibility = "privado" | "empresa";
type MediaType = "imagem" | "audio" | "video" | "documento";

interface PopMedia {
  id: string;
  nome: string;
  tipo: MediaType;
}

interface PopStep {
  numero: number;
  titulo: string;
  descricao: string;
  tempoEstimado: string;
  preRequisito: string;
  resultadoEsperado: string;
  erroComum: string;
  checklist: string[];
  midias: PopMedia[];
}

// MOCK: dados temporários usados apenas para montar a interface.
// TODO(Lovable): substituir por dados reais do banco quando a estrutura estiver criada.
const popMock = {
  id: "pop-001",
  empresaId: "empresa-001",
  titulo: "Abertura de loja",
  departamento: "Operações",
  responsavel: "Ana Lima",
  visibilidade: "empresa" as PopVisibility,
  status: "publicado" as PopStatus,
  versaoAtual: "v2.3",
  tempoTotal: "35 min",
  totalMidias: 6,
  complexidade: "Média",
  risco: "Moderado",
  etapas: [
    {
      numero: 1,
      titulo: "Conferir acesso e equipamentos",
      descricao: "Antes de continuar, veja @midia1 e ouça @midia2 para revisar orientações de segurança.",
      tempoEstimado: "8 min",
      preRequisito: "Chaves em mãos e alarme desativado.",
      resultadoEsperado: "Ambiente pronto para início das operações.",
      erroComum: "Iniciar sem checar falhas de energia na entrada.",
      checklist: ["Verificar luzes externas", "Validar painel de alarme", "Confirmar internet ativa"],
      midias: [
        { id: "midia1", nome: "Checklist visual da entrada", tipo: "imagem" as MediaType },
        { id: "midia2", nome: "Áudio com sequência segura", tipo: "audio" as MediaType },
      ],
    },
    {
      numero: 2,
      titulo: "Preparar caixa e sistema",
      descricao: "Revise @midia3 antes de abrir o caixa e use @midia4 caso haja dúvida no lançamento inicial.",
      tempoEstimado: "12 min",
      preRequisito: "Equipamentos ligados e usuário autenticado.",
      resultadoEsperado: "Caixa aberto e sistema sincronizado.",
      erroComum: "Pular conferência de saldo inicial.",
      checklist: ["Conferir fundo de caixa", "Validar impressora fiscal", "Executar teste de venda"],
      midias: [
        { id: "midia3", nome: "Vídeo de abertura do caixa", tipo: "video" as MediaType },
        { id: "midia4", nome: "Manual rápido de lançamento", tipo: "documento" as MediaType },
      ],
    },
    {
      numero: 3,
      titulo: "Finalizar checklist de abertura",
      descricao: "Registre evidências com @midia5 e consulte @midia6 para padrão final de organização.",
      tempoEstimado: "15 min",
      preRequisito: "Etapas anteriores concluídas sem pendências.",
      resultadoEsperado: "Loja apta para atendimento ao público.",
      erroComum: "Não registrar exceções identificadas no turno.",
      checklist: ["Validar limpeza da área de atendimento", "Atualizar quadro de metas", "Assinar termo de conferência"],
      midias: [
        { id: "midia5", nome: "Modelo de foto da vitrine", tipo: "imagem" as MediaType },
        { id: "midia6", nome: "Guia de organização da operação", tipo: "documento" as MediaType },
      ],
    },
  ] as PopStep[],
  atividades: [
    "Versão v2.3 publicada em 29/04/2026",
    "Revisão aprovada por Juliana Rocha em 25/04/2026",
    "Versão v2.1 arquivada em 20/04/2026",
  ],
};

const statusLabel: Record<PopStatus, string> = {
  rascunho: "Rascunho",
  revisão: "Em revisão",
  publicado: "Publicado",
};

const statusClass: Record<PopStatus, string> = {
  rascunho: "bg-muted text-muted-foreground",
  revisão: "bg-amber-500 text-white",
  publicado: "bg-emerald-600 text-white",
};

const visibilityLabel: Record<PopVisibility, string> = {
  privado: "Privado",
  empresa: "Empresa",
};



const mediaIconByType: Record<MediaType, ReactNode> = {
  imagem: <FileImage className="h-3 w-3" />,
  audio: <FileAudio2 className="h-3 w-3" />,
  video: <Film className="h-3 w-3" />,
  documento: <FileText className="h-3 w-3" />,
};

const PopDetail = () => {
  // TODO(Lovable): aplicar permissões por role para controlar ações editar/execução/histórico/compartilhar.
  const handleEditPop = () => {
    // TODO(Lovable): navegar para /pops/:id/editar quando o roteamento real estiver conectado.
    console.log("Editar POP", popMock.id);
  };
  const handleStartExecution = () => {
    // TODO(Lovable): permitir iniciar execução apenas quando status for publicado.
    // TODO(Lovable): iniciar execução futura com pop_versao_id congelado.
    if (popMock.status !== "publicado") return;
    console.log("Iniciar execução", popMock.id);
  };
  const handleViewHistory = () => console.log("Ver histórico", popMock.id);
  const handleSharePop = () => console.log("Compartilhar POP", popMock.id);
  const handleOpenMedia = (midiaId: string) => {
    // TODO(Lovable): abrir mídia real em modal/lightbox ou mini-player conforme tipo.
    console.log("Abrir mídia", midiaId);
  };

  const renderInlineDescription = (descricao: string, step: PopStep) => {
    // TODO(Lovable): manter parser regex para referências @midiaX mesmo com pontuação no texto livre.
    const matches = [...descricao.matchAll(/@midia\d+/g)];
    if (matches.length === 0) return descricao;

    const pieces: ReactNode[] = [];
    let cursor = 0;

    matches.forEach((match, index) => {
      const token = match[0];
      const start = match.index ?? 0;
      const end = start + token.length;

      if (start > cursor) pieces.push(descricao.slice(cursor, start));

      const media = step.midias.find((item) => `@${item.id}` === token);
      if (!media) {
        pieces.push(token);
      } else {
        pieces.push(
          <button
            key={`${token}-${index}`}
            type="button"
            onClick={() => handleOpenMedia(media.id)}
            className="mx-0.5 inline-flex cursor-pointer items-center gap-1 rounded-full border border-primary/30 bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            {mediaIconByType[media.tipo]}
            {token}
          </button>,
        );
      }

      cursor = end;
    });

    if (cursor < descricao.length) pieces.push(descricao.slice(cursor));

    return pieces;
  };

  return (
    <AppLayout title="Detalhe do POP">
      <div className="mx-auto w-full max-w-7xl space-y-5">
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">POPs / {popMock.departamento} / {popMock.titulo}</p>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex gap-2">
                <Badge className={statusClass[popMock.status]}>{statusLabel[popMock.status]}</Badge>
                <Badge variant="outline" className="gap-1">{popMock.visibilidade === "privado" ? <Lock className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}{visibilityLabel[popMock.visibilidade]}</Badge>
              </div>
              <h1 className="text-2xl font-semibold">{popMock.titulo}</h1>
              <p className="text-sm text-muted-foreground">{popMock.departamento} • Versão atual {popMock.versaoAtual}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleSharePop}><Share2 className="mr-2 h-4 w-4" />Compartilhar</Button>
              <Button variant="outline" onClick={handleViewHistory}><GitBranch className="mr-2 h-4 w-4" />Histórico</Button>
              <Button variant="outline" onClick={handleEditPop}>Editar</Button>
              <Button onClick={handleStartExecution}><PlayCircle className="mr-2 h-4 w-4" />Iniciar Execução</Button>
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {[
            ["Responsável", popMock.responsavel],
            ["Tempo estimado", popMock.tempoTotal],
            ["Departamento", popMock.departamento],
            ["Versão", popMock.versaoAtual],
            ["Etapas", String(popMock.etapas.length)],
            ["Mídias", String(popMock.totalMidias)],
          ].map(([label, value]) => (
            <Card key={label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="font-semibold">{value}</p></CardContent></Card>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
          <section className="space-y-3">
            {popMock.etapas.map((etapa) => (
              <Card key={etapa.numero}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-lg font-semibold">Etapa {etapa.numero} — {etapa.titulo}</CardTitle>
                    <Badge variant="secondary" className="text-xs">{etapa.tempoEstimado}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    {renderInlineDescription(etapa.descricao, etapa)}
                  </p>
                  <div className="grid gap-2 md:grid-cols-3">
                    <div className="rounded-md border bg-muted/30 p-2">
                      <p className="text-xs font-medium text-muted-foreground">Pré-requisito</p>
                      <p>{etapa.preRequisito}</p>
                    </div>
                    <div className="rounded-md border bg-emerald-50/40 p-2">
                      <p className="text-xs font-medium text-muted-foreground">Resultado esperado</p>
                      <p>{etapa.resultadoEsperado}</p>
                    </div>
                    <div className="rounded-md border bg-amber-50/40 p-2">
                      <p className="text-xs font-medium text-muted-foreground">Erro comum</p>
                      <p>{etapa.erroComum}</p>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="mb-1 font-medium">Checklist</p>
                    <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">
                      {etapa.checklist.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-1 font-medium">Mídias vinculadas</p>
                    <div className="flex flex-wrap gap-2">
                      {etapa.midias.map((midia) => (
                        <Button key={midia.id} size="sm" variant="secondary" onClick={() => handleOpenMedia(midia.id)}>
                          {midia.tipo === "imagem" && <FileImage className="mr-1 h-3.5 w-3.5" />}
                          {midia.tipo === "audio" && <FileAudio2 className="mr-1 h-3.5 w-3.5" />}
                          {midia.tipo === "video" && <Film className="mr-1 h-3.5 w-3.5" />}
                          {midia.tipo === "documento" && <FileText className="mr-1 h-3.5 w-3.5" />}
                          {midia.nome}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>

          <aside className="space-y-3">
            <Card>
              <CardHeader><CardTitle className="text-sm">Resumo Operacional</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>Complexidade: <strong>{popMock.complexidade}</strong></p>
                <p>Nível de risco: <strong>{popMock.risco}</strong></p>
                <p>Tempo total: <strong>{popMock.tempoTotal}</strong></p>
                <p>Número de etapas: <strong>{popMock.etapas.length}</strong></p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Últimas Atividades</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {popMock.atividades.map((item) => <li key={item} className="flex items-start gap-2"><Clock3 className="mt-0.5 h-3.5 w-3.5" />{item}</li>)}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Observação</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <p>Dados de demonstração — serão conectados ao banco posteriormente pelo Lovable.</p>
                <p>Esta tela usa dados mockados. A integração real com banco, permissões, empresa_id, versionamento e mídias será feita posteriormente pelo Lovable.</p>
                <p className="flex gap-1"><ListChecks className="h-4 w-4" />Regras PRD consideradas: visibilidade privado/empresa, status rascunho/revisão/publicado, e edição de publicado criando nova versão.</p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>

      {/* TODO(Lovable): garantir empresa_id obrigatório em todas entidades ao integrar backend multi-tenant. */}
      {/* TODO(Lovable): edição de POP publicado deve criar nova versão; execuções devem congelar pop_versao_id. */}
      {/* TODO(Lovable): referência inline de mídias segue padrão @midiaX conforme PRD. */}
    </AppLayout>
  );
};

export default PopDetail;

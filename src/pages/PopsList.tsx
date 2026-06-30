import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  Building2,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Ellipsis,
  FileText,
  Lock,
  PlayCircle,
  Plus,
  Search,
  Shield,
  Tag,
  UserRound,
} from "lucide-react";

import { AppLayout } from "@/components/AppLayout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  usePops,
  useDeletePop,
  usePopDeleteImpact,
  type PopStatus,
  type PopVisibilidade,
} from "@/hooks/usePops";
import { useDepartamentos } from "@/hooks/useDepartamentos";
import { useAuth } from "@/hooks/useAuth";

const statusLabel: Record<PopStatus, string> = {
  rascunho: "Rascunho",
  revisao: "Em revisão",
  publicado: "Publicado",
};

const statusClass: Record<PopStatus, string> = {
  rascunho: "bg-muted text-muted-foreground border-transparent",
  revisao:
    "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] border-transparent",
  publicado:
    "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-transparent",
};

const statusSummaryClass: Record<PopStatus, string> = {
  rascunho: "bg-muted text-muted-foreground",
  revisao: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]",
  publicado: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]",
};

const formatUpdatedAt = (iso?: string | null) => {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const isPopStatus = (value: string | null): value is PopStatus =>
  value === "rascunho" || value === "revisao" || value === "publicado";

const friendlyDeleteError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  if (
    message.includes("violates foreign key constraint") ||
    message.includes("execucao_etapas_etapa_id_fkey")
  ) {
    return "Não foi possível concluir a ação porque este POP possui histórico operacional. Tente novamente para arquivá-lo com segurança.";
  }
  return message || "Não foi possível excluir ou arquivar o POP.";
};

const PopsList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: pops = [], isLoading, isError, error: popsError } = usePops();
  const { user } = useAuth();
  const deletePop = useDeletePop();
  const { data: departamentosCadastrados = [] } = useDepartamentos();

  const statusParam = searchParams.get("status");
  const acaoParam = searchParams.get("acao");
  const statusFiltroInicial = isPopStatus(statusParam) ? statusParam : "todos";
  const mostrarContextoExecucao = acaoParam === "executar";

  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<"todos" | PopStatus>(
    statusFiltroInicial,
  );
  const [departamentoFiltro, setDepartamentoFiltro] = useState("todos");
  const [criadorFiltro, setCriadorFiltro] = useState("todos");
  const [visibilidadeFiltro, setVisibilidadeFiltro] = useState<
    "todas" | PopVisibilidade
  >("todas");
  const [page] = useState(1);
  const [pageSize] = useState(20);
  const [popToDeleteId, setPopToDeleteId] = useState<string | null>(null);

  const popToDelete = useMemo(
    () => pops.find((pop) => pop.id === popToDeleteId) ?? null,
    [pops, popToDeleteId],
  );
  const deleteImpact = usePopDeleteImpact(popToDeleteId);

  const departamentos = useMemo(() => ["todos", ...departamentosCadastrados], [departamentosCadastrados]);

  const criadores = useMemo(() => {
    const byId = new Map<string, { id: string; nome: string; email: string }>();
    for (const pop of pops) {
      if (!pop.owner_id || byId.has(pop.owner_id)) continue;
      byId.set(pop.owner_id, {
        id: pop.owner_id,
        nome: pop.owner?.nome ?? "",
        email: pop.owner?.email ?? "",
      });
    }
    return Array.from(byId.values()).sort((a, b) =>
      (a.nome || a.email || a.id).localeCompare(b.nome || b.email || b.id),
    );
  }, [pops]);

  const criadorLabel = (pop: { owner?: { nome: string; email: string } | null }) =>
    pop.owner?.nome?.trim() || pop.owner?.email?.trim() || "Criador não identificado";

  const popsFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return pops.filter((pop) => {
      const status = pop.versao_ativa?.status ?? "rascunho";
      const bateBusca =
        termo.length === 0 ||
        pop.titulo.toLowerCase().includes(termo) ||
        (pop.departamento_ref?.nome ?? pop.departamento).toLowerCase().includes(termo) ||
        pop.responsavel.toLowerCase().includes(termo);
      const bateStatus = statusFiltro === "todos" || status === statusFiltro;
      const bateDepartamento =
        departamentoFiltro === "todos" ||
        pop.departamento_id === departamentoFiltro;
      const bateCriador =
        criadorFiltro === "todos" ||
        (criadorFiltro === "meus" ? pop.owner_id === user?.id : pop.owner_id === criadorFiltro);
      const bateVisibilidade =
        visibilidadeFiltro === "todas" ||
        pop.visibilidade === visibilidadeFiltro;
      return bateBusca && bateStatus && bateDepartamento && bateCriador && bateVisibilidade;
    });
  }, [pops, busca, statusFiltro, departamentoFiltro, criadorFiltro, visibilidadeFiltro, user?.id]);
  const popSummary = useMemo(() => {
    return pops.reduce(
      (summary, pop) => {
        const status = pop.versao_ativa?.status ?? "rascunho";
        summary.total += 1;
        summary[status] += 1;
        return summary;
      },
      { total: 0, publicado: 0, rascunho: 0, revisao: 0 } as Record<
        "total" | PopStatus,
        number
      >,
    );
  }, [pops]);

  useEffect(() => {
    // Query string vinda das ações rápidas aplica o contexto inicial da listagem de POPs.
    setStatusFiltro(isPopStatus(statusParam) ? statusParam : "todos");
  }, [statusParam]);
  useEffect(() => {
    if (!popsError) return;
    // Diagnóstico temporário: mantém a mensagem amigável na UI e expõe o erro real da query no console.
    console.error("Falha ao carregar POPs", popsError);
  }, [popsError]);


  const limparFiltros = () => {
    setBusca("");
    setStatusFiltro("todos");
    setDepartamentoFiltro("todos");
    setCriadorFiltro("todos");
    setVisibilidadeFiltro("todas");
    // Remove query strings das ações rápidas para manter a listagem em estado neutro.
    navigate("/pops", { replace: true });
  };

  const confirmDelete = async () => {
    if (!popToDeleteId) return;
    try {
      const result = await deletePop.mutateAsync(popToDeleteId);
      if (result === "archived") {
        toast.success(
          "Este POP possui histórico de execução e não pode ser excluído definitivamente. Ele foi arquivado para preservar a rastreabilidade.",
        );
      } else {
        toast.success("POP excluído definitivamente.");
      }
      setPopToDeleteId(null);
    } catch (err) {
      toast.error(friendlyDeleteError(err));
    }
  };

  return (
    <AppLayout title="POPs">
      <div className="mx-auto w-full max-w-7xl space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">POPs</h1>
          <Button onClick={() => navigate("/pops/novo")}>
            <Plus className="mr-2 h-4 w-4" />
            Criar POP
          </Button>
        </header>

        {mostrarContextoExecucao && (
          <Card className="border-border/70 shadow-sm">
            <CardContent className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
              <PlayCircle className="h-4 w-4 text-primary" />
              Selecione um POP na lista para abrir os detalhes e iniciar a execução quando disponível.
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="px-8 pb-8 pt-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-foreground">
                Filtrar por:
              </h2>
              <Button variant="ghost" size="sm" onClick={limparFiltros}>
                Limpar filtros
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Search className="h-3.5 w-3.5" />
                  Busca
                </Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="pl-9"
                    placeholder="Buscar POPs..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Tag className="h-3.5 w-3.5" />
                  Status
                </Label>
                <Select
                  value={statusFiltro}
                  onValueChange={(v) =>
                    setStatusFiltro(v as "todos" | PopStatus)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os status</SelectItem>
                    <SelectItem value="rascunho">Rascunho</SelectItem>
                    <SelectItem value="revisao">Em revisão</SelectItem>
                    <SelectItem value="publicado">Publicado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" />
                  Departamento
                </Label>
                <Select
                  value={departamentoFiltro}
                  onValueChange={setDepartamentoFiltro}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {departamentos.map((departamento) => (
                      <SelectItem key={departamento === "todos" ? departamento : departamento.id} value={departamento === "todos" ? departamento : departamento.id}>
                        {departamento === "todos" ? "Todos os departamentos" : departamento.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <UserRound className="h-3.5 w-3.5" />
                  Criador
                </Label>
                <Select
                  value={criadorFiltro}
                  onValueChange={setCriadorFiltro}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Criador" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os criadores</SelectItem>
                    <SelectItem value="meus">Meus POPs</SelectItem>
                    {criadores.map((criador) => (
                      <SelectItem key={criador.id} value={criador.id}>
                        {criador.nome || criador.email || "Criador não identificado"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="h-3.5 w-3.5" />
                  Visibilidade
                </Label>
                <Select
                  value={visibilidadeFiltro}
                  onValueChange={(v) =>
                    setVisibilidadeFiltro(v as "todas" | PopVisibilidade)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Visibilidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">
                      Todas as visibilidades
                    </SelectItem>
                    <SelectItem value="privado">🔒 Privado</SelectItem>
                    <SelectItem value="empresa">🏢 Empresa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <section
          aria-label="Resumo dos POPs"
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        >
          <Card className="border-border/70 shadow-sm">
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Total de POPs
                </p>
                <p className="text-2xl font-semibold text-foreground">
                  {popSummary.total}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <FileText className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/70 shadow-sm">
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Publicados
                </p>
                <p className="text-2xl font-semibold text-foreground">
                  {popSummary.publicado}
                </p>
              </div>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${statusSummaryClass.publicado}`}
              >
                <ClipboardCheck className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/70 shadow-sm">
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Rascunhos
                </p>
                <p className="text-2xl font-semibold text-foreground">
                  {popSummary.rascunho}
                </p>
              </div>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${statusSummaryClass.rascunho}`}
              >
                <FileText className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/70 shadow-sm">
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Em revisão
                </p>
                <p className="text-2xl font-semibold text-foreground">
                  {popSummary.revisao}
                </p>
              </div>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${statusSummaryClass.revisao}`}
              >
                <Tag className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-3">
          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="mb-2 h-4 w-1/3" />
                    <Skeleton className="h-3 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {isError && (
            <Card>
              <CardContent className="flex items-center gap-2 p-6 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                Não foi possível carregar os POPs.
              </CardContent>
            </Card>
          )}

          {!isLoading && !isError && popsFiltrados.length === 0 && (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">
                Nenhum POP encontrado.
              </CardContent>
            </Card>
          )}

          {!isLoading &&
            !isError &&
            popsFiltrados.map((pop) => {
              const status = pop.versao_ativa?.status ?? "rascunho";
              const updatedAt = formatUpdatedAt(pop.updated_at);
              const primaryActionLabel =
                status === "rascunho" ? "Editar" : "Abrir";
              const primaryActionPath =
                status === "rascunho"
                  ? `/pops/${pop.id}/editar`
                  : `/pops/${pop.id}`;

              return (
                <Card
                  key={pop.id}
                  className="border-border/70 bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <CardContent className="p-0">
                    {/* Card compacto com hierarquia visual reforçada sem alterar rotas, filtros ou regras de negócio. */}
                    <div
                      className="flex cursor-pointer flex-col gap-4 rounded-lg p-4 focus-within:ring-2 focus-within:ring-ring md:flex-row md:items-center md:justify-between md:p-5"
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/pops/${pop.id}`)}
                      onKeyDown={(e) => {
                        // Evita que atalhos acionados em botões internos disparem a navegação do card.
                        if (e.target !== e.currentTarget) return;
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          navigate(`/pops/${pop.id}`);
                        }
                      }}
                    >
                      <div className="flex min-w-0 flex-1 items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="space-y-1">
                            <h2 className="truncate text-base font-semibold text-foreground md:text-lg">
                              {pop.titulo}
                            </h2>
                            {pop.descricao && (
                              <p className="line-clamp-2 text-sm leading-5 text-muted-foreground">
                                {pop.descricao}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5">
                              <Building2 className="h-3.5 w-3.5" />
                              {(pop.departamento_ref?.nome ?? pop.departamento) || "Sem departamento"}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <UserRound className="h-3.5 w-3.5" />
                              Responsável: {pop.responsavel || "Sem responsável"}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <UserRound className="h-3.5 w-3.5" />
                              Criado por: {criadorLabel(pop)}
                            </span>
                            {pop.versao_ativa?.numero && (
                              <span className="inline-flex items-center gap-1.5">
                                <Tag className="h-3.5 w-3.5" />
                                Versão {pop.versao_ativa.numero}
                              </span>
                            )}
                            {updatedAt && (
                              <span className="inline-flex items-center gap-1.5">
                                <CalendarClock className="h-3.5 w-3.5" />
                                Atualizado em {updatedAt}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 md:justify-end">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant="outline"
                            className={statusClass[status]}
                          >
                            {statusLabel[status]}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="gap-1 border-border/70 bg-background text-muted-foreground"
                          >
                            {pop.visibilidade === "privado" ? (
                              <Lock className="h-3 w-3" />
                            ) : (
                              <Building2 className="h-3 w-3 text-primary" />
                            )}
                            {pop.visibilidade === "privado"
                              ? "Privado"
                              : "Empresa"}
                          </Badge>
                        </div>

                        <Button
                          type="button"
                          size="sm"
                          variant={
                            status === "rascunho" ? "outline" : "default"
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(primaryActionPath);
                          }}
                        >
                          {primaryActionLabel}
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label="Ações"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Ellipsis className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DropdownMenuItem
                              onClick={() => navigate(`/pops/${pop.id}`)}
                            >
                              Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => navigate(`/pops/${pop.id}/editar`)}
                            >
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setPopToDeleteId(pop.id)}
                            >
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

          {!isLoading && !isError && popsFiltrados.length > 0 && (
            <Card>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-3 text-sm">
                <span className="text-muted-foreground">
                  Mostrando {popsFiltrados.length} POPs
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled>
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Anterior
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Página {page} • {pageSize} por página
                  </span>
                  <Button variant="outline" size="sm" disabled>
                    Próximo
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </section>
      </div>

      {/* Confirmação explícita: exclui definitivamente POPs sem histórico e arquiva POPs já executados. */}
      <AlertDialog
        open={!!popToDeleteId}
        onOpenChange={(open) => !open && setPopToDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteImpact.isLoading
                ? "Verificando histórico do POP..."
                : deleteImpact.data?.hasExecutions
                  ? "Arquivar POP?"
                  : "Excluir POP definitivamente?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteImpact.isLoading
                ? "Verificando se este POP possui histórico de execução antes de confirmar a ação."
                : deleteImpact.data?.hasExecutions
                  ? `O POP “${popToDelete?.titulo ?? "selecionado"}” possui histórico de execução. Ele será arquivado e removido da listagem principal, preservando versões, etapas e execuções para auditoria.`
                  : `O POP “${popToDelete?.titulo ?? "selecionado"}” ainda não possui execuções vinculadas. Esta ação excluirá definitivamente o POP e suas dependências versionadas.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePop.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className={
                deleteImpact.data?.hasExecutions
                  ? undefined
                  : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              }
              disabled={deleteImpact.isLoading || deletePop.isPending}
              onClick={(event) => {
                event.preventDefault();
                void confirmDelete();
              }}
            >
              {deletePop.isPending
                ? "Processando..."
                : deleteImpact.data?.hasExecutions
                  ? "Arquivar POP"
                  : "Excluir definitivamente"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default PopsList;

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Building2,
  ChevronLeft,
  ChevronRight,
  Ellipsis,
  Lock,
  Plus,
  Search,
  Shield,
  Tag,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { usePops, useDeletePop, usePopDeleteImpact, type PopStatus, type PopVisibilidade } from "@/hooks/usePops";

const statusLabel: Record<PopStatus, string> = {
  rascunho: "Rascunho",
  revisao: "Em revisão",
  publicado: "Publicado",
};

const statusClass: Record<PopStatus, string> = {
  rascunho: "bg-muted text-muted-foreground border-transparent",
  revisao: "bg-amber-500 text-white border-transparent",
  publicado: "bg-emerald-600 text-white border-transparent",
};

const friendlyDeleteError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("violates foreign key constraint") || message.includes("execucao_etapas_etapa_id_fkey")) {
    return "Não foi possível concluir a ação porque este POP possui histórico operacional. Tente novamente para arquivá-lo com segurança.";
  }
  return message || "Não foi possível excluir ou arquivar o POP.";
};

const PopsList = () => {
  const navigate = useNavigate();
  const { data: pops = [], isLoading, isError } = usePops();
  const deletePop = useDeletePop();

  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<"todos" | PopStatus>("todos");
  const [departamentoFiltro, setDepartamentoFiltro] = useState("todos");
  const [visibilidadeFiltro, setVisibilidadeFiltro] = useState<"todas" | PopVisibilidade>("todas");
  const [page] = useState(1);
  const [pageSize] = useState(20);
  const [popToDeleteId, setPopToDeleteId] = useState<string | null>(null);

  const popToDelete = useMemo(() => pops.find((pop) => pop.id === popToDeleteId) ?? null, [pops, popToDeleteId]);
  const deleteImpact = usePopDeleteImpact(popToDeleteId);

  const departamentos = useMemo(
    () => ["todos", ...Array.from(new Set(pops.map((p) => p.departamento).filter(Boolean)))],
    [pops],
  );

  const popsFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return pops.filter((pop) => {
      const status = pop.versao_ativa?.status ?? "rascunho";
      const bateBusca =
        termo.length === 0 ||
        pop.titulo.toLowerCase().includes(termo) ||
        pop.departamento.toLowerCase().includes(termo) ||
        pop.responsavel.toLowerCase().includes(termo);
      const bateStatus = statusFiltro === "todos" || status === statusFiltro;
      const bateDepartamento = departamentoFiltro === "todos" || pop.departamento === departamentoFiltro;
      const bateVisibilidade = visibilidadeFiltro === "todas" || pop.visibilidade === visibilidadeFiltro;
      return bateBusca && bateStatus && bateDepartamento && bateVisibilidade;
    });
  }, [pops, busca, statusFiltro, departamentoFiltro, visibilidadeFiltro]);

  const limparFiltros = () => {
    setBusca("");
    setStatusFiltro("todos");
    setDepartamentoFiltro("todos");
    setVisibilidadeFiltro("todas");
  };

  const confirmDelete = async () => {
    if (!popToDeleteId) return;
    try {
      const result = await deletePop.mutateAsync(popToDeleteId);
      if (result === "archived") {
        toast.success("Este POP possui histórico de execução e não pode ser excluído definitivamente. Ele foi arquivado para preservar a rastreabilidade.");
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

        <Card>
          <CardContent className="px-8 pb-8 pt-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-foreground">Filtrar por:</h2>
              <Button variant="ghost" size="sm" onClick={limparFiltros}>Limpar filtros</Button>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs text-muted-foreground"><Search className="h-3.5 w-3.5" />Busca</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-9" placeholder="Buscar POPs..." />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs text-muted-foreground"><Tag className="h-3.5 w-3.5" />Status</Label>
                <Select value={statusFiltro} onValueChange={(v) => setStatusFiltro(v as "todos" | PopStatus)}>
                  <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os status</SelectItem>
                    <SelectItem value="rascunho">Rascunho</SelectItem>
                    <SelectItem value="revisao">Em revisão</SelectItem>
                    <SelectItem value="publicado">Publicado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs text-muted-foreground"><Building2 className="h-3.5 w-3.5" />Departamento</Label>
                <Select value={departamentoFiltro} onValueChange={setDepartamentoFiltro}>
                  <SelectTrigger><SelectValue placeholder="Departamento" /></SelectTrigger>
                  <SelectContent>
                    {departamentos.map((d) => (
                      <SelectItem key={d} value={d}>{d === "todos" ? "Todos os departamentos" : d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs text-muted-foreground"><Shield className="h-3.5 w-3.5" />Visibilidade</Label>
                <Select value={visibilidadeFiltro} onValueChange={(v) => setVisibilidadeFiltro(v as "todas" | PopVisibilidade)}>
                  <SelectTrigger><SelectValue placeholder="Visibilidade" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as visibilidades</SelectItem>
                    <SelectItem value="privado">🔒 Privado</SelectItem>
                    <SelectItem value="empresa">🏢 Empresa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <section className="space-y-2">
          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}><CardContent className="p-4"><Skeleton className="mb-2 h-4 w-1/3" /><Skeleton className="h-3 w-2/3" /></CardContent></Card>
              ))}
            </div>
          )}

          {isError && (
            <Card><CardContent className="flex items-center gap-2 p-6 text-sm text-destructive"><AlertCircle className="h-4 w-4" />Não foi possível carregar os POPs.</CardContent></Card>
          )}

          {!isLoading && !isError && popsFiltrados.length === 0 && (
            <Card><CardContent className="p-6 text-sm text-muted-foreground">Nenhum POP encontrado.</CardContent></Card>
          )}

          {!isLoading && !isError && popsFiltrados.map((pop) => {
            const status = pop.versao_ativa?.status ?? "rascunho";
            return (
              <Card key={pop.id}>
                <CardContent className="p-0">
                  <div
                    className="flex items-center justify-between gap-3 rounded-lg px-4 py-3.5 transition-colors hover:bg-accent/70 cursor-pointer focus-within:ring-2 focus-within:ring-ring"
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/pops/${pop.id}`)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigate(`/pops/${pop.id}`); } }}
                  >
                    <div className="min-w-0 space-y-1">
                      <h2 className="truncate text-base font-semibold text-foreground">{pop.titulo}</h2>
                      <p className="text-xs text-muted-foreground">{pop.departamento || "—"} • Responsável: {pop.responsavel || "—"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={statusClass[status]}>{statusLabel[status]}</Badge>
                      <Badge variant="outline" className="gap-1">{pop.visibilidade === "privado" ? <Lock className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}{pop.visibilidade === "privado" ? "Privado" : "Empresa"}</Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label="Ações" onClick={(e) => e.stopPropagation()}>
                            <Ellipsis className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem onClick={() => navigate(`/pops/${pop.id}`)}>Visualizar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/pops/${pop.id}/editar`)}>Editar</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setPopToDeleteId(pop.id)}>Excluir</DropdownMenuItem>
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
                <span className="text-muted-foreground">Mostrando {popsFiltrados.length} POPs</span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled><ChevronLeft className="mr-1 h-4 w-4" />Anterior</Button>
                  <span className="text-xs text-muted-foreground">Página {page} • {pageSize} por página</span>
                  <Button variant="outline" size="sm" disabled>Próximo<ChevronRight className="ml-1 h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          )}
        </section>
      </div>

      {/* Confirmação explícita: exclui definitivamente POPs sem histórico e arquiva POPs já executados. */}
      <AlertDialog open={!!popToDeleteId} onOpenChange={(open) => !open && setPopToDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteImpact.isLoading ? "Verificando histórico do POP..." : deleteImpact.data?.hasExecutions ? "Arquivar POP?" : "Excluir POP definitivamente?"}
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
            <AlertDialogCancel disabled={deletePop.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className={deleteImpact.data?.hasExecutions ? undefined : "bg-destructive text-destructive-foreground hover:bg-destructive/90"}
              disabled={deleteImpact.isLoading || deletePop.isPending}
              onClick={(event) => {
                event.preventDefault();
                void confirmDelete();
              }}
            >
              {deletePop.isPending ? "Processando..." : deleteImpact.data?.hasExecutions ? "Arquivar POP" : "Excluir definitivamente"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default PopsList;

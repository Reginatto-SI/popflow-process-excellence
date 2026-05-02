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

type PopStatus = "rascunho" | "revisão" | "publicado";
type PopVisibilidade = "privado" | "empresa";

interface PopItem {
  id: string;
  titulo: string;
  departamento: string;
  responsavel: string;
  status: PopStatus;
  visibilidade: PopVisibilidade;
}

const popsMock: PopItem[] = [
  { id: "1", titulo: "Abertura de loja", departamento: "Operações", responsavel: "Ana Lima", status: "publicado", visibilidade: "empresa" },
  { id: "2", titulo: "Checklist de fechamento", departamento: "Operações", responsavel: "Carlos Santos", status: "revisão", visibilidade: "empresa" },
  { id: "3", titulo: "Solicitação de compras urgentes", departamento: "Suprimentos", responsavel: "Juliana Rocha", status: "rascunho", visibilidade: "privado" },
  { id: "4", titulo: "Atendimento de não conformidade", departamento: "Qualidade", responsavel: "Bruno Alves", status: "publicado", visibilidade: "empresa" },
  { id: "5", titulo: "Onboarding de colaborador", departamento: "RH", responsavel: "Patrícia Gomes", status: "revisão", visibilidade: "privado" },
];

const statusLabel: Record<PopStatus, string> = {
  rascunho: "Rascunho",
  revisão: "Em revisão",
  publicado: "Publicado",
};

const statusClass: Record<PopStatus, string> = {
  rascunho: "bg-muted text-muted-foreground border-transparent",
  revisão: "bg-amber-500 text-white border-transparent",
  publicado: "bg-emerald-600 text-white border-transparent",
};

const PopsList = () => {
  const navigate = useNavigate();
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<"todos" | PopStatus>("todos");
  const [departamentoFiltro, setDepartamentoFiltro] = useState("todos");
  const [visibilidadeFiltro, setVisibilidadeFiltro] = useState<"todas" | PopVisibilidade>("todas");
  const [uiState] = useState<"ready" | "loading" | "error">("ready");
  const [page] = useState(1);
  const [pageSize] = useState(5);

  const departamentos = useMemo(() => ["todos", ...Array.from(new Set(popsMock.map((item) => item.departamento)))], []);

  const popsFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return popsMock.filter((pop) => {
      const bateBusca =
        termo.length === 0 ||
        pop.titulo.toLowerCase().includes(termo) ||
        pop.departamento.toLowerCase().includes(termo) ||
        pop.responsavel.toLowerCase().includes(termo);

      const bateStatus = statusFiltro === "todos" || pop.status === statusFiltro;
      const bateDepartamento = departamentoFiltro === "todos" || pop.departamento === departamentoFiltro;
      const bateVisibilidade = visibilidadeFiltro === "todas" || pop.visibilidade === visibilidadeFiltro;

      return bateBusca && bateStatus && bateDepartamento && bateVisibilidade;
    });
  }, [busca, statusFiltro, departamentoFiltro, visibilidadeFiltro]);

  const limparFiltros = () => {
    setBusca("");
    setStatusFiltro("todos");
    setDepartamentoFiltro("todos");
    setVisibilidadeFiltro("todas");
  };

  const handleNavigateToPop = (id: string) => {
    navigate(`/pops/${id}`);
  };

  const handlePopAction = (id: string, action: "visualizar" | "editar" | "excluir") => {
    // TODO(Lovable): aplicar permissões por role antes de executar ações sensíveis como editar/excluir.
    if (action === "visualizar") {
      handleNavigateToPop(id);
    }

    if (action === "editar") {
      navigate(`/pops/${id}/editar`);
    }
  };

  // TODO(Lovable): paginação real deve usar page/pageSize e totalCount retornados pelo backend.
  // TODO(Lovable): aplicar escopo por empresa_id (multi-tenant) nas consultas e nas regras de visibilidade por empresa.

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
                  <Input
                    value={busca}
                    onChange={(event) => setBusca(event.target.value)}
                    className="pl-9"
                    placeholder="Buscar POPs, etapas ou conteúdo..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs text-muted-foreground"><Tag className="h-3.5 w-3.5" />Status</Label>
                <Select value={statusFiltro} onValueChange={(value) => setStatusFiltro(value as "todos" | PopStatus)}>
                  <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os status</SelectItem>
                    <SelectItem value="rascunho">Rascunho</SelectItem>
                    <SelectItem value="revisão">Em revisão</SelectItem>
                    <SelectItem value="publicado">Publicado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs text-muted-foreground"><Building2 className="h-3.5 w-3.5" />Departamento</Label>
                <Select value={departamentoFiltro} onValueChange={setDepartamentoFiltro}>
                  <SelectTrigger><SelectValue placeholder="Departamento" /></SelectTrigger>
                  <SelectContent>
                    {departamentos.map((departamento) => (
                      <SelectItem key={departamento} value={departamento}>
                        {departamento === "todos" ? "Todos os departamentos" : departamento}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs text-muted-foreground"><Shield className="h-3.5 w-3.5" />Visibilidade</Label>
                <Select value={visibilidadeFiltro} onValueChange={(value) => setVisibilidadeFiltro(value as "todas" | PopVisibilidade)}>
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
          {uiState === "loading" && (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Card key={index}><CardContent className="p-4"><Skeleton className="mb-2 h-4 w-1/3" /><Skeleton className="h-3 w-2/3" /></CardContent></Card>
              ))}
            </div>
          )}

          {uiState === "error" && (
            <Card>
              <CardContent className="flex items-center gap-2 p-6 text-sm text-destructive"><AlertCircle className="h-4 w-4" />Não foi possível carregar os POPs. Tente novamente.</CardContent>
            </Card>
          )}

          {uiState === "ready" && popsFiltrados.length === 0 && (
            <Card><CardContent className="p-6 text-sm text-muted-foreground">Nenhum POP encontrado para os filtros aplicados.</CardContent></Card>
          )}

          {uiState === "ready" && popsFiltrados.length > 0 && popsFiltrados.map((pop) => (
            <Card key={pop.id}>
              <CardContent className="p-0">
                <div
                  className="flex items-center justify-between gap-3 rounded-lg px-4 py-3.5 transition-colors hover:bg-accent/70 cursor-pointer focus-within:ring-2 focus-within:ring-ring"
                  role="button"
                  tabIndex={0}
                  onClick={() => handleNavigateToPop(pop.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleNavigateToPop(pop.id);
                    }
                  }}
                >
                  <div className="min-w-0 space-y-1">
                    <h2 className="truncate text-base font-semibold text-foreground">{pop.titulo}</h2>
                    <p className="text-xs text-muted-foreground">{pop.departamento} • Responsável: {pop.responsavel}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusClass[pop.status]}>{statusLabel[pop.status]}</Badge>
                    <Badge variant="outline" className="gap-1">{pop.visibilidade === "privado" ? <Lock className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}{pop.visibilidade === "privado" ? "Privado" : "Empresa"}</Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label={`Ações do POP ${pop.titulo}`}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <Ellipsis className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
                        <DropdownMenuItem onClick={() => handlePopAction(pop.id, "visualizar")}>Visualizar</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePopAction(pop.id, "editar")}>Editar</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handlePopAction(pop.id, "excluir")}>Excluir</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {uiState === "ready" && popsFiltrados.length > 0 && (
            <Card>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-3 text-sm">
                <span className="text-muted-foreground">Mostrando {popsFiltrados.length} POPs</span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled>
                    <ChevronLeft className="mr-1 h-4 w-4" />Anterior
                  </Button>
                  <span className="text-xs text-muted-foreground">Página {page} • {pageSize} por página</span>
                  <Button variant="outline" size="sm">
                    Próximo<ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </AppLayout>
  );
};

export default PopsList;

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  BookOpen,
  Building2,
  CalendarClock,
  Edit,
  Eye,
  FileQuestion,
  FileText,
  Lock,
  Plus,
  Search,
  StickyNote,
  Tag,
  Trash2,
  UserRound,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import {
  useCreateKnowledgeContent,
  useDeleteKnowledgeContent,
  useKnowledgeContents,
  useUpdateKnowledgeContent,
  type KnowledgeContent,
  type KnowledgeContentInput,
  type KnowledgeStatus,
  type KnowledgeType,
  type KnowledgeVisibility,
} from "@/hooks/useBaseConhecimento";
import { usePops } from "@/hooks/usePops";
import { supabase } from "@/integrations/supabase/client";

const typeLabel: Record<KnowledgeType, string> = {
  artigo: "Artigo",
  duvida: "Dúvida",
  solucao_erro: "Solução de erro",
  anotacao: "Anotação",
};

const typeIcon: Record<KnowledgeType, typeof FileText> = {
  artigo: FileText,
  duvida: FileQuestion,
  solucao_erro: Wrench,
  anotacao: StickyNote,
};

const typeClass: Record<KnowledgeType, string> = {
  artigo: "bg-primary/10 text-primary border-transparent",
  duvida: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] border-transparent",
  solucao_erro: "bg-destructive/10 text-destructive border-transparent",
  anotacao: "bg-accent text-accent-foreground border-transparent",
};

const statusLabel: Record<KnowledgeStatus, string> = {
  rascunho: "Rascunho",
  revisao: "Em revisão",
  publicado: "Publicado",
  arquivado: "Arquivado",
  aberta: "Aberta",
  resolvida: "Resolvida",
};

const statusClass: Record<KnowledgeStatus, string> = {
  rascunho: "bg-muted text-muted-foreground border-transparent",
  revisao: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] border-transparent",
  publicado: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-transparent",
  arquivado: "bg-muted text-muted-foreground border-transparent",
  aberta: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] border-transparent",
  resolvida: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-transparent",
};

const statusByType: Record<KnowledgeType, KnowledgeStatus[]> = {
  artigo: ["rascunho", "revisao", "publicado", "arquivado"],
  duvida: ["aberta", "resolvida", "arquivado"],
  solucao_erro: ["rascunho", "publicado", "resolvida", "arquivado"],
  anotacao: ["rascunho", "publicado", "arquivado"],
};

const defaultStatusByType: Record<KnowledgeType, KnowledgeStatus> = {
  artigo: "rascunho",
  duvida: "aberta",
  solucao_erro: "rascunho",
  anotacao: "rascunho",
};

const statusFilterOptions: Array<"ativos" | KnowledgeStatus> = [
  "ativos",
  "rascunho",
  "revisao",
  "publicado",
  "aberta",
  "resolvida",
  "arquivado",
];

const emptyForm: KnowledgeContentInput = {
  tipo: "artigo",
  titulo: "",
  resumo: "",
  conteudo: "",
  pergunta: "",
  resposta: "",
  sistema_relacionado: "",
  erro_relacionado: "",
  causa: "",
  solucao: "",
  observacoes: "",
  categoria: "",
  departamento: "",
  tags: [],
  status: "rascunho",
  visibilidade: "empresa",
  responsavel_id: null,
  pop_id: null,
  etapa_id: null,
};

const formatDate = (iso?: string | null) => {
  if (!iso) return "Sem data";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Sem data";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const normalize = (value?: string | null) => (value ?? "").toLowerCase().trim();
const tagText = (tags: string[]) => tags.join(", ");
const parseTags = (value: string) => value.split(",").map((tag) => tag.trim()).filter(Boolean);

const FormFields = ({
  form,
  onChange,
  pops,
  usuarios,
}: {
  form: KnowledgeContentInput;
  onChange: (patch: Partial<KnowledgeContentInput>) => void;
  pops: { id: string; titulo: string }[];
  usuarios: { id: string; nome: string; email: string }[];
}) => {
  const compatibleStatuses = statusByType[form.tipo];

  return (
    <div className="grid max-h-[70vh] gap-4 overflow-y-auto pr-2 md:grid-cols-2">
    <div className="space-y-2 md:col-span-2">
      <Label>Título</Label>
      <Input value={form.titulo} onChange={(e) => onChange({ titulo: e.target.value })} placeholder="Ex.: Como registrar reembolso" />
    </div>

    <div className="space-y-2">
      <Label>Tipo</Label>
      <Select
        value={form.tipo}
        onValueChange={(value) => {
          const nextType = value as KnowledgeType;
          // Mantém apenas status compatíveis com o tipo selecionado; se incompatível, volta ao padrão do tipo.
          onChange({
            tipo: nextType,
            status: statusByType[nextType].includes(form.status) ? form.status : defaultStatusByType[nextType],
          });
        }}
      >
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="artigo">Artigo</SelectItem>
          <SelectItem value="duvida">Dúvida</SelectItem>
          <SelectItem value="solucao_erro">Solução de erro</SelectItem>
          <SelectItem value="anotacao">Anotação</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div className="space-y-2">
      <Label>Status</Label>
      <Select value={form.status} onValueChange={(value) => onChange({ status: value as KnowledgeStatus })}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {compatibleStatuses.map((status) => (
            <SelectItem key={status} value={status}>{statusLabel[status]}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    <div className="space-y-2">
      <Label>Visibilidade</Label>
      <Select value={form.visibilidade} onValueChange={(value) => onChange({ visibilidade: value as KnowledgeVisibility })}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="empresa">Empresa</SelectItem>
          <SelectItem value="privado">Privado</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div className="space-y-2">
      <Label>Responsável</Label>
      <Select value={form.responsavel_id ?? "sem_responsavel"} onValueChange={(value) => onChange({ responsavel_id: value === "sem_responsavel" ? null : value })}>
        <SelectTrigger><SelectValue placeholder="Responsável" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="sem_responsavel">Sem responsável</SelectItem>
          {usuarios.map((usuario) => (
            <SelectItem key={usuario.id} value={usuario.id}>{usuario.nome || usuario.email}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    <div className="space-y-2">
      <Label>Categoria</Label>
      <Input value={form.categoria} onChange={(e) => onChange({ categoria: e.target.value })} placeholder="Ex.: Operações" />
    </div>

    <div className="space-y-2">
      <Label>Departamento</Label>
      <Input value={form.departamento} onChange={(e) => onChange({ departamento: e.target.value })} placeholder="Ex.: Suporte" />
    </div>

    <div className="space-y-2 md:col-span-2">
      <Label>Tags</Label>
      <Input value={tagText(form.tags)} onChange={(e) => onChange({ tags: parseTags(e.target.value) })} placeholder="crm, chamado, reembolso" />
    </div>

    <div className="space-y-2 md:col-span-2">
      <Label>Descrição / resumo</Label>
      <Textarea value={form.resumo} onChange={(e) => onChange({ resumo: e.target.value })} placeholder="Resumo curto para a listagem" />
    </div>

    <div className="space-y-2 md:col-span-2">
      <Label>{form.tipo === "anotacao" ? "Conteúdo da anotação" : "Conteúdo principal"}</Label>
      <Textarea className="min-h-28" value={form.conteudo} onChange={(e) => onChange({ conteudo: e.target.value })} placeholder="Registre o conteúdo consultivo ou operacional" />
      {form.tipo === "anotacao" && <p className="text-xs text-muted-foreground">Anotações privadas aparecem apenas para o autor; compartilhadas usam visibilidade Empresa.</p>}
    </div>

    {form.tipo === "duvida" && (
      <>
        <div className="space-y-2 md:col-span-2">
          <Label>Pergunta</Label>
          <Textarea value={form.pergunta} onChange={(e) => onChange({ pergunta: e.target.value })} placeholder="Qual é a dúvida recorrente?" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Resposta</Label>
          <Textarea value={form.resposta} onChange={(e) => onChange({ resposta: e.target.value })} placeholder="Resposta ou orientação validada" />
        </div>
      </>
    )}

    {form.tipo === "solucao_erro" && (
      <>
        <div className="space-y-2">
          <Label>Sistema relacionado</Label>
          <Input value={form.sistema_relacionado} onChange={(e) => onChange({ sistema_relacionado: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Erro relacionado</Label>
          <Input value={form.erro_relacionado} onChange={(e) => onChange({ erro_relacionado: e.target.value })} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Causa</Label>
          <Textarea value={form.causa} onChange={(e) => onChange({ causa: e.target.value })} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Solução</Label>
          <Textarea value={form.solucao} onChange={(e) => onChange({ solucao: e.target.value })} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Observações</Label>
          <Textarea value={form.observacoes} onChange={(e) => onChange({ observacoes: e.target.value })} />
        </div>
      </>
    )}

    <div className="space-y-2 md:col-span-2">
      <Label>Vínculo opcional com POP</Label>
      <Select value={form.pop_id ?? "sem_pop"} onValueChange={(value) => onChange({ pop_id: value === "sem_pop" ? null : value })}>
        <SelectTrigger><SelectValue placeholder="POP relacionado" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="sem_pop">Sem POP vinculado</SelectItem>
          {pops.map((pop) => <SelectItem key={pop.id} value={pop.id}>{pop.titulo}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  </div>
  );
};

const toForm = (content: KnowledgeContent): KnowledgeContentInput => ({
  tipo: content.tipo,
  titulo: content.titulo,
  resumo: content.resumo,
  conteudo: content.conteudo,
  pergunta: content.pergunta,
  resposta: content.resposta,
  sistema_relacionado: content.sistema_relacionado,
  erro_relacionado: content.erro_relacionado,
  causa: content.causa,
  solucao: content.solucao,
  observacoes: content.observacoes,
  categoria: content.categoria,
  departamento: content.departamento,
  tags: content.tags ?? [],
  status: content.status,
  visibilidade: content.visibilidade,
  responsavel_id: content.responsavel_id,
  pop_id: content.pop_id,
  etapa_id: content.etapa_id,
});

const BaseConhecimento = () => {
  const { user } = useAuth();
  const { data: contents = [], isLoading, isError } = useKnowledgeContents();
  const { data: pops = [] } = usePops();
  const createContent = useCreateKnowledgeContent();
  const updateContent = useUpdateKnowledgeContent();
  const deleteContent = useDeleteKnowledgeContent();

  const { data: usuarios = [] } = useQuery({
    queryKey: ["usuarios-base-conhecimento"],
    queryFn: async () => {
      const { data, error } = await supabase.from("usuarios").select("id,nome,email").order("nome");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: perfilAtual } = useQuery({
    enabled: !!user?.id,
    queryKey: ["perfil-base-conhecimento", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("usuarios").select("role").eq("id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [busca, setBusca] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<"todos" | KnowledgeType>("todos");
  const [statusFiltro, setStatusFiltro] = useState<"ativos" | KnowledgeStatus>("ativos");
  const [visibilidadeFiltro, setVisibilidadeFiltro] = useState<"todas" | KnowledgeVisibility>("todas");
  const [categoriaFiltro, setCategoriaFiltro] = useState("todas");
  const [departamentoFiltro, setDepartamentoFiltro] = useState("todos");
  const [tagFiltro, setTagFiltro] = useState("todas");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<KnowledgeContent | null>(null);
  const [viewing, setViewing] = useState<KnowledgeContent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeContent | null>(null);
  const [form, setForm] = useState<KnowledgeContentInput>(emptyForm);

  const categorias = useMemo(() => ["todas", ...Array.from(new Set(contents.map((item) => item.categoria).filter(Boolean)))], [contents]);
  const departamentos = useMemo(() => ["todos", ...Array.from(new Set(contents.map((item) => item.departamento).filter(Boolean)))], [contents]);
  const tags = useMemo(() => ["todas", ...Array.from(new Set(contents.flatMap((item) => item.tags ?? []).filter(Boolean)))], [contents]);

  const filtered = useMemo(() => {
    const termo = normalize(busca);
    return contents.filter((item) => {
      // Filtro local simples do MVP: busca apenas nos conteúdos já retornados pela RLS do Supabase.
      const searchBucket = [
        item.titulo,
        item.resumo,
        item.conteudo,
        item.categoria,
        item.departamento,
        item.pergunta,
        item.resposta,
        item.causa,
        item.solucao,
        item.observacoes,
        ...(item.tags ?? []),
      ].map(normalize).join(" ");
      return (
        (termo.length === 0 || searchBucket.includes(termo)) &&
        (tipoFiltro === "todos" || item.tipo === tipoFiltro) &&
        (statusFiltro === "ativos" ? item.status !== "arquivado" : item.status === statusFiltro) &&
        (visibilidadeFiltro === "todas" || item.visibilidade === visibilidadeFiltro) &&
        (categoriaFiltro === "todas" || item.categoria === categoriaFiltro) &&
        (departamentoFiltro === "todos" || item.departamento === departamentoFiltro) &&
        (tagFiltro === "todas" || (item.tags ?? []).includes(tagFiltro))
      );
    });
  }, [contents, busca, tipoFiltro, statusFiltro, visibilidadeFiltro, categoriaFiltro, departamentoFiltro, tagFiltro]);

  const summary = useMemo(() => ({
    total: contents.length,
    artigosPublicados: contents.filter((item) => item.tipo === "artigo" && item.status === "publicado").length,
    duvidasAbertas: contents.filter((item) => item.tipo === "duvida" && item.status === "aberta").length,
    solucoes: contents.filter((item) => item.tipo === "solucao_erro").length,
    minhasAnotacoes: contents.filter((item) => item.tipo === "anotacao" && item.autor_id === user?.id).length,
  }), [contents, user?.id]);

  const limparFiltros = () => {
    setBusca("");
    setTipoFiltro("todos");
    setStatusFiltro("ativos");
    setVisibilidadeFiltro("todas");
    setCategoriaFiltro("todas");
    setDepartamentoFiltro("todos");
    setTagFiltro("todas");
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (content: KnowledgeContent) => {
    const nextForm = toForm(content);
    if (!statusByType[nextForm.tipo].includes(nextForm.status)) {
      nextForm.status = defaultStatusByType[nextForm.tipo];
    }
    setEditing(content);
    setForm(nextForm);
    setFormOpen(true);
  };

  const saveForm = async () => {
    if (!form.titulo.trim()) {
      toast.error("Informe o título do conteúdo.");
      return;
    }
    const input = statusByType[form.tipo].includes(form.status)
      ? form
      : { ...form, status: defaultStatusByType[form.tipo] };
    try {
      if (editing) {
        await updateContent.mutateAsync({ id: editing.id, input });
        toast.success("Conteúdo atualizado.");
      } else {
        await createContent.mutateAsync(input);
        toast.success("Conteúdo criado.");
      }
      setFormOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o conteúdo.");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteContent.mutateAsync(deleteTarget.id);
      toast.success("Conteúdo excluído.");
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível excluir o conteúdo.");
    }
  };

  return (
    <AppLayout title="Base de Conhecimento">
      <div className="mx-auto w-full max-w-7xl space-y-5">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Base de Conhecimento</h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Centralize artigos, dúvidas frequentes, soluções de erro e anotações internas em um único módulo pesquisável da empresa.
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Novo conteúdo
          </Button>
        </header>

        <Card>
          <CardContent className="px-8 pb-8 pt-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-foreground">Filtrar por:</h2>
              <Button variant="ghost" size="sm" onClick={limparFiltros}>Limpar filtros</Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-2 md:col-span-2">
                <Label className="flex items-center gap-2 text-xs text-muted-foreground"><Search className="h-3.5 w-3.5" />Busca</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-9" placeholder="Buscar por título, conteúdo, tags, pergunta, causa ou solução..." />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Tipo</Label>
                <Select value={tipoFiltro} onValueChange={(value) => setTipoFiltro(value as "todos" | KnowledgeType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="artigo">Artigos</SelectItem>
                    <SelectItem value="duvida">Dúvidas</SelectItem>
                    <SelectItem value="solucao_erro">Soluções de erro</SelectItem>
                    <SelectItem value="anotacao">Anotações</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select value={statusFiltro} onValueChange={(value) => setStatusFiltro(value as "ativos" | KnowledgeStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statusFilterOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status === "ativos" ? "Todos ativos" : statusLabel[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Visibilidade</Label>
                <Select value={visibilidadeFiltro} onValueChange={(value) => setVisibilidadeFiltro(value as "todas" | KnowledgeVisibility)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    <SelectItem value="empresa">Empresa</SelectItem>
                    <SelectItem value="privado">Privado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Categoria</Label>
                <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{categorias.map((c) => <SelectItem key={c} value={c}>{c === "todas" ? "Todas" : c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Departamento</Label>
                <Select value={departamentoFiltro} onValueChange={setDepartamentoFiltro}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{departamentos.map((d) => <SelectItem key={d} value={d}>{d === "todos" ? "Todos" : d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Tags</Label>
                <Select value={tagFiltro} onValueChange={setTagFiltro}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{tags.map((tag) => <SelectItem key={tag} value={tag}>{tag === "todas" ? "Todas" : tag}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <section aria-label="Resumo da Base de Conhecimento" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {[
            { label: "Total de conteúdos", value: summary.total, icon: BookOpen, className: "bg-accent text-accent-foreground" },
            { label: "Artigos publicados", value: summary.artigosPublicados, icon: FileText, className: "bg-primary/10 text-primary" },
            { label: "Dúvidas abertas", value: summary.duvidasAbertas, icon: FileQuestion, className: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]" },
            { label: "Soluções de erro", value: summary.solucoes, icon: Wrench, className: "bg-destructive/10 text-destructive" },
            { label: "Minhas anotações", value: summary.minhasAnotacoes, icon: StickyNote, className: "bg-muted text-muted-foreground" },
          ].map((item) => (
            <Card key={item.label} className="border-border/70 shadow-sm">
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div><p className="text-xs font-medium text-muted-foreground">{item.label}</p><p className="text-2xl font-semibold text-foreground">{item.value}</p></div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.className}`}><item.icon className="h-5 w-5" /></div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="space-y-3">
          {isLoading && <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Card key={i}><CardContent className="p-4"><Skeleton className="mb-2 h-4 w-1/3" /><Skeleton className="h-3 w-2/3" /></CardContent></Card>)}</div>}

          {isError && <Card><CardContent className="flex items-center gap-2 p-6 text-sm text-destructive"><AlertCircle className="h-4 w-4" />Não foi possível carregar a Base de Conhecimento.</CardContent></Card>}

          {!isLoading && !isError && contents.length === 0 && <Card><CardContent className="p-6 text-sm text-muted-foreground">Nenhum conteúdo cadastrado ainda. Use “Novo conteúdo” para iniciar a base interna da empresa.</CardContent></Card>}

          {!isLoading && !isError && contents.length > 0 && filtered.length === 0 && <Card><CardContent className="p-6 text-sm text-muted-foreground">Nenhum conteúdo encontrado para a busca ou filtros informados.</CardContent></Card>}

          {!isLoading && !isError && filtered.map((item) => {
            const Icon = typeIcon[item.tipo];
            const canManage = ["admin", "gestor", "criador", "developer"].includes(perfilAtual?.role ?? "");
            const canEdit = item.autor_id === user?.id || canManage;
            const canDelete = canEdit;
            const preview = item.resumo || item.conteudo || item.pergunta || item.solucao || "Sem resumo informado.";
            return (
              <Card key={item.id} className="border-border/70 bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground"><Icon className="h-5 w-5" /></div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="space-y-1">
                        <h2 className="truncate text-base font-semibold text-foreground md:text-lg">{item.titulo}</h2>
                        <p className="line-clamp-2 text-sm leading-5 text-muted-foreground">{preview}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5"><Tag className="h-3.5 w-3.5" />{item.categoria || "Sem categoria"}</span>
                        <span className="inline-flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" />{item.departamento || "Sem departamento"}</span>
                        <span className="inline-flex items-center gap-1.5"><UserRound className="h-3.5 w-3.5" />{item.responsavel?.nome || item.autor?.nome || "Sem responsável"}</span>
                        <span className="inline-flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5" />Atualizado em {formatDate(item.updated_at)}</span>
                        {item.pop && <span className="inline-flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" />Vinculado ao POP: {item.pop.titulo}</span>}
                      </div>
                      {item.tags.length > 0 && <div className="flex flex-wrap gap-1.5">{item.tags.map((tag) => <Badge key={tag} variant="secondary" className="text-[11px]">#{tag}</Badge>)}</div>}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2 md:justify-end">
                    <Badge variant="outline" className={typeClass[item.tipo]}>{typeLabel[item.tipo]}</Badge>
                    <Badge variant="outline" className={statusClass[item.status]}>{statusLabel[item.status]}</Badge>
                    <Badge variant="outline" className="gap-1 border-border/70 bg-background text-muted-foreground">{item.visibilidade === "privado" ? <Lock className="h-3 w-3" /> : <Building2 className="h-3 w-3 text-primary" />}{item.visibilidade === "privado" ? "Privado" : "Empresa"}</Badge>
                    <Button size="sm" onClick={() => setViewing(item)}><Eye className="mr-2 h-4 w-4" />Abrir</Button>
                    {canEdit && <Button size="sm" variant="outline" onClick={() => openEdit(item)}><Edit className="mr-2 h-4 w-4" />Editar</Button>}
                    {canDelete && <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(item)}><Trash2 className="h-4 w-4" /></Button>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar conteúdo" : "Novo conteúdo"}</DialogTitle>
            <DialogDescription>Cadastro compacto da Base de Conhecimento, mantendo todos os tipos em um único módulo.</DialogDescription>
          </DialogHeader>
          <FormFields form={form} onChange={(patch) => setForm((current) => ({ ...current, ...patch }))} pops={pops.map((pop) => ({ id: pop.id, titulo: pop.titulo }))} usuarios={usuarios} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={saveForm} disabled={createContent.isPending || updateContent.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="max-w-3xl">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle>{viewing.titulo}</DialogTitle>
                <DialogDescription>{typeLabel[viewing.tipo]} • {statusLabel[viewing.status]} • {viewing.visibilidade === "privado" ? "Privado" : "Empresa"}</DialogDescription>
              </DialogHeader>
              <div className="max-h-[70vh] space-y-4 overflow-y-auto text-sm">
                {viewing.resumo && <p className="text-muted-foreground">{viewing.resumo}</p>}
                {viewing.conteudo && <div className="whitespace-pre-wrap rounded-lg border bg-muted/30 p-3">{viewing.conteudo}</div>}
                {viewing.pergunta && <p><strong>Pergunta:</strong> {viewing.pergunta}</p>}
                {viewing.resposta && <p><strong>Resposta:</strong> {viewing.resposta}</p>}
                {viewing.sistema_relacionado && <p><strong>Sistema:</strong> {viewing.sistema_relacionado}</p>}
                {viewing.erro_relacionado && <p><strong>Erro:</strong> {viewing.erro_relacionado}</p>}
                {viewing.causa && <p><strong>Causa:</strong> {viewing.causa}</p>}
                {viewing.solucao && <p><strong>Solução:</strong> {viewing.solucao}</p>}
                {viewing.observacoes && <p><strong>Observações:</strong> {viewing.observacoes}</p>}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conteúdo?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação removerá “{deleteTarget?.titulo}” da Base de Conhecimento. Continue apenas se este conteúdo não for mais necessário.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default BaseConhecimento;

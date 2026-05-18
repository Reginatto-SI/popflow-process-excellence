import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  BookOpen,
  Building2,
  CalendarClock,
  Info,
  Edit,
  Eye,
  FileQuestion,
  FileText,
  Image,
  ImagePlus,
  Link as LinkIcon,
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import {
  useCreateKnowledgeContent,
  useDeleteKnowledgeContent,
  useKnowledgeContents,
  useUpdateKnowledgeContent,
  type KnowledgeAttachment,
  type KnowledgeContent,
  type KnowledgeContentInput,
  type KnowledgeStatus,
  type KnowledgeType,
  type KnowledgeVisibility,
} from "@/hooks/useBaseConhecimento";
import { usePops } from "@/hooks/usePops";
import { supabase } from "@/integrations/supabase/client";
import { MediaMentionTextarea, type MediaMentionTextareaHandle } from "@/components/MediaMentionTextarea";
import { InsertMediaDialog, type InsertedMedia } from "@/components/InsertMediaDialog";
import { MediaViewer } from "@/components/MediaViewer";
import { renderMarkdownPreview, stripMarkdownForSearchPreview, type InlineMediaTipo } from "@/lib/markdownPreview";

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
const compactPreviewText = (value?: string | null) => stripMarkdownForSearchPreview(value ?? "");


const slugifyRef = (s: string): string =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "");

type KnowledgeInlineMedia = {
  uid: string;
  id?: string;
  tipo: InlineMediaTipo;
  nome: string;
  referencia: string;
  url: string;
  storage_path: string;
  mime_type: string;
  tamanho: number | null;
  persisted: boolean;
};

type UploadedInlineAsset = Pick<KnowledgeInlineMedia, "url" | "storage_path" | "mime_type" | "tamanho">;

const uid = () => Math.random().toString(36).slice(2, 10);

const inlineMediaFromAttachment = (attachment: KnowledgeAttachment): KnowledgeInlineMedia | null => {
  if (!attachment.referencia) return null;
  return {
    uid: attachment.id,
    id: attachment.id,
    tipo: attachment.tipo_arquivo === "audio" || attachment.tipo_arquivo === "video" || attachment.tipo_arquivo === "documento" || attachment.tipo_arquivo === "imagem"
      ? attachment.tipo_arquivo
      : attachment.mime_type.startsWith("image/")
        ? "imagem"
        : "documento",
    nome: attachment.nome_arquivo,
    referencia: attachment.referencia,
    url: attachment.url,
    storage_path: attachment.storage_path,
    mime_type: attachment.mime_type,
    tamanho: attachment.tamanho,
    persisted: true,
  };
};

// Combobox simples de Categoria com criação rápida.
// Não há tabela `categorias` dedicada: as opções vêm das categorias já gravadas em
// `base_conhecimento.categoria` da empresa atual (isolamento garantido pelo RLS da tabela).
// Normalizamos espaços/caixa apenas para comparar e evitar duplicidade trivial; o valor
// gravado preserva a forma escolhida pelo usuário.
const normalizeCategoria = (value: string) => value.trim().replace(/\s+/g, " ");
const categoriaKey = (value: string) => normalizeCategoria(value).toLowerCase();

const CategoriaCombobox = ({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (next: string) => void;
  options: string[];
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Dedupe ignorando caixa/espaços; preserva a primeira forma encontrada.
  const uniqueOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const opt of options) {
      const key = categoriaKey(opt);
      if (key && !seen.has(key)) seen.set(key, normalizeCategoria(opt));
    }
    return Array.from(seen.values()).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [options]);

  const normalizedSearch = normalizeCategoria(search);
  const matchExists = uniqueOptions.some((opt) => categoriaKey(opt) === categoriaKey(normalizedSearch));
  const canCreate = normalizedSearch.length > 0 && !matchExists;

  const handleSelect = (next: string) => {
    onChange(normalizeCategoria(next));
    setSearch("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className={cn("truncate", !value && "text-muted-foreground")}>
            {value || "Selecione ou crie uma categoria"}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Pesquisar categoria…" value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>{canCreate ? null : "Nenhuma categoria encontrada."}</CommandEmpty>
            {uniqueOptions.length > 0 && (
              <CommandGroup heading="Categorias da empresa">
                {uniqueOptions.map((opt) => (
                  <CommandItem key={opt} value={opt} onSelect={() => handleSelect(opt)}>
                    <Check className={cn("mr-2 h-4 w-4", categoriaKey(value) === categoriaKey(opt) ? "opacity-100" : "opacity-0")} />
                    {opt}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {canCreate && (
              <CommandGroup heading="Nova">
                {/* Criação rápida: sem tela administrativa, sem migration. O valor é apenas
                    persistido em base_conhecimento.categoria no submit do formulário. */}
                <CommandItem value={`__create__${normalizedSearch}`} onSelect={() => handleSelect(normalizedSearch)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar categoria "{normalizedSearch}"
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const FormFields = ({
  form,
  onChange,
  pops,
  usuarios,
  inlineMedia,
  uploadInlineFile,
  onAddInlineMedia,
  onDiscardUploadedAsset,
  categoriasExistentes,
}: {
  form: KnowledgeContentInput;
  onChange: (patch: Partial<KnowledgeContentInput>) => void;
  pops: { id: string; titulo: string }[];
  usuarios: { id: string; nome: string; email: string }[];
  inlineMedia: KnowledgeInlineMedia[];
  uploadInlineFile: (file: File) => Promise<UploadedInlineAsset>;
  onAddInlineMedia: (media: KnowledgeInlineMedia) => Promise<void> | void;
  onDiscardUploadedAsset: (asset: UploadedInlineAsset) => Promise<void>;
  categoriasExistentes: string[];
}) => {
  const compatibleStatuses = statusByType[form.tipo];
  const textareaRefs = useRef<Map<string, MediaMentionTextareaHandle | null>>(new Map());
  const lastUploadedAssetRef = useRef<UploadedInlineAsset | null>(null);
  const [insertDialog, setInsertDialog] = useState<{ field: keyof KnowledgeContentInput; file: File | null } | null>(null);
  const [previewField, setPreviewField] = useState<{ label: string; value: string } | null>(null);
  const [previewMedia, setPreviewMedia] = useState<KnowledgeInlineMedia | null>(null);

  const openInsertDialog = (field: keyof KnowledgeContentInput, file: File | null = null) => {
    setInsertDialog({ field, file });
  };

  const uploadFileForDialog = async (file: File) => {
    const asset = await uploadInlineFile(file);
    lastUploadedAssetRef.current = asset;
    return asset.url;
  };

  const handleInsertMediaConfirm = async (media: InsertedMedia) => {
    if (!insertDialog || !lastUploadedAssetRef.current) return;
    const nextMedia: KnowledgeInlineMedia = {
      uid: uid(),
      tipo: media.tipo,
      nome: media.nome,
      referencia: media.referencia,
      url: media.url,
      storage_path: lastUploadedAssetRef.current.storage_path,
      mime_type: lastUploadedAssetRef.current.mime_type,
      tamanho: lastUploadedAssetRef.current.tamanho,
      persisted: false,
    };
    await onAddInlineMedia(nextMedia);
    // Reaproveita a inserção imperativa do editor multimídia dos POPs para manter @slug no cursor do campo ativo.
    requestAnimationFrame(() => {
      textareaRefs.current.get(String(insertDialog.field))?.insertReferenceAtCursor(media.referencia);
    });
    lastUploadedAssetRef.current = null;
  };

  const handleInsertDialogOpenChange = async (open: boolean) => {
    if (open) return;

    // Limitação atual: o upload acontece antes da confirmação final para reaproveitar o modal dos POPs.
    // Se o usuário fechar após o upload e antes do vínculo, removemos o objeto temporário para não deixar lixo no bucket.
    const pendingAsset = lastUploadedAssetRef.current;
    lastUploadedAssetRef.current = null;
    setInsertDialog(null);
    if (pendingAsset) {
      await onDiscardUploadedAsset(pendingAsset);
    }
  };

  const mediaOptions = inlineMedia.map((media) => ({
    referencia: media.referencia,
    nome: media.nome,
    tipo: media.tipo,
  }));

  const mediaEditor = (field: keyof KnowledgeContentInput, label: string, placeholder: string, rows = 8) => {
    const value = String(form[field] ?? "");
    return (
      <div className="space-y-2 md:col-span-2">
        <Label>{label}</Label>
        {/* Editor compartilhado com POPs: Markdown + @referencias + Ctrl+V/drop.
            O botão "Inserir mídia" fica APENAS dentro da toolbar do editor (onOpenInsertMedia)
            para evitar duplicidade com o botão antes existente no header deste bloco. */}
        <MediaMentionTextarea
          ref={(node) => { textareaRefs.current.set(String(field), node); }}
          value={value}
          onChange={(next) => onChange({ [field]: next } as Partial<KnowledgeContentInput>)}
          midias={mediaOptions}
          rows={rows}
          placeholder={placeholder}
          className="overflow-visible rounded-xl border-border/70 shadow-sm"
          textareaClassName="min-h-44 bg-background/80"
          onRequestInsertMedia={(file) => openInsertDialog(field, file)}
          onOpenInsertMedia={() => openInsertDialog(field)}
          onPreview={() => setPreviewField({ label, value })}
        />
      </div>
    );
  };

  return (
    <>
      <Tabs defaultValue="geral" className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-3 rounded-2xl border bg-muted/40 p-1 shadow-inner">
          <TabsTrigger value="geral" className="gap-2 rounded-xl py-2 text-muted-foreground transition-all hover:bg-background/70 hover:text-foreground data-[state=active]:bg-background data-[state=active]:font-semibold data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <Info className="h-4 w-4" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="conteudo" className="gap-2 rounded-xl py-2 text-muted-foreground transition-all hover:bg-background/70 hover:text-foreground data-[state=active]:bg-background data-[state=active]:font-semibold data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <FileText className="h-4 w-4" />
            Conteúdo
          </TabsTrigger>
          <TabsTrigger value="vinculos" className="gap-2 rounded-xl py-2 text-muted-foreground transition-all hover:bg-background/70 hover:text-foreground data-[state=active]:bg-background data-[state=active]:font-semibold data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <LinkIcon className="h-4 w-4" />
            Vínculos
          </TabsTrigger>
        </TabsList>

        <div className="max-h-[68vh] overflow-y-auto pr-2">
          <TabsContent value="geral" className="mt-0 space-y-4 rounded-xl border bg-muted/10 p-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={form.titulo} onChange={(e) => onChange({ titulo: e.target.value })} placeholder="Ex.: Como registrar reembolso" className="text-base font-medium" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                {/* Combobox com criação rápida: usa as categorias já existentes em base_conhecimento
                    da empresa atual (RLS) e permite criar nova categoria a partir do termo digitado. */}
                <CategoriaCombobox
                  value={form.categoria}
                  onChange={(next) => onChange({ categoria: next })}
                  options={categoriasExistentes}
                />
              </div>

              <div className="space-y-2">
                <Label>Departamento</Label>
                <Input value={form.departamento} onChange={(e) => onChange({ departamento: e.target.value })} placeholder="Ex.: Suporte" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <Input value={tagText(form.tags)} onChange={(e) => onChange({ tags: parseTags(e.target.value) })} placeholder="crm, chamado, reembolso" />
            </div>
          </TabsContent>

          <TabsContent value="conteudo" className="mt-0 space-y-4 rounded-xl border bg-background p-4">
            {/* Texto discreto: o botão "Inserir mídia" agora vive apenas na toolbar do editor. */}
            <p className="text-xs text-muted-foreground">
              Use o editor para escrever o conteúdo. Você pode inserir referências de mídia pelo botão "Inserir mídia" ou colar imagens com <kbd className="rounded border bg-background px-1">Ctrl</kbd> + <kbd className="rounded border bg-background px-1">V</kbd>.
            </p>

            {form.tipo === "artigo" && mediaEditor("conteudo", "Conteúdo principal", "Registre o conteúdo consultivo ou operacional", 10)}

            {form.tipo === "duvida" && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>Pergunta</Label>
                  <Textarea value={form.pergunta} onChange={(e) => onChange({ pergunta: e.target.value })} placeholder="Qual é a dúvida recorrente?" />
                </div>
                {mediaEditor("resposta", "Resposta", "Resposta ou orientação validada", 8)}
                <div className="space-y-2 md:col-span-2">
                  <Label>Observações</Label>
                  <Textarea value={form.observacoes} onChange={(e) => onChange({ observacoes: e.target.value })} />
                </div>
              </div>
            )}

            {form.tipo === "solucao_erro" && (
              <div className="grid gap-4 md:grid-cols-2">
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
                {mediaEditor("solucao", "Solução", "Descreva a solução e insira mídias contextuais quando necessário", 8)}
                <div className="space-y-2 md:col-span-2">
                  <Label>Observações</Label>
                  <Textarea value={form.observacoes} onChange={(e) => onChange({ observacoes: e.target.value })} />
                </div>
              </div>
            )}

            {form.tipo === "anotacao" && (
              <div className="grid gap-4 md:grid-cols-2">
                {mediaEditor("conteudo", "Conteúdo da anotação", "Registre a anotação operacional", 10)}
                <p className="text-xs text-muted-foreground md:col-span-2">Anotações privadas aparecem apenas para o autor; compartilhadas usam visibilidade Empresa.</p>
                <div className="space-y-2 md:col-span-2">
                  <Label>Observações</Label>
                  <Textarea value={form.observacoes} onChange={(e) => onChange({ observacoes: e.target.value })} />
                </div>
              </div>
            )}

            {inlineMedia.length > 0 && (
              <div className="rounded-xl border bg-muted/20 p-3">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Mídias disponíveis no conteúdo</p>
                <div className="flex flex-wrap gap-2">
                  {inlineMedia.map((media) => (
                    <Badge key={media.uid} variant="secondary" className="gap-1 rounded-full px-2 py-1">
                      <Image className="h-3 w-3" />
                      @{media.referencia}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="vinculos" className="mt-0 space-y-4 rounded-xl border bg-muted/10 p-4">
            <div className="space-y-2">
              <Label>POP relacionado</Label>
              <Select value={form.pop_id ?? "sem_pop"} onValueChange={(value) => onChange({ pop_id: value === "sem_pop" ? null : value, etapa_id: null })}>
                <SelectTrigger><SelectValue placeholder="POP relacionado" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sem_pop">Sem POP vinculado</SelectItem>
                  {pops.map((pop) => <SelectItem key={pop.id} value={pop.id}>{pop.titulo}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              O vínculo com etapa específica foi mantido fora da UI nesta etapa para evitar selecionar etapas sem carregar a versão correta do POP.
            </div>
          </TabsContent>
        </div>
      </Tabs>

      <Dialog open={!!previewField} onOpenChange={(open) => !open && setPreviewField(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Pré-visualizar {previewField?.label}</DialogTitle>
            <DialogDescription>Renderização contextual com o mesmo parser inline dos POPs.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto rounded-lg border bg-muted/20 p-4 text-sm">
            {previewField?.value.trim() ? (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                {renderMarkdownPreview(previewField.value, inlineMedia, (m) => setPreviewMedia(m))}
              </div>
            ) : (
              <p className="text-muted-foreground">Sem conteúdo para pré-visualizar.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <MediaViewer
        open={!!previewMedia}
        onOpenChange={(open) => !open && setPreviewMedia(null)}
        tipo={previewMedia?.tipo ?? null}
        url={previewMedia?.url ?? null}
        nome={previewMedia?.nome ?? "Mídia"}
      />

      <InsertMediaDialog
        open={!!insertDialog}
        onOpenChange={(open) => {
          void handleInsertDialogOpenChange(open);
        }}
        initialFile={insertDialog?.file ?? null}
        existingRefs={inlineMedia.map((media) => media.referencia)}
        uploadFile={uploadFileForDialog}
        onConfirm={handleInsertMediaConfirm}
        slugify={slugifyRef}
        contextLabel="conteúdo"
      />
    </>
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
  const queryClient = useQueryClient();

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
  const [inlineMedia, setInlineMedia] = useState<KnowledgeInlineMedia[]>([]);
  const [sessionInlineMediaIds, setSessionInlineMediaIds] = useState<string[]>([]);
  const [viewMedia, setViewMedia] = useState<KnowledgeInlineMedia | null>(null);

  const canManageKnowledge = ["admin", "gestor", "criador", "developer"].includes(perfilAtual?.role ?? "");

  const categorias = useMemo(() => ["todas", ...Array.from(new Set(contents.map((item) => item.categoria).filter(Boolean)))], [contents]);
  const departamentos = useMemo(() => ["todos", ...Array.from(new Set(contents.map((item) => item.departamento).filter(Boolean)))], [contents]);
  const tags = useMemo(() => ["todas", ...Array.from(new Set(contents.flatMap((item) => item.tags ?? []).filter(Boolean)))], [contents]);

  const filtered = useMemo(() => {
    const termo = normalize(busca);
    return contents.filter((item) => {
      // Filtro local simples do MVP: busca apenas nos conteúdos já retornados pela RLS do Supabase.
      // Markdown e @referencias são normalizados para evitar poluir a busca futura com sintaxe inline.
      const searchBucket = [
        item.titulo,
        item.resumo,
        compactPreviewText(item.conteudo),
        item.categoria,
        item.departamento,
        compactPreviewText(item.pergunta),
        compactPreviewText(item.resposta),
        compactPreviewText(item.causa),
        compactPreviewText(item.solucao),
        compactPreviewText(item.observacoes),
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
    setForm({ ...emptyForm, resumo: "" });
    setInlineMedia([]);
    setSessionInlineMediaIds([]);
    setFormOpen(true);
  };

  const openEdit = (content: KnowledgeContent) => {
    const nextForm = toForm(content);
    if (!statusByType[nextForm.tipo].includes(nextForm.status)) {
      nextForm.status = defaultStatusByType[nextForm.tipo];
    }
    setEditing(content);
    setForm({ ...nextForm, resumo: "" });
    setInlineMedia((content.anexos ?? []).map(inlineMediaFromAttachment).filter(Boolean) as KnowledgeInlineMedia[]);
    setSessionInlineMediaIds([]);
    setFormOpen(true);
  };

  const currentEmpresaId = async () => {
    if (!user) throw new Error("Sessão expirada. Faça login novamente.");
    const { data, error } = await supabase.from("usuarios").select("empresa_id").eq("id", user.id).maybeSingle();
    if (error) throw error;
    if (!data?.empresa_id) throw new Error("Empresa do usuário não encontrada.");
    return data.empresa_id as string;
  };

  const uploadInlineFile = async (file: File): Promise<UploadedInlineAsset> => {
    const empresaId = await currentEmpresaId();
    const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, "_");
    // Bucket herdado do PRD 12: mantemos o prefixo base-conhecimento para isolar a origem e facilitar limpeza futura.
    // TODO: quando houver drafts persistentes, trocar "_new" por um id temporário rastreável em banco/edge cleanup.
    const storagePath = `${empresaId}/base-conhecimento/${editing?.id ?? "_new"}/${crypto.randomUUID()}-${safeName}`;
    const { error } = await supabase.storage
      .from("pop-midias")
      .upload(storagePath, file, { contentType: file.type || "application/octet-stream", upsert: false });
    if (error) throw error;
    const { data: publicUrl } = supabase.storage.from("pop-midias").getPublicUrl(storagePath);
    return {
      url: publicUrl.publicUrl,
      storage_path: storagePath,
      mime_type: file.type || "application/octet-stream",
      tamanho: file.size,
    };
  };

  const discardUploadedAsset = async (asset: UploadedInlineAsset) => {
    if (!asset.storage_path) return;
    const { error } = await supabase.storage.from("pop-midias").remove([asset.storage_path]);
    if (error) {
      toast.warning(`Upload temporário não removido automaticamente: ${error.message}`);
    }
  };

  const cleanupPendingInlineMedia = async () => {
    const pending = inlineMedia.filter((media) => !media.persisted && media.storage_path);
    const sessionPersisted = inlineMedia.filter((media) => media.id && sessionInlineMediaIds.includes(media.id));

    // Cleanup simples do cenário cancelar/fechar antes de salvar.
    // Mídias já persistidas antes de abrir o modal ficam preservadas; as adicionadas nesta sessão de edição são revertidas.
    // Uma rotina futura no backend ainda deve varrer falhas/network timeouts e abas fechadas abruptamente.
    const storagePaths = [...pending, ...sessionPersisted].map((media) => media.storage_path).filter(Boolean);
    if (storagePaths.length > 0) {
      const { error } = await supabase.storage.from("pop-midias").remove(storagePaths);
      if (error) {
        toast.warning(`Não foi possível limpar todos os uploads temporários: ${error.message}`);
      }
    }

    if (sessionInlineMediaIds.length > 0) {
      const { error } = await supabase.from("base_conhecimento_anexos").delete().in("id", sessionInlineMediaIds);
      if (error) {
        toast.warning(`Não foi possível reverter todos os vínculos de mídia inline: ${error.message}`);
      }
    }
  };

  const persistInlineMedia = async (contentId: string, media: KnowledgeInlineMedia) => {
    if (!user) throw new Error("Sessão expirada. Faça login novamente.");
    const empresaId = await currentEmpresaId();
    // A Base usa a tabela de metadados já existente para manter a mídia inline rastreável, sem criar sistema paralelo ao padrão POP.
    const { data, error } = await supabase
      .from("base_conhecimento_anexos")
      .insert({
        empresa_id: empresaId,
        base_conhecimento_id: contentId,
        nome_arquivo: media.nome,
        tipo_arquivo: media.tipo,
        mime_type: media.mime_type,
        tamanho: media.tamanho,
        storage_path: media.storage_path,
        url: media.url,
        referencia: media.referencia,
        uso: "inline",
        criado_por: user.id,
      })
      .select("*")
      .single();
    if (error) throw error;
    return inlineMediaFromAttachment(data as KnowledgeAttachment);
  };

  const addInlineMedia = async (media: KnowledgeInlineMedia) => {
    if (!editing) {
      setInlineMedia((current) => [...current, media]);
      return;
    }
    const persisted = await persistInlineMedia(editing.id, media);
    if (persisted) {
      setInlineMedia((current) => [...current, persisted]);
      if (persisted.id) setSessionInlineMediaIds((current) => [...current, persisted.id]);
    }
    queryClient.invalidateQueries({ queryKey: ["base-conhecimento"] });
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
      const inputWithoutResumo = { ...input, resumo: "" };
      if (editing) {
        await updateContent.mutateAsync({ id: editing.id, input: inputWithoutResumo });
        setSessionInlineMediaIds([]);
        toast.success("Conteúdo atualizado.");
        setFormOpen(false);
      } else {
        const createdId = await createContent.mutateAsync(inputWithoutResumo);
        const persistedMedia = await Promise.all(inlineMedia.map((media) => persistInlineMedia(createdId, media)));
        setInlineMedia(persistedMedia.filter(Boolean) as KnowledgeInlineMedia[]);
        setEditing({
          ...inputWithoutResumo,
          id: createdId,
          empresa_id: "",
          autor_id: user?.id ?? "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          published_at: inputWithoutResumo.status === "publicado" ? new Date().toISOString() : null,
          autor: null,
          responsavel: null,
          pop: null,
          anexos: [],
        });
        setSessionInlineMediaIds([]);
        queryClient.invalidateQueries({ queryKey: ["base-conhecimento"] });
        toast.success("Conteúdo criado com mídia inline disponível.");
        setFormOpen(false);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o conteúdo.");
    }
  };

  const handleFormOpenChange = async (open: boolean) => {
    if (open) {
      setFormOpen(true);
      return;
    }

    await cleanupPendingInlineMedia();
    setFormOpen(false);
    setEditing(null);
    setInlineMedia([]);
    setSessionInlineMediaIds([]);
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
            const canEdit = item.autor_id === user?.id || canManageKnowledge;
            const canDelete = canEdit;
            const inlineCount = (item.anexos ?? []).filter((attachment) => attachment.referencia).length;
            const preview = compactPreviewText(item.conteudo || item.resposta || item.pergunta || item.solucao) || "Sem conteúdo informado.";
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
                        {inlineCount > 0 && <span className="inline-flex items-center gap-1.5"><ImagePlus className="h-3.5 w-3.5" />{inlineCount} mídias inline</span>}
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

      <Dialog open={formOpen} onOpenChange={(open) => { void handleFormOpenChange(open); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar conteúdo" : "Novo conteúdo"}</DialogTitle>
            <DialogDescription>Cadastro compacto da Base de Conhecimento, mantendo todos os tipos em um único módulo.</DialogDescription>
          </DialogHeader>
          <FormFields
            form={form}
            onChange={(patch) => setForm((current) => ({ ...current, ...patch }))}
            pops={pops.map((pop) => ({ id: pop.id, titulo: pop.titulo }))}
            usuarios={usuarios}
            inlineMedia={inlineMedia}
            uploadInlineFile={uploadInlineFile}
            onAddInlineMedia={addInlineMedia}
            onDiscardUploadedAsset={discardUploadedAsset}
            categoriasExistentes={contents.map((item) => item.categoria).filter(Boolean) as string[]}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { void handleFormOpenChange(false); }}>Cancelar</Button>
            <Button onClick={saveForm} disabled={createContent.isPending || updateContent.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="max-w-3xl">
          {viewing && (() => {
            const viewingInlineMedia = (viewing.anexos ?? []).map(inlineMediaFromAttachment).filter(Boolean) as KnowledgeInlineMedia[];
            return (
              <>
                <DialogHeader>
                  <DialogTitle>{viewing.titulo}</DialogTitle>
                  <DialogDescription>{typeLabel[viewing.tipo]} • {statusLabel[viewing.status]} • {viewing.visibilidade === "privado" ? "Privado" : "Empresa"}</DialogDescription>
                </DialogHeader>
                <div className="max-h-[70vh] space-y-4 overflow-y-auto text-sm">
                  {viewing.conteudo && (
                    <div className="rounded-lg border bg-muted/20 p-4">
                      {renderMarkdownPreview(viewing.conteudo, viewingInlineMedia, (m) => setViewMedia(m))}
                    </div>
                  )}
                  {viewing.pergunta && <p><strong>Pergunta:</strong> {viewing.pergunta}</p>}
                  {viewing.resposta && (
                    <div className="rounded-lg border bg-muted/20 p-4">
                      <p className="mb-2 font-medium">Resposta</p>
                      {renderMarkdownPreview(viewing.resposta, viewingInlineMedia, (m) => setViewMedia(m))}
                    </div>
                  )}
                  {viewing.sistema_relacionado && <p><strong>Sistema:</strong> {viewing.sistema_relacionado}</p>}
                  {viewing.erro_relacionado && <p><strong>Erro:</strong> {viewing.erro_relacionado}</p>}
                  {viewing.causa && <p><strong>Causa:</strong> {viewing.causa}</p>}
                  {viewing.solucao && (
                    <div className="rounded-lg border bg-muted/20 p-4">
                      <p className="mb-2 font-medium">Solução</p>
                      {renderMarkdownPreview(viewing.solucao, viewingInlineMedia, (m) => setViewMedia(m))}
                    </div>
                  )}
                  {viewing.observacoes && <p><strong>Observações:</strong> {viewing.observacoes}</p>}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      <MediaViewer
        open={!!viewMedia}
        onOpenChange={(open) => !open && setViewMedia(null)}
        tipo={viewMedia?.tipo ?? null}
        url={viewMedia?.url ?? null}
        nome={viewMedia?.nome ?? "Mídia"}
      />

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

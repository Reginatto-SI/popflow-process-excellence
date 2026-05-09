import { useEffect, useMemo, useRef, useState } from "react";
import { FileText, Image as ImageIcon, Mic, Video } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import type { PopMidiaTipo } from "@/hooks/usePops";

export interface InsertedMedia {
  tipo: PopMidiaTipo;
  nome: string;
  referencia: string;
  url: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Arquivo já capturado (vindo de paste/drop). */
  initialFile?: File | null;
  /** Lista de slugs já usados para garantir unicidade. */
  existingRefs: string[];
  /** Faz upload do arquivo e devolve a URL pública. */
  uploadFile: (file: File) => Promise<string>;
  onConfirm: (m: InsertedMedia) => void;
  /** Slugify reaproveitado da página. */
  slugify: (s: string) => string;
}

const acceptByTipo: Record<PopMidiaTipo, string> = {
  imagem: "image/*",
  audio: "audio/*",
  video: "video/*",
  documento: "application/pdf,.pdf,.doc,.docx,.xls,.xlsx,.txt",
};

const detectTipo = (file: File): PopMidiaTipo => {
  if (file.type.startsWith("image/")) return "imagem";
  if (file.type.startsWith("audio/")) return "audio";
  if (file.type.startsWith("video/")) return "video";
  return "documento";
};

const ensureUnique = (base: string, existing: string[]): string => {
  if (!base) base = "midia";
  if (!existing.includes(base)) return base;
  let i = 2;
  while (existing.includes(`${base}-${i}`)) i++;
  return `${base}-${i}`;
};

export function InsertMediaDialog({
  open,
  onOpenChange,
  initialFile,
  existingRefs,
  uploadFile,
  onConfirm,
  slugify,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [tipo, setTipo] = useState<PopMidiaTipo>("imagem");
  const [nome, setNome] = useState("");
  const [referencia, setReferencia] = useState("");
  const [refTouched, setRefTouched] = useState(false);
  const [uploading, setUploading] = useState(false);
  const pasteAreaRef = useRef<HTMLDivElement>(null);

  // Reset / inicialização ao abrir
  useEffect(() => {
    if (!open) return;
    const f = initialFile ?? null;
    setFile(f);
    setRefTouched(false);
    setUploading(false);
    if (f) {
      const t = detectTipo(f);
      setTipo(t);
      const baseName = f.name?.replace(/\.[^.]+$/, "") || "Mídia";
      setNome(baseName);
      setReferencia(slugify(baseName) || "midia");
    } else {
      setTipo("imagem");
      setNome("");
      setReferencia("");
    }
  }, [open, initialFile, slugify]);

  // Auto-gerar referência a partir do nome enquanto o usuário não tocar manualmente
  useEffect(() => {
    if (!refTouched) {
      setReferencia(slugify(nome) || "");
    }
  }, [nome, refTouched, slugify]);

  const previewUrl = useMemo(() => {
    if (!file || !file.type.startsWith("image/")) return null;
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const it of items) {
      if (it.kind === "file") {
        const f = it.getAsFile();
        if (f) {
          e.preventDefault();
          const ext = f.type.split("/")[1] || "png";
          const named =
            f.name && f.name !== "image.png"
              ? f
              : new File([f], `print-${Date.now()}.${ext}`, { type: f.type });
          setFile(named);
          const t = detectTipo(named);
          setTipo(t);
          if (!nome) {
            const base = named.name.replace(/\.[^.]+$/, "");
            setNome(base);
          }
          return;
        }
      }
    }
    toast.message("Nenhum arquivo no clipboard.");
  };

  const handleConfirm = async () => {
    if (!file) {
      toast.error("Selecione um arquivo, cole do clipboard ou arraste para a área.");
      return;
    }
    if (!nome.trim()) {
      toast.error("Informe um nome para a mídia.");
      return;
    }
    const baseRef = slugify(referencia) || slugify(nome) || "midia";
    const finalRef = ensureUnique(baseRef, existingRefs);
    setUploading(true);
    try {
      const url = await uploadFile(file);
      onConfirm({ tipo, nome: nome.trim(), referencia: finalRef, url });
      onOpenChange(false);
    } catch (err) {
      toast.error(`Falha no upload: ${(err as Error).message}`);
    } finally {
      setUploading(false);
    }
  };

  const TipoIcon =
    tipo === "imagem" ? ImageIcon : tipo === "audio" ? Mic : tipo === "video" ? Video : FileText;

  return (
    <Dialog open={open} onOpenChange={(v) => !uploading && onOpenChange(v)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Inserir mídia na etapa</DialogTitle>
          <DialogDescription>
            Faça upload, cole do clipboard ou arraste um arquivo. Uma referência <code>@slug</code>{" "}
            será inserida no texto da etapa.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-2 md:grid-cols-2">
            <div className="space-y-1">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as PopMidiaTipo)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="imagem">Imagem</SelectItem>
                  <SelectItem value="audio">Áudio</SelectItem>
                  <SelectItem value="video">Vídeo</SelectItem>
                  <SelectItem value="documento">Documento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Nome</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Acesso à tela" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label>Referência</Label>
              <Input
                value={referencia}
                onChange={(e) => {
                  setReferencia(e.target.value);
                  setRefTouched(true);
                }}
                placeholder="acesso-a-tela"
              />
              <p className="text-[11px] text-muted-foreground">
                Será inserida no texto como <code>@{slugify(referencia) || "referencia"}</code>.
                Se já existir, um sufixo será adicionado automaticamente.
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <Label>Arquivo</Label>
            {file ? (
              <div className="flex flex-wrap items-center gap-2 rounded-md border bg-background p-2 text-xs">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded border bg-muted">
                  {previewUrl ? (
                    <img src={previewUrl} alt={file.name} className="h-full w-full object-cover" />
                  ) : (
                    <TipoIcon className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{file.name}</div>
                  <div className="text-muted-foreground">{Math.round(file.size / 1024)} KB</div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setFile(null)} disabled={uploading}>
                  Trocar
                </Button>
              </div>
            ) : (
              <>
                <Input
                  type="file"
                  accept={acceptByTipo[tipo]}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setFile(f);
                      const t = detectTipo(f);
                      setTipo(t);
                      if (!nome) setNome(f.name.replace(/\.[^.]+$/, ""));
                    }
                  }}
                />
                <div
                  ref={pasteAreaRef}
                  tabIndex={0}
                  onPaste={handlePaste}
                  onDragOver={(e) => {
                    if (e.dataTransfer?.types?.includes("Files")) e.preventDefault();
                  }}
                  onDrop={(e) => {
                    const f = e.dataTransfer?.files?.[0];
                    if (f) {
                      e.preventDefault();
                      setFile(f);
                      const t = detectTipo(f);
                      setTipo(t);
                      if (!nome) setNome(f.name.replace(/\.[^.]+$/, ""));
                    }
                  }}
                  className="mt-2 cursor-text rounded-md border border-dashed bg-muted/20 p-3 text-center text-xs text-muted-foreground outline-none transition-colors focus:border-primary focus:bg-primary/5"
                >
                  Clique aqui e pressione <kbd className="rounded border bg-background px-1">Ctrl</kbd>+
                  <kbd className="rounded border bg-background px-1">V</kbd> para colar uma imagem, ou
                  arraste um arquivo.
                </div>
              </>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={uploading}>
            {uploading ? "Enviando..." : "Inserir mídia"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

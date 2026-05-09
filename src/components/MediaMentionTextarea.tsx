import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { FileText, Image as ImageIcon, Mic, Video } from "lucide-react";

import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { PopMidiaTipo } from "@/hooks/usePops";

export interface MentionMidia {
  referencia: string;
  nome: string;
  tipo: PopMidiaTipo;
}

export interface MediaMentionTextareaHandle {
  insertReferenceAtCursor: (ref: string) => void;
  focus: () => void;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  midias: MentionMidia[];
  rows?: number;
  placeholder?: string;
  className?: string;
  /**
   * Disparado quando o usuário cola/arrasta um arquivo dentro do textarea.
   * Recebe o arquivo capturado para abrir o fluxo de inserção de mídia.
   */
  onRequestInsertMedia?: (file: File) => void;
}

const tipoIcon: Record<PopMidiaTipo, React.ComponentType<{ className?: string }>> = {
  imagem: ImageIcon,
  audio: Mic,
  video: Video,
  documento: FileText,
};

const tipoLabel: Record<PopMidiaTipo, string> = {
  imagem: "Imagem",
  audio: "Áudio",
  video: "Vídeo",
  documento: "Documento",
};

export const MediaMentionTextarea = forwardRef<MediaMentionTextareaHandle, Props>(
  ({ value, onChange, midias, rows = 2, placeholder, className, onRequestInsertMedia }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [highlight, setHighlight] = useState(0);
    const [triggerStart, setTriggerStart] = useState<number | null>(null);

    const filtered = midias.filter((m) => {
      if (!query) return true;
      const q = query.toLowerCase();
      return m.referencia.toLowerCase().includes(q) || m.nome.toLowerCase().includes(q);
    });

    useEffect(() => {
      if (highlight >= filtered.length) setHighlight(0);
    }, [filtered.length, highlight]);

    const refreshFromCaret = (text: string, caret: number) => {
      const before = text.slice(0, caret);
      const at = before.lastIndexOf("@");
      if (at === -1) {
        setOpen(false);
        setTriggerStart(null);
        return;
      }
      const between = before.slice(at + 1);
      if (/[\s\n]/.test(between)) {
        setOpen(false);
        setTriggerStart(null);
        return;
      }
      setTriggerStart(at);
      setQuery(between);
      setOpen(true);
      setHighlight(0);
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const text = e.target.value;
      onChange(text);
      refreshFromCaret(text, e.target.selectionStart ?? text.length);
    };

    const insertReference = (referencia: string) => {
      const el = textareaRef.current;
      if (!el || triggerStart == null) return;
      const caret = el.selectionStart ?? value.length;
      const before = value.slice(0, triggerStart);
      const after = value.slice(caret);
      const sep = after.startsWith(" ") || after.startsWith("\n") || after === "" ? "" : " ";
      const inserted = `@${referencia}${sep}`;
      const next = before + inserted + after;
      onChange(next);
      setOpen(false);
      setTriggerStart(null);
      requestAnimationFrame(() => {
        const pos = before.length + inserted.length;
        el.focus();
        el.setSelectionRange(pos, pos);
      });
    };

    // Imperative: insere @ref na posição atual do cursor (sem precisar de trigger @)
    useImperativeHandle(ref, () => ({
      insertReferenceAtCursor: (refStr: string) => {
        const el = textareaRef.current;
        const caret = el?.selectionStart ?? value.length;
        const before = value.slice(0, caret);
        const after = value.slice(caret);
        const prevChar = before.slice(-1);
        const needsLeading = before.length > 0 && !/\s/.test(prevChar);
        const needsTrailing = after.length > 0 && !/^\s/.test(after);
        const inserted = `${needsLeading ? " " : ""}@${refStr}${needsTrailing ? " " : ""}`;
        const next = before + inserted + after;
        onChange(next);
        requestAnimationFrame(() => {
          const pos = before.length + inserted.length;
          el?.focus();
          el?.setSelectionRange(pos, pos);
        });
      },
      focus: () => textareaRef.current?.focus(),
    }));

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!open || filtered.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlight((h) => (h + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlight((h) => (h - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertReference(filtered[highlight].referencia);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      if (!onRequestInsertMedia) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const it of items) {
        if (it.kind === "file") {
          const file = it.getAsFile();
          if (file) {
            e.preventDefault();
            onRequestInsertMedia(file);
            return;
          }
        }
      }
    };

    const handleDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
      if (!onRequestInsertMedia) return;
      const file = e.dataTransfer?.files?.[0];
      if (file) {
        e.preventDefault();
        onRequestInsertMedia(file);
      }
    };

    return (
      <div className={cn("relative", className)}>
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onDrop={handleDrop}
          onDragOver={(e) => {
            if (onRequestInsertMedia && e.dataTransfer?.types?.includes("Files")) {
              e.preventDefault();
            }
          }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onClick={(e) =>
            refreshFromCaret(value, (e.target as HTMLTextAreaElement).selectionStart ?? 0)
          }
          rows={rows}
          placeholder={placeholder}
        />

        {open && (
          <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
            {filtered.length === 0 ? (
              <div className="px-2 py-2 text-xs text-muted-foreground">
                Nenhuma mídia encontrada. Use “Inserir mídia” para adicionar.
              </div>
            ) : (
              filtered.map((m, idx) => {
                const Icon = tipoIcon[m.tipo];
                return (
                  <button
                    key={m.referencia + idx}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      insertReference(m.referencia);
                    }}
                    onMouseEnter={() => setHighlight(idx)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm",
                      idx === highlight ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{m.nome || m.referencia}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        @{m.referencia} · {tipoLabel[m.tipo]}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    );
  },
);

MediaMentionTextarea.displayName = "MediaMentionTextarea";

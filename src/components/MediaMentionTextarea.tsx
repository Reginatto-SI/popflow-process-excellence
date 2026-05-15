import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Bold, Eye, FileText, Heading2, Image as ImageIcon, ImagePlus, Italic, Link, List, ListOrdered, Mic, Quote, Video } from "lucide-react";

import { Button } from "@/components/ui/button";
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
  textareaClassName?: string;
  /**
   * Disparado quando o usuário cola/arrasta um arquivo dentro do textarea.
   * Recebe o arquivo capturado para abrir o fluxo de inserção de mídia.
   */
  onRequestInsertMedia?: (file: File) => void;
  /**
   * Abre o fluxo de upload/cadastro já existente para inserir @midia no cursor.
   * Mantém a mídia fora do editor Markdown para não criar um novo fluxo de anexos.
   */
  onOpenInsertMedia?: () => void;
  /**
   * Abre uma pré-visualização somente leitura: o Markdown continua salvo como texto puro.
   */
  onPreview?: () => void;
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
  ({ value, onChange, midias, rows = 2, placeholder, className, textareaClassName, onRequestInsertMedia, onOpenInsertMedia, onPreview }, ref) => {
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

    // Lógica central de inserção Markdown: altera somente a string controlada e reposiciona o cursor.
    // Assim, referências inline como @midia1 permanecem como texto e não são convertidas/removidas.
    const replaceSelection = (next: string, selectionStart: number, selectionEnd: number) => {
      onChange(next);
      requestAnimationFrame(() => {
        const el = textareaRef.current;
        el?.focus();
        el?.setSelectionRange(selectionStart, selectionEnd);
      });
    };

    const getSelection = () => {
      const el = textareaRef.current;
      const start = el?.selectionStart ?? value.length;
      const end = el?.selectionEnd ?? start;
      return { start, end, selected: value.slice(start, end) };
    };

    const wrapSelection = (prefix: string, suffix: string, fallback: string) => {
      const { start, end, selected } = getSelection();
      const text = selected || fallback;
      const inserted = `${prefix}${text}${suffix}`;
      const next = value.slice(0, start) + inserted + value.slice(end);
      const innerStart = start + prefix.length;
      replaceSelection(next, innerStart, innerStart + text.length);
    };

    const insertBlock = (template: string, fallbackSelection?: string) => {
      const { start, end, selected } = getSelection();
      const previous = value.slice(0, start);
      const nextText = value.slice(end);
      const base = selected || fallbackSelection || template;
      const block = template.replace("{{text}}", base);
      const needsLeadingBreak = previous.length > 0 && !previous.endsWith("\n");
      const needsTrailingBreak = nextText.length > 0 && !nextText.startsWith("\n");
      const inserted = `${needsLeadingBreak ? "\n" : ""}${block}${needsTrailingBreak ? "\n" : ""}`;
      const next = previous + inserted + nextText;
      const contentStart = previous.length + (needsLeadingBreak ? 1 : 0);
      replaceSelection(next, contentStart, contentStart + block.length);
    };

    const insertLinePrefix = (prefix: string, fallback: string) => {
      const { start, end, selected } = getSelection();
      if (!selected) {
        insertBlock(`${prefix}${fallback}`);
        return;
      }
      const transformed = selected
        .split("\n")
        .map((line) => (line.trim() ? `${prefix}${line}` : line))
        .join("\n");
      const next = value.slice(0, start) + transformed + value.slice(end);
      replaceSelection(next, start, start + transformed.length);
    };

    const insertNumberedList = () => {
      const { start, end, selected } = getSelection();
      if (!selected) {
        insertBlock("1. item");
        return;
      }

      let itemNumber = 1;
      const transformed = selected
        .split("\n")
        .map((line) => {
          if (!line.trim()) return line;

          // Reaplica a numeração sobre o conteúdo limpo para normalizar listas já numeradas sem duplicar prefixos.
          const existingNumberedItem = line.match(/^(\s*)\d+\.\s*(.*)$/);
          if (existingNumberedItem) {
            const [, indentation, content] = existingNumberedItem;
            return `${indentation}${itemNumber++}. ${content}`;
          }

          const indentation = line.match(/^\s*/)?.[0] ?? "";
          const content = line.slice(indentation.length);
          return `${indentation}${itemNumber++}. ${content}`;
        })
        .join("\n");
      const next = value.slice(0, start) + transformed + value.slice(end);
      replaceSelection(next, start, start + transformed.length);
    };

    const unsafeLinkProtocols = /^(javascript|data|vbscript):/i;
    const safeHttpUrl = /^(https?:\/\/)/i;
    const urlWithoutProtocol = /^(www\.|[A-Za-z0-9-]+\.[A-Za-z]{2,})([^\s]*)$/;

    const escapeMarkdownLinkLabel = (text: string) =>
      text.replace(/\\/g, "\\\\").replace(/]/g, "\\]");

    const linkForSelection = (selected: string) => {
      const trimmed = selected.trim();
      if (!trimmed || unsafeLinkProtocols.test(trimmed)) return null;
      if (safeHttpUrl.test(trimmed)) return trimmed;
      if (urlWithoutProtocol.test(trimmed)) return `https://${trimmed}`;
      return null;
    };

    const insertLink = () => {
      const { start, end, selected } = getSelection();
      const selectedText = selected.trim();
      const label = selectedText || "texto do link";
      const href = linkForSelection(selectedText) ?? "https://";
      // Converte apenas a seleção acionada pelo botão em Markdown link, sem auto-linkar texto digitado ou mexer em @midias.
      const inserted = `[${escapeMarkdownLinkLabel(label)}](${href})`;
      const next = value.slice(0, start) + inserted + value.slice(end);

      if (selectedText && linkForSelection(selectedText)) {
        replaceSelection(next, start + inserted.length, start + inserted.length);
        return;
      }

      const urlCursor = start + inserted.length - 1;
      replaceSelection(next, urlCursor, urlCursor);
    };

    return (
      <div className={cn("relative rounded-md border border-input bg-background", className)}>
        {/* Toolbar Markdown-first: adiciona apenas sintaxe Markdown ao texto salvo, sem HTML bruto. */}
        <div className="flex flex-wrap items-center gap-1 border-b bg-muted/30 p-2">
          <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onMouseDown={(e) => e.preventDefault()} onClick={() => wrapSelection("**", "**", "texto importante")} aria-label="Negrito">
            <Bold className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onMouseDown={(e) => e.preventDefault()} onClick={() => wrapSelection("*", "*", "texto em itálico")} aria-label="Itálico">
            <Italic className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-8 gap-1 px-2" onMouseDown={(e) => e.preventDefault()} onClick={() => insertLinePrefix("## ", "Título")} aria-label="Título">
            <Heading2 className="h-4 w-4" />
            <span className="hidden sm:inline">Título</span>
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onMouseDown={(e) => e.preventDefault()} onClick={() => insertLinePrefix("- ", "item")} aria-label="Lista com marcadores">
            <List className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onMouseDown={(e) => e.preventDefault()} onClick={insertNumberedList} aria-label="Lista numerada">
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-8 gap-1 px-2" onMouseDown={(e) => e.preventDefault()} onClick={() => insertBlock("> Atenção: {{text}}", "descreva aqui o ponto importante.")} aria-label="Atenção ou dica">
            <Quote className="h-4 w-4" />
            <span className="hidden sm:inline">Atenção</span>
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onMouseDown={(e) => e.preventDefault()} onClick={insertLink} aria-label="Link">
            <Link className="h-4 w-4" />
          </Button>
          <div className="flex flex-wrap items-center gap-1 sm:ml-auto">
            {onPreview && (
              <Button type="button" variant="ghost" size="sm" className="h-8 gap-1 px-2" onMouseDown={(e) => e.preventDefault()} onClick={onPreview}>
                <Eye className="h-4 w-4" />
                Pré-visualizar
              </Button>
            )}
            {onOpenInsertMedia && (
              <Button type="button" variant="ghost" size="sm" className="h-8 gap-1 px-2" onMouseDown={(e) => e.preventDefault()} onClick={onOpenInsertMedia}>
                <ImagePlus className="h-4 w-4" />
                Inserir mídia
              </Button>
            )}
          </div>
        </div>

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
          className={cn("rounded-none border-0 resize-y focus-visible:ring-0 focus-visible:ring-offset-0", textareaClassName)}
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

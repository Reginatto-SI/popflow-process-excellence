import { useEffect, useRef, useState } from "react";
import { FileText, Image as ImageIcon, Mic, Video } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { PopMidiaTipo } from "@/hooks/usePops";

export interface MentionMidia {
  referencia: string;
  nome: string;
  tipo: PopMidiaTipo;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  midias: MentionMidia[];
  rows?: number;
  placeholder?: string;
  className?: string;
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

// Mesma regex usada no PopDetail para preservar consistência visual.
const REF_REGEX = /@([A-Za-zÀ-ÿ0-9_-]+)/g;

export function MediaMentionTextarea({
  value,
  onChange,
  midias,
  rows = 2,
  placeholder,
  className,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  // Posição do `@` que disparou a sugestão
  const [triggerStart, setTriggerStart] = useState<number | null>(null);

  const filtered = midias.filter((m) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      m.referencia.toLowerCase().includes(q) ||
      m.nome.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    if (highlight >= filtered.length) setHighlight(0);
  }, [filtered.length, highlight]);

  const refreshFromCaret = (text: string, caret: number) => {
    // Procurar último '@' antes do caret sem espaço/quebra entre ele e o caret
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
    // Adiciona espaço após a referência se ainda não houver
    const sep = after.startsWith(" ") || after.startsWith("\n") || after === "" ? "" : " ";
    const inserted = `@${referencia}${sep}`;
    const next = before + inserted + after;
    onChange(next);
    setOpen(false);
    setTriggerStart(null);
    // Reposicionar caret
    requestAnimationFrame(() => {
      const pos = before.length + inserted.length;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  };

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

  // Prévia: render do texto com chips para referências reconhecidas
  const renderPreview = () => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    const refsByName = new Map(midias.map((m) => [m.referencia, m]));
    let i = 0;
    for (const match of value.matchAll(REF_REGEX)) {
      const start = match.index ?? 0;
      if (start > lastIndex) parts.push(value.slice(lastIndex, start));
      const ref = match[1];
      const m = refsByName.get(ref);
      if (m) {
        const Icon = tipoIcon[m.tipo];
        parts.push(
          <span
            key={`ref-${i}-${start}`}
            className="mx-0.5 inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 align-baseline text-xs font-medium text-primary"
          >
            <Icon className="h-3 w-3" />@{ref}
          </span>,
        );
      } else {
        parts.push(
          <span
            key={`ref-${i}-${start}`}
            className="mx-0.5 inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 align-baseline text-xs font-medium text-amber-800"
            title="Referência sem mídia cadastrada"
          >
            @{ref}
          </span>,
        );
      }
      lastIndex = start + match[0].length;
      i++;
    }
    if (lastIndex < value.length) parts.push(value.slice(lastIndex));
    return parts;
  };

  const hasRefs = REF_REGEX.test(value);
  // matchAll/test: REF_REGEX is global; reset lastIndex
  REF_REGEX.lastIndex = 0;

  return (
    <div className={cn("relative", className)}>
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
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
              Nenhuma mídia encontrada. Cadastre na aba “Mídias”.
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

      {hasRefs && (
        <div className="mt-2 rounded-md border bg-muted/30 p-2">
          <div className="mb-1 flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">Prévia</Badge>
            <span className="text-xs text-muted-foreground">
              Como as referências aparecerão no POP
            </span>
          </div>
          <div className="whitespace-pre-wrap text-sm leading-relaxed">{renderPreview()}</div>
        </div>
      )}
    </div>
  );
}

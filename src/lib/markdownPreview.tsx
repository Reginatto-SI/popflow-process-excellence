import type { ComponentType, ReactNode } from "react";
import { FileText, Image, Mic, Video } from "lucide-react";

import type { PopMidiaTipo } from "@/hooks/usePops";

// Tipo ainda nasce no módulo POP por compatibilidade com o enum/tabela original,
// mas o contrato abaixo é deliberadamente genérico para POP, Base de Conhecimento e futuros comentários.
export type InlineMediaTipo = PopMidiaTipo;

export interface MarkdownMediaRef {
  referencia: string;
  tipo: InlineMediaTipo;
}

const mediaTypeLabel: Record<InlineMediaTipo, string> = {
  imagem: "Imagem",
  audio: "Áudio",
  video: "Vídeo",
  documento: "Documento/PDF",
};

const MediaTypeIcon: Record<
  InlineMediaTipo,
  ComponentType<{ className?: string }>
> = {
  imagem: Image,
  audio: Mic,
  video: Video,
  documento: FileText,
};

const allowedMarkdownHrefProtocols = new Set([
  "http:",
  "https:",
  "mailto:",
  "tel:",
]);

const getSafeMarkdownHref = (href: string): string | null => {
  const trimmed = href.trim();
  if (!trimmed || /[\u0000-\u001F\u007F\s]/.test(trimmed)) return null;

  if (trimmed.startsWith("#")) return trimmed;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;

  const lowerHref = trimmed.toLowerCase();
  if (lowerHref.startsWith("mailto:") || lowerHref.startsWith("tel:"))
    return trimmed;
  if (!lowerHref.startsWith("http://") && !lowerHref.startsWith("https://"))
    return null;

  try {
    const url = new URL(trimmed);
    return allowedMarkdownHrefProtocols.has(url.protocol) ? trimmed : null;
  } catch {
    return null;
  }
};

/**
 * Texto plano para listagens/busca local. Remove sintaxe Markdown e @referencias
 * para evitar poluir previews e preparar uma indexação futura com conteúdo limpo.
 */
export const stripMarkdownForSearchPreview = (markdown: string) =>
  markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/@([A-Za-zÀ-ÿ0-9_-]+)/g, " ")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/([*_])(.*?)\1/g, "$2")
    .replace(/\s+/g, " ")
    .trim();

const inlineMarkdown = <TMedia extends MarkdownMediaRef>(
  text: string,
  mediaByRef = new Map<string, TMedia>(),
  onOpenMedia?: (midia: TMedia) => void,
): ReactNode[] => {
  const nodes: ReactNode[] = [];
  const pattern =
    /(\*\*[^*]+\*\*|_[^_]+_|\*[^*]+\*|\[[^\]]+\]\([^\s)]+\)|@([A-Za-zÀ-ÿ0-9_-]+))/g;
  let lastIndex = 0;

  text.replace(
    pattern,
    (match, _token, mediaRef: string | undefined, offset: number) => {
      if (offset > lastIndex) nodes.push(text.slice(lastIndex, offset));
      const key = `${offset}-${match}`;

      if (match.startsWith("**")) {
        nodes.push(<strong key={key}>{match.slice(2, -2)}</strong>);
      } else if (match.startsWith("_") || match.startsWith("*")) {
        nodes.push(<em key={key}>{match.slice(1, -1)}</em>);
      } else if (mediaRef) {
        const midia = mediaByRef.get(mediaRef);
        const Icon = midia ? MediaTypeIcon[midia.tipo] : null;
        // Menções inline são resolvidas pela lista de mídias vinculadas; desconhecidas permanecem texto puro.
        nodes.push(
          midia ? (
            <button
              key={key}
              type="button"
              onClick={() => onOpenMedia?.(midia)}
              className="mx-0.5 inline-flex max-w-full items-center gap-2 rounded-lg border border-primary/25 bg-primary/10 px-2 py-1 text-left text-xs font-medium text-primary transition-colors hover:bg-primary/20"
            >
              {/* Mídia inline é chip/link clicável; miniaturas permanecem fora do texto para manter a tela limpa. */}
              {Icon && <Icon className="h-4 w-4 shrink-0" />}
              <span className="min-w-0 truncate">
                {match} — {mediaTypeLabel[midia.tipo]}
              </span>
            </button>
          ) : (
            match
          ),
        );
      } else {
        const [, label, href] =
          match.match(/^\[([^\]]+)\]\(([^\s)]+)\)$/) ?? [];
        const safeHref = href ? getSafeMarkdownHref(href) : null;
        // Links suspeitos preservam o label como texto comum, sem criar alvo clicável.
        nodes.push(
          label && safeHref ? (
            <a
              key={key}
              href={safeHref}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline underline-offset-2"
            >
              {label}
            </a>
          ) : (
            label || match
          ),
        );
      }

      lastIndex = offset + match.length;
      return match;
    },
  );

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
};

const renderInlineMarkdown = <TMedia extends MarkdownMediaRef>(
  text: string,
  mediaByRef?: Map<string, TMedia>,
  onOpenMedia?: (midia: TMedia) => void,
) =>
  inlineMarkdown(text, mediaByRef, onOpenMedia).map((node, index) => (
    <span key={index}>{node}</span>
  ));

const renderInlineMarkdownLines = <TMedia extends MarkdownMediaRef>(
  lines: string[],
  mediaByRef?: Map<string, TMedia>,
  onOpenMedia?: (midia: TMedia) => void,
) =>
  lines.flatMap((line, lineIndex) => [
    ...renderInlineMarkdown(line, mediaByRef, onOpenMedia).map(
      (node, nodeIndex) => (
        <span key={`${lineIndex}-${nodeIndex}`}>{node}</span>
      ),
    ),
    ...(lineIndex < lines.length - 1 ? [<br key={`${lineIndex}-br`} />] : []),
  ]);

/**
 * Renderizador Markdown seguro e intencionalmente limitado, compartilhado por POPs,
 * Base de Conhecimento e futuros contextos com @referencias.
 * Ele não transforma HTML do usuário em DOM (`dangerouslySetInnerHTML`), então tags maliciosas ficam como texto.
 */
export const renderMarkdownPreview = <TMedia extends MarkdownMediaRef>(
  markdown: string,
  inlineMedia: TMedia[] = [],
  onOpenMedia?: (midia: TMedia) => void,
) => {
  const mediaByRef = new Map(inlineMedia.map((m) => [m.referencia, m]));
  const lines = markdown.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (line.trim().startsWith("```")) {
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      blocks.push(
        <pre
          key={index}
          className="overflow-x-auto rounded-lg border bg-muted/70 p-3 text-xs leading-5 text-foreground"
        >
          <code>{codeLines.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const className =
        level === 1 ? "text-2xl" : level === 2 ? "text-xl" : "text-lg";
      blocks.push(
        <h3
          key={index}
          className={`${className} font-semibold text-foreground`}
        >
          {renderInlineMarkdown(heading[2], mediaByRef, onOpenMedia)}
        </h3>,
      );
      index += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quoteLines: string[] = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) {
        quoteLines.push(lines[index].replace(/^>\s?/, ""));
        index += 1;
      }
      blocks.push(
        <blockquote
          key={index}
          className="border-l-4 border-primary/40 bg-muted/40 py-2 pl-4 text-muted-foreground"
        >
          {renderInlineMarkdown(quoteLines.join(" "), mediaByRef, onOpenMedia)}
        </blockquote>,
      );
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*[-*]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*[-*]\s+/, ""));
        index += 1;
      }
      blocks.push(
        <ul key={index} className="list-disc space-y-1 pl-5">
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>
              {renderInlineMarkdown(item, mediaByRef, onOpenMedia)}
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*\d+\.\s+/, ""));
        index += 1;
      }
      blocks.push(
        <ol key={index} className="list-decimal space-y-1 pl-5">
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>
              {renderInlineMarkdown(item, mediaByRef, onOpenMedia)}
            </li>
          ))}
        </ol>,
      );
      continue;
    }

    const paragraphLines: string[] = [];
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^(#{1,3})\s+/.test(lines[index]) &&
      !/^>\s?/.test(lines[index]) &&
      !/^\s*[-*]\s+/.test(lines[index]) &&
      !/^\s*\d+\.\s+/.test(lines[index]) &&
      !lines[index].trim().startsWith("```")
    ) {
      paragraphLines.push(lines[index]);
      index += 1;
    }
    blocks.push(
      <p key={index} className="leading-7">
        {renderInlineMarkdownLines(paragraphLines, mediaByRef, onOpenMedia)}
      </p>,
    );
  }

  return blocks;
};

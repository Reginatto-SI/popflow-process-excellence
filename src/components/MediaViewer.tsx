import { useEffect, useState } from "react";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Expand, Minimize2, X } from "lucide-react";
import type { PopMidiaTipo } from "@/hooks/usePops";

interface MediaViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipo: PopMidiaTipo | null;
  url: string | null;
  nome: string;
}

/**
 * Visualizador único reaproveitável para mídias inline.
 * Imagem: lightbox. Vídeo/áudio: player nativo. Documento: iframe + link.
 */
export const MediaViewer = ({ open, onOpenChange, tipo, url, nome }: MediaViewerProps) => {
  const [expanded, setExpanded] = useState(false);
  const mediaMaxHeightClass = expanded ? "max-h-[86vh]" : "max-h-[70vh]";
  const documentHeightClass = expanded ? "h-[86vh]" : "h-[70vh]";

  useEffect(() => {
    if (!open) setExpanded(false);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`max-h-[92vh] overflow-hidden p-6 [&>button]:hidden ${
          expanded
            ? "w-[min(96vw,1400px)] max-w-[min(96vw,1400px)]"
            : "w-[min(92vw,900px)] max-w-[min(92vw,900px)]"
        }`}
      >
        {/* Controles visuais do modal: expandir/reduzir e fechar, mantendo o fluxo atual de visualização. */}
        <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setExpanded((prev) => !prev)}
            aria-label={expanded ? "Reduzir visualização" : "Expandir visualização"}
          >
            {expanded ? <Minimize2 className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
          </Button>
          <DialogClose asChild>
            <Button type="button" variant="ghost" size="icon" aria-label="Fechar visualização">
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </div>
        {/* Espaço dedicado no header para evitar compressão do título pelos botões fixos no canto direito. */}
        <DialogHeader className="pr-24">
          <DialogTitle className="text-base">{nome || "Mídia"}</DialogTitle>
        </DialogHeader>
        {!url && (
          <p className="text-sm text-muted-foreground">
            Esta mídia ainda não tem arquivo enviado.
          </p>
        )}
        {url && tipo === "imagem" && (
          <img src={url} alt={nome} className={`${mediaMaxHeightClass} w-full rounded-md object-contain`} />
        )}
        {url && tipo === "video" && (
          <video src={url} controls className={`${mediaMaxHeightClass} w-full rounded-md`} />
        )}
        {url && tipo === "audio" && (
          <audio src={url} controls className="w-full" />
        )}
        {url && tipo === "documento" && (
          <div className="space-y-2">
            <iframe src={url} title={nome} className={`${documentHeightClass} w-full rounded-md border`} />
            <Button asChild variant="outline" size="sm">
              <a href={url} target="_blank" rel="noreferrer">Abrir em nova aba</a>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-base">{nome || "Mídia"}</DialogTitle>
        </DialogHeader>
        {!url && (
          <p className="text-sm text-muted-foreground">
            Esta mídia ainda não tem arquivo enviado.
          </p>
        )}
        {url && tipo === "imagem" && (
          <img src={url} alt={nome} className="max-h-[70vh] w-full rounded-md object-contain" />
        )}
        {url && tipo === "video" && (
          <video src={url} controls className="max-h-[70vh] w-full rounded-md" />
        )}
        {url && tipo === "audio" && (
          <audio src={url} controls className="w-full" />
        )}
        {url && tipo === "documento" && (
          <div className="space-y-2">
            <iframe src={url} title={nome} className="h-[70vh] w-full rounded-md border" />
            <Button asChild variant="outline" size="sm">
              <a href={url} target="_blank" rel="noreferrer">Abrir em nova aba</a>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

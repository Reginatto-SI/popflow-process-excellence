import { FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePops, type PopStatus } from "@/hooks/usePops";

const statusLabel: Record<PopStatus, string> = {
  rascunho: "Rascunho",
  revisao: "Em revisão",
  publicado: "Publicado",
};

const statusStyles: Record<PopStatus, string> = {
  publicado: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-transparent",
  revisao: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] border-transparent",
  rascunho: "bg-muted text-muted-foreground border-transparent",
};

const formatRelative = (iso: string) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (dias <= 0) return "Atualizado hoje";
  if (dias === 1) return "Atualizado há 1 dia";
  if (dias < 7) return `Atualizado há ${dias} dias`;
  const semanas = Math.floor(dias / 7);
  if (semanas === 1) return "Atualizado há 1 semana";
  return `Atualizado há ${semanas} semanas`;
};

export function RecentPops() {
  const { data: pops = [], isLoading } = usePops();
  const recentes = pops.slice(0, 4);

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base font-semibold">POPs recentes</CardTitle>
        <Button variant="ghost" size="sm" className="text-primary hover:text-primary" asChild>
          <Link to="/pops">Ver todos</Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading && <p className="px-6 py-4 text-sm text-muted-foreground">Carregando...</p>}
        {!isLoading && recentes.length === 0 && (
          <p className="px-6 py-4 text-sm text-muted-foreground">Nenhum POP cadastrado ainda.</p>
        )}
        <ul className="divide-y divide-border">
          {recentes.map((pop) => {
            const status = pop.versao_ativa?.status ?? "rascunho";
            return (
              <li key={pop.id} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/40">
                <Link to={`/pops/${pop.id}`} className="flex flex-1 items-center gap-4 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{pop.titulo}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {pop.departamento || "—"} · {formatRelative(pop.updated_at)}
                    </p>
                  </div>
                </Link>
                <Badge variant="outline" className={statusStyles[status]}>{statusLabel[status]}</Badge>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

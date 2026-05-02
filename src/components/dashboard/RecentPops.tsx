import { FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Status = "Publicado" | "Em revisão" | "Rascunho";

interface PopItem {
  title: string;
  area: string;
  updated: string;
  status: Status;
}

const pops: PopItem[] = [
  { title: "Abertura de loja", area: "Operações", updated: "Atualizado há 2 dias", status: "Publicado" },
  { title: "Higienização de equipamentos", area: "Qualidade", updated: "Atualizado há 4 dias", status: "Em revisão" },
  { title: "Fechamento de caixa", area: "Financeiro", updated: "Atualizado há 1 semana", status: "Publicado" },
  { title: "Atendimento ao cliente", area: "Comercial", updated: "Atualizado há 1 semana", status: "Rascunho" },
];

const statusStyles: Record<Status, string> = {
  Publicado: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-transparent",
  "Em revisão": "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] border-transparent",
  Rascunho: "bg-muted text-muted-foreground border-transparent",
};

export function RecentPops() {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base font-semibold">POPs recentes</CardTitle>
        <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
          Ver todos
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border">
          {pops.map((pop) => (
            <li
              key={pop.title}
              className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/40"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {pop.title}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {pop.area} · {pop.updated}
                </p>
              </div>
              <Badge variant="outline" className={statusStyles[pop.status]}>
                {pop.status}
              </Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

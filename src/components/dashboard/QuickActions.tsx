import { Plus, PlayCircle, ClipboardCheck, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const actions = [
  {
    label: "Criar novo POP",
    description: "Estruture um novo procedimento.",
    icon: Plus,
    primary: true,
  },
  {
    label: "Iniciar execução",
    description: "Execute um POP existente.",
    icon: PlayCircle,
  },
  {
    label: "Ver revisões pendentes",
    description: "Aprove ou ajuste rascunhos.",
    icon: ClipboardCheck,
  },
];

export function QuickActions() {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Ações rápidas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant={action.primary ? "default" : "outline"}
            className="group h-auto w-full justify-start gap-3 px-4 py-3"
          >
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-md ${
                action.primary
                  ? "bg-primary-foreground/15"
                  : "bg-accent text-accent-foreground"
              }`}
            >
              <action.icon className="h-4 w-4" />
            </span>
            <span className="flex-1 text-left">
              <span className="block text-sm font-medium">{action.label}</span>
              <span
                className={`block text-xs font-normal ${
                  action.primary
                    ? "text-primary-foreground/80"
                    : "text-muted-foreground"
                }`}
              >
                {action.description}
              </span>
            </span>
            <ArrowRight className="h-4 w-4 opacity-60 transition-transform group-hover:translate-x-0.5" />
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}

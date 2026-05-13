import { Check, Moon, Paintbrush, Sun, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import type { ThemeAppearance } from "@/theme-config";

const appearanceOptions: Array<{ id: ThemeAppearance; label: string; icon: LucideIcon }> = [
  { id: "light", label: "Claro", icon: Sun },
  { id: "dark", label: "Escuro", icon: Moon },
];

export function ThemeSwitcher() {
  const { color, appearance, colorOptions, setColor, setAppearance } = useTheme();
  const currentTheme = colorOptions.find((option) => option.id === color);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Personalizar tema visual">
          <Paintbrush className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <div className="flex flex-col gap-0.5">
            <span>Tema visual</span>
            <span className="text-xs font-normal text-muted-foreground">
              {currentTheme?.name} · {appearance === "dark" ? "Escuro" : "Claro"}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-xs uppercase tracking-wide text-muted-foreground">
          Tema de cor
        </DropdownMenuLabel>
        {colorOptions.map((option) => (
          <DropdownMenuItem
            key={option.id}
            onSelect={() => setColor(option.id)}
            className="flex cursor-pointer items-center gap-2"
          >
            <span
              className="h-3.5 w-3.5 rounded-full border border-border shadow-sm"
              style={{ backgroundColor: `hsl(${option.preview})` }}
              aria-hidden="true"
            />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate">{option.name}</span>
              <span className="truncate text-xs text-muted-foreground">{option.description}</span>
            </span>
            <Check className={cn("h-4 w-4 text-primary", option.id === color ? "opacity-100" : "opacity-0")} />
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs uppercase tracking-wide text-muted-foreground">
          Aparência
        </DropdownMenuLabel>
        {appearanceOptions.map((option) => {
          const Icon = option.icon;
          return (
            <DropdownMenuItem
              key={option.id}
              onSelect={() => setAppearance(option.id)}
              className="flex cursor-pointer items-center gap-2"
            >
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1">{option.label}</span>
              <Check className={cn("h-4 w-4 text-primary", option.id === appearance ? "opacity-100" : "opacity-0")} />
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

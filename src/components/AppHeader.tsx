import { Bell, LogOut, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

interface AppHeaderProps {
  title: string;
}

export function AppHeader({ title }: AppHeaderProps) {
  const { user } = useAuth();
  const navigate = useNavigate();


  const { data: perfil } = useQuery({
    enabled: !!user?.id,
    queryKey: ["perfil", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("usuarios")
        .select("nome, role")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const nome = perfil?.nome ?? user?.email ?? "";
  const iniciais = nome
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur md:px-6">
      <SidebarTrigger />
      <div className="flex min-w-0 items-center gap-2 text-sm">
        <span className="text-muted-foreground">POPFlow</span>
        <span className="text-muted-foreground">/</span>
        <span className="truncate font-medium text-foreground">{title}</span>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1.5 md:gap-3">
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar POPs..." className="h-9 w-64 pl-8" />
        </div>
        <ThemeSwitcher />
        <Button variant="ghost" size="icon" aria-label="Notificações">
          <Bell className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 pl-1">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {iniciais || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="hidden text-left leading-tight md:block">
            <div className="text-sm font-medium">{nome}</div>
            <div className="text-xs text-muted-foreground capitalize">{perfil?.role ?? ""}</div>
          </div>
        </div>
        <Button variant="ghost" size="icon" aria-label="Sair" onClick={signOut}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}

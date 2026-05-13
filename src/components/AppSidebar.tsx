import {
  LayoutDashboard,
  FileText,
  PlayCircle,
  ClipboardCheck,
  BookOpen,
  BarChart3,
  Settings,
  Workflow,
} from "lucide-react";
import { NavLink } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "POPs", url: "/pops", icon: FileText },
  { title: "Execuções", url: "/execucoes", icon: PlayCircle },
  { title: "Revisões", url: "/revisoes", icon: ClipboardCheck },
  { title: "Base de Conhecimento", url: "/base", icon: BookOpen },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        {/* No estado colapsado, remove o padding lateral do cabeçalho para alinhar o logo aos ícones do menu. */}
        <div className={`flex items-center gap-2 py-3 ${collapsed ? "justify-center px-0" : "px-2"}`}>
          <div
            className={`flex shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground ${
              collapsed ? "h-8 w-8" : "h-9 w-9"
            }`}
          >
            <Workflow className={collapsed ? "h-4 w-4" : "h-5 w-5"} />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-base font-semibold tracking-tight text-sidebar-foreground">
                POPFlow
              </span>
              <span className="text-xs text-muted-foreground">
                Gestão de processos
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) =>
                        `flex items-center gap-2 rounded-md ${
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : "text-sidebar-foreground hover:bg-sidebar-accent/60"
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

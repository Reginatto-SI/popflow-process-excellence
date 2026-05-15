import { FileText, PlayCircle, ClipboardCheck, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentPops } from "@/components/dashboard/RecentPops";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { useAuth } from "@/hooks/useAuth";
import { usePops } from "@/hooks/usePops";
import { supabase } from "@/integrations/supabase/client";

const placeholderStats = [
  // Indicadores temporários: manter mocks até existirem fontes reais para esses dados.
  { label: "Execuções em andamento", value: "12", icon: PlayCircle, hint: "Em tempo real" },
  { label: "Aguardando revisão", value: "7", icon: ClipboardCheck, hint: "Necessitam aprovação" },
  { label: "Taxa de conclusão", value: "86%", icon: TrendingUp, hint: "Últimos 30 dias" },
];

const firstNameFrom = (nome?: string | null) => nome?.trim().split(/\s+/)[0] ?? "";

const Index = () => {
  const { user } = useAuth();
  const { data: pops = [], isError: isPopsError } = usePops();

  const { data: perfil } = useQuery({
    enabled: !!user?.id,
    queryKey: ["perfil", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("usuarios")
        .select("nome")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const primeiroNome = firstNameFrom(perfil?.nome);
  const tituloBoasVindas = primeiroNome ? `Bem-vindo, ${primeiroNome}` : "Bem-vindo ao POPFlow";
  const totalPops = isPopsError ? "—" : String(pops.length);

  return (
    <AppLayout title="Dashboard">
      <div className="mx-auto w-full max-w-7xl space-y-8">
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            {tituloBoasVindas}
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground">
            Centralize o conhecimento, organize suas anotações e compartilhe procedimentos com a equipe em um só lugar.
          </p>
        </header>

        <section
          aria-label="Resumo"
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <StatCard label="POPs cadastrados" value={totalPops} icon={FileText} hint="Total na biblioteca" />
          {placeholderStats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RecentPops />
          </div>
          <div>
            <QuickActions />
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

export default Index;

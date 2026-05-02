import { FileText, PlayCircle, ClipboardCheck, TrendingUp } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentPops } from "@/components/dashboard/RecentPops";
import { QuickActions } from "@/components/dashboard/QuickActions";

const Index = () => {
  return (
    <AppLayout title="Dashboard">
      <div className="mx-auto w-full max-w-7xl space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Bem-vindo ao POPFlow
          </h1>
          <p className="max-w-3xl text-base text-muted-foreground">
            Centralize procedimentos operacionais, execuções e conhecimento da
            empresa em uma plataforma organizada e fácil de usar.
          </p>
        </header>

        <section
          aria-label="Resumo"
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <StatCard label="POPs cadastrados" value="48" icon={FileText} hint="Total na biblioteca" />
          <StatCard label="Execuções em andamento" value="12" icon={PlayCircle} hint="Em tempo real" />
          <StatCard label="Aguardando revisão" value="7" icon={ClipboardCheck} hint="Necessitam aprovação" />
          <StatCard label="Taxa de conclusão" value="86%" icon={TrendingUp} hint="Últimos 30 dias" />
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

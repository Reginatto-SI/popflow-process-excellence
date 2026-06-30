import { useState } from "react";
import { Building2, CheckCircle2, Plus, XCircle } from "lucide-react";
import { toast } from "sonner";

import { AppLayout } from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useCreateDepartamento, useDepartamentos, useUpdateDepartamento } from "@/hooks/useDepartamentos";

const ConfiguracoesDepartamentos = () => {
  const { data: departamentos = [], isLoading } = useDepartamentos({ incluirInativos: true });
  const createDepartamento = useCreateDepartamento();
  const updateDepartamento = useUpdateDepartamento();
  const [novoNome, setNovoNome] = useState("");
  const [nomesEditados, setNomesEditados] = useState<Record<string, string>>({});

  const criarDepartamento = async () => {
    try {
      await createDepartamento.mutateAsync(novoNome);
      setNovoNome("");
      toast.success("Departamento criado.");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const salvarNome = async (id: string, nomeAtual: string) => {
    const nome = nomesEditados[id] ?? nomeAtual;
    try {
      await updateDepartamento.mutateAsync({ id, nome });
      setNomesEditados((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      toast.success("Departamento atualizado.");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const alternarAtivo = async (id: string, ativo: boolean) => {
    try {
      await updateDepartamento.mutateAsync({ id, ativo });
      toast.success(ativo ? "Departamento ativado." : "Departamento inativado.");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <AppLayout title="Configurações">
      <div className="mx-auto w-full max-w-5xl space-y-5">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Departamentos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gerencie os departamentos disponíveis para cadastro e filtro de POPs.</p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><Plus className="h-4 w-4" />Novo departamento</CardTitle>
            <CardDescription>Nomes equivalentes por acento, caixa ou espaços extras são bloqueados por empresa.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label>Nome</Label>
              <Input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Ex.: Contabilidade" />
            </div>
            <Button onClick={criarDepartamento} disabled={createDepartamento.isPending}>Criar departamento</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><Building2 className="h-4 w-4" />Departamentos cadastrados</CardTitle>
            <CardDescription>Use inativação para retirar um departamento dos novos POPs sem quebrar registros antigos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading && <p className="text-sm text-muted-foreground">Carregando departamentos...</p>}
            {!isLoading && departamentos.length === 0 && <p className="text-sm text-muted-foreground">Nenhum departamento cadastrado.</p>}
            {departamentos.map((departamento) => (
              <div key={departamento.id} className="grid gap-3 rounded-lg border p-3 md:grid-cols-[1fr_auto_auto] md:items-center">
                <Input
                  value={nomesEditados[departamento.id] ?? departamento.nome}
                  onChange={(e) => setNomesEditados((prev) => ({ ...prev, [departamento.id]: e.target.value }))}
                />
                <div className="flex items-center gap-2">
                  <Badge variant={departamento.ativo ? "default" : "secondary"} className="gap-1">
                    {departamento.ativo ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    {departamento.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                  <Switch checked={departamento.ativo} onCheckedChange={(checked) => alternarAtivo(departamento.id, checked)} />
                </div>
                <Button variant="outline" onClick={() => salvarNome(departamento.id, departamento.nome)} disabled={updateDepartamento.isPending}>
                  Salvar
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default ConfiguracoesDepartamentos;

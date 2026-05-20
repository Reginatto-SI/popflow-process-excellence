import { type FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function Auth() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate("/", { replace: true });
  }, [session, loading, navigate]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate("/", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-sky-50 to-slate-100 px-4 py-8">
      <Card className="w-full max-w-md rounded-2xl border-border/80 bg-card/95 shadow-[0_24px_70px_-36px_rgba(7,89,133,0.35)] backdrop-blur">
        <CardHeader className="px-8 pb-4 pt-8 text-center">
          <div className="space-y-2">
            <p className="text-3xl font-bold tracking-wide text-[#075985]">JM</p>
            <CardTitle className="text-2xl font-semibold tracking-tight text-foreground">POPFlow</CardTitle>
          </div>
          <p className="pt-2 text-sm text-muted-foreground">Entre na sua conta para continuar</p>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="login-email" className="text-sm font-medium">
                Email
              </Label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="login-email"
                  type="email"
                  placeholder="Digite seu email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-pass" className="text-sm font-medium">
                Senha
              </Label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="login-pass"
                  type="password"
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pl-10"
                />
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full bg-[#075985] text-white shadow-sm hover:bg-[#064e73] focus-visible:ring-[#075985]"
              disabled={busy}
            >
              {busy ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-[#075985]" aria-hidden="true" />
            <span>Seus dados estão protegidos com segurança</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Crosshair, Shield } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Acesso — Central T.A.F" },
      { name: "description", content: "Login e cadastro no Portal do Operador Central T.A.F." },
    ],
  }),
});

const ADMIN_EMAIL = "felipecostanutricao@gmail.com";

async function routeUser(
  email: string | undefined | null,
  navigate: ReturnType<typeof useNavigate>
) {
  if (email && email.toLowerCase() === ADMIN_EMAIL) {
    navigate({ to: "/admin" });
  } else {
    navigate({ to: "/" });
  }
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        await routeUser(data.session.user.email, navigate);
      }
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success("Cadastro realizado", {
          description: "Vamos configurar o seu edital.",
        });
        navigate({ to: "/edital", search: { welcome: true } });
      } else {
        const { error, data } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Acesso autorizado");
        await routeUser(data.user?.email, navigate);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error("Falha na operação", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md panel panel-neon shadow-neon p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-md panel panel-neon flex items-center justify-center">
            <Crosshair className="h-6 w-6 text-neon" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[10px] font-mono-tac text-muted-foreground uppercase tracking-widest">
              Portal do Operador
            </p>
            <h1 className="text-lg font-bold font-mono-tac uppercase tracking-widest text-glow text-neon">
              Central T.A.F
            </h1>
          </div>
        </div>

        <div className="flex gap-2 mb-6 p-1 bg-background/60 border border-border rounded-md">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 py-2 text-xs font-mono-tac uppercase tracking-widest rounded ${
              mode === "login"
                ? "bg-neon text-primary-foreground shadow-neon"
                : "text-muted-foreground"
            }`}
          >
            Acessar
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 py-2 text-xs font-mono-tac uppercase tracking-widest rounded ${
              mode === "signup"
                ? "bg-neon text-primary-foreground shadow-neon"
                : "text-muted-foreground"
            }`}
          >
            Recrutar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <Label className="text-[11px] font-mono-tac uppercase tracking-widest text-muted-foreground">
                Nome de Operador
              </Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="mt-1 h-11 bg-background/50 focus-visible:ring-neon focus-visible:border-neon"
              />
            </div>
          )}
          <div>
            <Label className="text-[11px] font-mono-tac uppercase tracking-widest text-muted-foreground">
              Email
            </Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="mt-1 h-11 bg-background/50 focus-visible:ring-neon focus-visible:border-neon"
            />
          </div>
          <div>
            <Label className="text-[11px] font-mono-tac uppercase tracking-widest text-muted-foreground">
              Senha
            </Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="mt-1 h-11 bg-background/50 focus-visible:ring-neon focus-visible:border-neon"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 font-mono-tac uppercase tracking-[0.2em] text-sm bg-neon text-primary-foreground hover:bg-neon/90 shadow-neon"
          >
            <Shield className="h-4 w-4" />
            {loading ? "Processando..." : mode === "login" ? "Entrar em Operação" : "Iniciar Recrutamento"}
          </Button>
        </form>

        <p className="mt-6 text-center text-[10px] font-mono-tac uppercase tracking-[0.3em] text-muted-foreground">
          <Link to="/">// Voltar //</Link>
        </p>
      </div>
    </div>
  );
}

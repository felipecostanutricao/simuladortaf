import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Crosshair, Shield, CheckCircle2, Send, Lock, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Recrutamento — Central T.A.F" },
      { name: "description", content: "Portal de acesso e recrutamento Central T.A.F. Assine, envie comprovante e infiltre-se no simulador tático." },
    ],
  }),
});

const ADMIN_EMAIL = "felipecostanutricao@gmail.com";
const WHATSAPP_URL = "https://wa.me/5561991317884?text=Comandante,%20solicito%20permiss%C3%A3o%20para%20infiltra%C3%A7%C3%A3o.%20Segue%20o%20comprovante%20da%20Central%20T.A.F.";
const PAYMENT_URL = "#";

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
        // Logout imediato — recruta precisa de validação manual antes de operar
        await supabase.auth.signOut();
        toast.success("RECRUTAMENTO REGISTRADO", {
          description: "Realize o pagamento e envie o comprovante via WhatsApp para liberação do acesso.",
        });
        setMode("login");
      } else {
        const { error, data } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        // Verificar is_active no profile
        const userId = data.user?.id;
        if (userId) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("is_active")
            .eq("id", userId)
            .maybeSingle();

          if (!profile?.is_active) {
            await supabase.auth.signOut();
            toast.error("ACESSO NEGADO", {
              description: "Aguardando validação do comprovante pelo Comando.",
            });
            setLoading(false);
            return;
          }
        }

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
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-2xl mx-auto space-y-10">
        {/* === FORM === */}
        <div className="panel panel-neon shadow-neon p-8">
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
                mode === "login" ? "bg-neon text-primary-foreground shadow-neon" : "text-muted-foreground"
              }`}
            >
              Acessar
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 text-xs font-mono-tac uppercase tracking-widest rounded ${
                mode === "signup" ? "bg-neon text-primary-foreground shadow-neon" : "text-muted-foreground"
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

        {/* === PLANO ÚNICO === */}
        <div className="panel panel-neon shadow-neon p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 bg-neon text-primary-foreground py-1.5 text-[10px] font-mono-tac uppercase tracking-[0.3em] font-bold">
            // Acesso Tático //
          </div>
          <div className="pt-6">
            <p className="text-[11px] font-mono-tac uppercase tracking-widest text-muted-foreground mb-2">
              Plano Único de Acesso
            </p>
            <h2 className="text-2xl font-bold font-mono-tac uppercase tracking-widest text-neon text-glow mb-4">
              Acesso Mensal
            </h2>
            <div className="my-6">
              <span className="text-5xl font-bold font-mono-tac text-neon text-glow">R$ 6,90</span>
              <span className="text-sm font-mono-tac text-muted-foreground uppercase ml-2">/ mês</span>
            </div>
            <ul className="text-left max-w-xs mx-auto space-y-2 mb-6 text-sm">
              <li className="flex items-center gap-2 text-foreground">
                <CheckCircle2 className="h-4 w-4 text-neon flex-shrink-0" />
                <span className="font-mono-tac text-xs uppercase tracking-wider">Simulador TAF Completo</span>
              </li>
              <li className="flex items-center gap-2 text-foreground">
                <CheckCircle2 className="h-4 w-4 text-neon flex-shrink-0" />
                <span className="font-mono-tac text-xs uppercase tracking-wider">Evolução & Métricas</span>
              </li>
              <li className="flex items-center gap-2 text-foreground">
                <CheckCircle2 className="h-4 w-4 text-neon flex-shrink-0" />
                <span className="font-mono-tac text-xs uppercase tracking-wider">Countdown Tático</span>
              </li>
            </ul>
            <a href={PAYMENT_URL}>
              <Button className="w-full h-12 font-mono-tac uppercase tracking-[0.2em] text-sm bg-neon text-primary-foreground hover:bg-neon/90 shadow-neon">
                <Lock className="h-4 w-4" />
                Assinar Agora
              </Button>
            </a>
          </div>
        </div>

        {/* === PROTOCOLO === */}
        <div className="space-y-4">
          <div className="text-center mb-6">
            <p className="text-[10px] font-mono-tac uppercase tracking-[0.3em] text-muted-foreground">
              // Briefing Operacional //
            </p>
            <h2 className="text-xl font-bold font-mono-tac uppercase tracking-widest text-neon text-glow mt-1">
              Protocolo de Infiltração
            </h2>
            <p className="text-xs font-mono-tac uppercase tracking-wider text-muted-foreground mt-1">
              Próximos Passos
            </p>
          </div>

          {/* 01 */}
          <div className="panel panel-neon p-6 flex gap-4 items-start">
            <div className="text-3xl font-bold font-mono-tac text-neon text-glow flex-shrink-0 w-12">
              01
            </div>
            <div className="flex-1">
              <h3 className="font-mono-tac uppercase tracking-widest text-sm font-bold text-foreground mb-1">
                Assinatura
              </h3>
              <p className="text-xs text-muted-foreground font-mono-tac">
                Conclua o pagamento do acesso mensal através do botão "ASSINAR AGORA".
              </p>
            </div>
          </div>

          {/* 02 */}
          <div className="panel panel-neon p-6 flex gap-4 items-start">
            <div className="text-3xl font-bold font-mono-tac text-neon text-glow flex-shrink-0 w-12">
              02
            </div>
            <div className="flex-1">
              <h3 className="font-mono-tac uppercase tracking-widest text-sm font-bold text-foreground mb-1">
                Envio do Comprovante
              </h3>
              <p className="text-xs text-muted-foreground font-mono-tac mb-4">
                Envie o recibo para a Central via WhatsApp para validação imediata pelo Comando.
              </p>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                <Button className="w-full h-11 font-mono-tac uppercase tracking-[0.2em] text-xs bg-neon text-primary-foreground hover:bg-neon/90 shadow-neon">
                  <MessageCircle className="h-4 w-4" />
                  Enviar Comprovante
                </Button>
              </a>
            </div>
          </div>

          {/* 03 */}
          <div className="panel panel-neon p-6 flex gap-4 items-start">
            <div className="text-3xl font-bold font-mono-tac text-neon text-glow flex-shrink-0 w-12">
              03
            </div>
            <div className="flex-1">
              <h3 className="font-mono-tac uppercase tracking-widest text-sm font-bold text-foreground mb-1">
                Infiltração
              </h3>
              <p className="text-xs text-muted-foreground font-mono-tac">
                Aguarde a liberação da credencial pelo Comando para acessar o simulador tático.
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-[10px] font-mono-tac uppercase tracking-[0.3em] text-muted-foreground pt-4">
          // Central T.A.F — Treinamento Tático de Alto Rendimento //
        </p>
      </div>
    </div>
  );
}

import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Crosshair, Shield, CheckCircle2, Lock, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Typewriter } from "@/components/taf/Typewriter";
import { playHover, playSuccess, playError, unlockAudio } from "@/lib/audio/audioService";

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
const PAYMENT_URL = "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=506ee1b8bf3d43c3b2123e38f4e9fec7";

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
    unlockAudio();
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
        await supabase.auth.signOut();
        playSuccess();
        toast.success("RECRUTAMENTO REGISTRADO", {
          description: "Realize o pagamento e envie o comprovante via WhatsApp para liberação do acesso.",
        });
        setMode("login");
      } else {
        const { error, data } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        const userId = data.user?.id;
        if (userId) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("is_active")
            .eq("id", userId)
            .maybeSingle();

          if (!profile?.is_active) {
            await supabase.auth.signOut();
            playError();
            toast.error("ACESSO NEGADO", {
              description: "Aguardando validação do comprovante pelo Comando.",
            });
            setLoading(false);
            return;
          }
        }

        playSuccess();
        toast.success("Acesso autorizado");
        await routeUser(data.user?.email, navigate);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      playError();
      toast.error("Falha na operação", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    show: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: 0.1 + i * 0.12, duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
    }),
  };

  const neonBtn =
    "w-full h-12 font-mono-tac uppercase tracking-[0.2em] text-sm bg-neon text-primary-foreground hover:bg-neon/90 shadow-neon animate-pulse-neon transition-all duration-200 hover:shadow-[0_0_40px_8px_color-mix(in_oklab,var(--neon)_55%,transparent)]";

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-2xl mx-auto space-y-10">
        {/* === FORM === */}
        <motion.div
          custom={0}
          initial="hidden"
          animate="show"
          variants={fadeUp}
          className="panel panel-neon shadow-neon p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-md panel panel-neon flex items-center justify-center">
              <Crosshair className="h-6 w-6 text-neon" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[10px] font-mono-tac text-muted-foreground uppercase tracking-widest">
                <Typewriter text="Portal do Operador" speedMs={45} />
              </p>
              <h1 className="text-lg font-bold font-mono-tac uppercase tracking-widest text-glow text-neon">
                <Typewriter text="Central T.A.F" speedMs={70} startDelayMs={400} />
              </h1>
            </div>
          </div>

          <div className="flex gap-2 mb-6 p-1 bg-background/60 border border-border rounded-md">
            <button
              type="button"
              onMouseEnter={playHover}
              onClick={() => setMode("login")}
              className={`flex-1 py-2 text-xs font-mono-tac uppercase tracking-widest rounded transition-all ${
                mode === "login" ? "bg-neon text-primary-foreground shadow-neon" : "text-muted-foreground"
              }`}
            >
              Acessar
            </button>
            <button
              type="button"
              onMouseEnter={playHover}
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 text-xs font-mono-tac uppercase tracking-widest rounded transition-all ${
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
                  onMouseEnter={playHover}
                  required
                  className="mt-1 h-11 bg-background/50 focus-visible:ring-neon focus-visible:border-neon"
                />
                <p className="mt-1.5 text-[10px] font-mono-tac uppercase tracking-wider text-muted-foreground">
                  Pode ser o seu nome real ou nome de guerra.
                </p>
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
                onMouseEnter={playHover}
                required
                autoComplete="email"
                className="mt-1 h-11 bg-background/50 focus-visible:ring-neon focus-visible:border-neon"
              />
              {mode === "signup" && (
                <p className="mt-1.5 text-[10px] font-mono-tac tracking-wider text-neon/90 leading-relaxed">
                  <span className="uppercase font-bold">// Dica de segurança //</span>{" "}
                  <span className="text-muted-foreground normal-case">
                    Crie um e-mail apenas para uso no app. Isso aumenta sua segurança e protege seus dados reais de qualquer vazamento.
                  </span>
                </p>
              )}
            </div>
            <div>
              <Label className="text-[11px] font-mono-tac uppercase tracking-widest text-muted-foreground">
                Senha
              </Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onMouseEnter={playHover}
                required
                minLength={6}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="mt-1 h-11 bg-background/50 focus-visible:ring-neon focus-visible:border-neon"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              onMouseEnter={playHover}
              className={neonBtn}
            >
              <Shield className="h-4 w-4" />
              {loading ? "Processando..." : mode === "login" ? "Entrar em Operação" : "Iniciar Recrutamento"}
            </Button>
          </form>

          <p className="mt-6 text-center text-[10px] font-mono-tac uppercase tracking-[0.3em] text-muted-foreground">
            <Link to="/">// Voltar //</Link>
          </p>
        </motion.div>

        {/* === PLANO ÚNICO === */}
        <motion.div
          custom={1}
          initial="hidden"
          animate="show"
          variants={fadeUp}
          className="panel panel-neon shadow-neon p-8 text-center relative overflow-hidden"
        >
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
            <a
              href={PAYMENT_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => { unlockAudio(); playSuccess(); }}
            >
              <Button onMouseEnter={playHover} className={neonBtn}>
                <Lock className="h-4 w-4" />
                Assinar Agora
              </Button>
            </a>
          </div>
        </motion.div>

        {/* === PROTOCOLO === */}
        <div className="space-y-4">
          <motion.div
            custom={2}
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="text-center mb-6"
          >
            <p className="text-[10px] font-mono-tac uppercase tracking-[0.3em] text-muted-foreground">
              // Briefing Operacional //
            </p>
            <h2 className="text-xl font-bold font-mono-tac uppercase tracking-widest text-neon text-glow mt-1">
              Protocolo de Infiltração
            </h2>
            <p className="text-xs font-mono-tac uppercase tracking-wider text-muted-foreground mt-1">
              Próximos Passos
            </p>
          </motion.div>

          {/* 01 */}
          <motion.div
            custom={3}
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="panel panel-neon p-6 flex gap-4 items-start"
          >
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
          </motion.div>

          {/* 02 */}
          <motion.div
            custom={4}
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="panel panel-neon p-6 flex gap-4 items-start"
          >
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
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => { unlockAudio(); playSuccess(); }}
              >
                <Button onMouseEnter={playHover} className={`${neonBtn} h-11 text-xs`}>
                  <MessageCircle className="h-4 w-4" />
                  Enviar Comprovante
                </Button>
              </a>
            </div>
          </motion.div>

          {/* 03 */}
          <motion.div
            custom={5}
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="panel panel-neon p-6 flex gap-4 items-start"
          >
            <div className="text-3xl font-bold font-mono-tac text-neon text-glow flex-shrink-0 w-12">
              03
            </div>
            <div className="flex-1">
              <h3 className="font-mono-tac uppercase tracking-widest text-sm font-bold text-foreground mb-1">
                Infiltração e Acesso
              </h3>
              <p className="text-xs text-muted-foreground font-mono-tac">
                Assim que receber a confirmação via WhatsApp, retorne a este portal e utilize o e-mail e a senha que você acabou de cadastrar para entrar em operação.
              </p>
            </div>
          </motion.div>
        </div>

        <p className="text-center text-[10px] font-mono-tac uppercase tracking-[0.3em] text-muted-foreground pt-4">
          // Central T.A.F — Treinamento Tático de Alto Rendimento //
        </p>
      </div>
    </div>
  );
}

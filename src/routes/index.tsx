import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/taf/Header";
import { CountdownTatico } from "@/components/taf/CountdownTatico";
import { SimularForm } from "@/components/taf/SimularForm";
import { RadarChartTaf } from "@/components/taf/RadarChartTaf";
import { EvolucaoChart } from "@/components/taf/EvolucaoChart";
import { BioestatisticaSection } from "@/components/taf/BioestatisticaSection";
import { ConfigEditalModal } from "@/components/taf/ConfigEditalModal";
import { DailyReadinessForm } from "@/components/taf/DailyReadinessForm";
import { RankingTab, getRankInfo } from "@/components/taf/RankingTab";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  METAS_PADRAO,
  buildTafGoalsPayload,
  indiceProntidao,
  rowToMetas,
  rowToSimulado,
  type Metas,
  type Simulado,
  type EvolucaoPoint,
} from "@/lib/taf-data";
import {
  Crosshair,
  Radar as RadarIcon,
  LineChart as LineIcon,
  CalendarClock,
  KeyRound,
  ShieldAlert,
  Scale as ScaleIcon,
  HelpCircle,
  UserCog,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Portal do Operador — Central T.A.F" },
      {
        name: "description",
        content:
          "Dashboard tático para preparação do TAF: simulados, radar de performance e evolução do índice de prontidão.",
      },
    ],
  }),
});

const FALLBACK_TAF_DATE = new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString();

function Index() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [metas, setMetas] = useState<Metas>(METAS_PADRAO);
  const [dataTaf, setDataTaf] = useState<string | null>(null);
  const [simulado, setSimulado] = useState<Simulado>({
    barra: 0,
    flexao: 0,
    corrida: 0,
    natacao: 0,
  });
  const [evolucao, setEvolucao] = useState<EvolucaoPoint[]>([]);
  const [configOpen, setConfigOpen] = useState(false);
  const [expiryDate, setExpiryDate] = useState<string | null>(null);
  const [hiringDate, setHiringDate] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [nomeDeGuerra, setNomeDeGuerra] = useState("");
  const [nomeLoading, setNomeLoading] = useState(false);

  // Auth guard + admin redirect + active check
  useEffect(() => {
    const checkAccess = async (session: { user: { id: string; email?: string } } | null) => {
      if (!session) {
        navigate({ to: "/auth" });
        return;
      }
      const email = session.user.email?.toLowerCase();
      if (email === "felipecostanutricao@gmail.com") {
        navigate({ to: "/admin" });
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_active, expiry_date, hiring_date, nome_de_guerra")
        .eq("id", session.user.id)
        .maybeSingle();
      if (profile && profile.is_active === false) {
        toast.error("Acesso bloqueado", {
          description: "Operador desativado. Contate o comando.",
        });
        await supabase.auth.signOut();
        navigate({ to: "/auth" });
        return;
      }
      if (profile?.expiry_date && new Date(profile.expiry_date).getTime() < Date.now()) {
        toast.error("Vigência expirada", {
          description: "Renove sua assinatura com o Comando.",
        });
        await supabase.auth.signOut();
        navigate({ to: "/auth" });
        return;
      }
      setExpiryDate(profile?.expiry_date ?? null);
      setHiringDate(profile?.hiring_date ?? null);
      setNomeDeGuerra(profile?.nome_de_guerra ?? "");
      setUserId(session.user.id);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      checkAccess(session as never);
    });
    supabase.auth.getSession().then(async ({ data }) => {
      await checkAccess(data.session as never);
      setAuthChecked(true);
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  // Load data
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const [goalsRes, recordsRes] = await Promise.all([
        supabase
          .from("taf_goals")
          .select("barra_meta, flexao_meta, corrida_meta, natacao_meta, data_taf")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("taf_records")
          .select("id, barra_result, flexao_result, corrida_result, natacao_result, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: true }),
      ]);

      const loadedMetas = rowToMetas(goalsRes.data);
      setMetas(loadedMetas);
      setDataTaf(goalsRes.data?.data_taf ?? null);

      const records = recordsRes.data ?? [];
      if (records.length > 0) {
        // Radar usa sempre o último registro
        setSimulado(rowToSimulado(records[records.length - 1]));
      }
      setEvolucao(
        records.map((r) => ({
          data: new Date(r.created_at).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
          }),
          indice: indiceProntidao(rowToSimulado(r), loadedMetas),
        })),
      );
    })();
  }, [userId]);

  const indiceAtual = useMemo(() => indiceProntidao(simulado, metas), [simulado, metas]);

  const tafDateIso = useMemo(() => {
    if (!dataTaf) return FALLBACK_TAF_DATE;
    const d = new Date(dataTaf);
    d.setHours(8, 0, 0, 0);
    return d.toISOString();
  }, [dataTaf]);

  const handleSalvarSimulado = async (s: Simulado) => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("taf_records")
      .insert({
        user_id: userId,
        barra_result: s.barra,
        flexao_result: s.flexao,
        corrida_result: s.corrida,
        natacao_result: s.natacao,
      })
      .select("created_at")
      .single();

    if (error) {
      toast.error("Falha ao salvar", { description: error.message });
      return;
    }

    setSimulado(s);
    const label = new Date(data.created_at).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
    setEvolucao((prev) => [...prev, { data: label, indice: indiceProntidao(s, metas) }]);
  };

  const handleSalvarMetas = async (m: Metas) => {
    if (!userId) return;
    try {
      const payload = buildTafGoalsPayload(userId, m, dataTaf);

      const { data: existingGoal, error: selectError } = await supabase
        .from("taf_goals")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (selectError) throw selectError;

      const { error } = existingGoal
        ? await supabase
            .from("taf_goals")
            .update({
              barra_meta: payload.barra_meta,
              flexao_meta: payload.flexao_meta,
              corrida_meta: payload.corrida_meta,
              natacao_meta: payload.natacao_meta,
              data_taf: payload.data_taf,
              user_id: payload.user_id,
            })
            .eq("user_id", userId)
        : await supabase.from("taf_goals").insert(payload);

      if (error) throw error;
    } catch (err) {
      console.error("Erro técnico ao salvar taf_goals:", err);
      toast.error("Falha ao atualizar edital", {
        description: err instanceof Error ? err.message : "Tente novamente",
      });
      return;
    }
    setMetas(m);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("Senha curta", { description: "Use no mínimo 8 caracteres." });
      return;
    }
    setPwLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPwLoading(false);
    if (error) {
      toast.error("Falha ao atualizar senha", { description: error.message });
      return;
    }
    toast.success("Senha atualizada", { description: "Use a nova senha no próximo acesso." });
    setNewPassword("");
  };

  const handleSaveNomeDeGuerra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setNomeLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ nome_de_guerra: nomeDeGuerra.trim() })
      .eq("id", userId);
    setNomeLoading(false);
    if (error) {
      toast.error("Falha ao salvar", { description: error.message });
      return;
    }
    toast.success("Nome de Guerra salvo", { description: "Identificador atualizado com sucesso." });
  };

  const expiryInfo = useMemo(() => {
    if (!expiryDate) return null;
    const exp = new Date(expiryDate);
    const days = Math.ceil((exp.getTime() - Date.now()) / 86400000);
    return {
      formatted: exp.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      days,
      critical: days <= 5,
    };
  }, [expiryDate]);

  const hiringFormatted = useMemo(() => {
    if (!hiringDate) return null;
    return new Date(hiringDate).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }, [hiringDate]);

  if (!authChecked || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground font-mono-tac uppercase text-xs tracking-widest">
        Autenticando operador...
      </div>
    );
  }

  return (
    <div className="min-h-screen text-foreground">
      <Header
        onConfigurar={() => navigate({ to: "/edital", search: {} as never })}
        onLogout={handleLogout}
      />

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-6xl">
        <CountdownTatico targetDate={tafDateIso} />

        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="Índice Geral"
            value={`${indiceAtual}`}
            suffix="pts"
            highlight
            tooltip="O Índice Geral avalia o cumprimento da missão. Cada modalidade atingida equivale a 100% de aproveitamento. O índice final é a média das provas. Exceder a meta cria reserva tática (física), mas não eleva o índice acima de 100 pts, focando na aprovação segura e prevenção de lesões."
          />
          <StatCard label="Barra Fixa" value={`${simulado.barra}`} suffix={`/${metas.barra}`} />
          <StatCard label="Flexão" value={`${simulado.flexao}`} suffix={`/${metas.flexao}`} />
          <StatCard
            label="Corrida 12'"
            value={`${simulado.corrida}`}
            suffix={`/${metas.corrida}m`}
          />
        </section>

        <Tabs defaultValue="simular" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-card border border-border h-12 p-1">
            <TabsTrigger
              value="simular"
              className="font-mono-tac uppercase text-xs tracking-widest data-[state=active]:bg-neon data-[state=active]:text-primary-foreground data-[state=active]:shadow-neon"
            >
              <Crosshair className="h-4 w-4 mr-1.5" />
              Simular
            </TabsTrigger>
            <TabsTrigger
              value="radar"
              className="font-mono-tac uppercase text-xs tracking-widest data-[state=active]:bg-neon data-[state=active]:text-primary-foreground data-[state=active]:shadow-neon"
            >
              <RadarIcon className="h-4 w-4 mr-1.5" />
              Radar
            </TabsTrigger>
            <TabsTrigger
              value="evolucao"
              className="font-mono-tac uppercase text-xs tracking-widest data-[state=active]:bg-neon data-[state=active]:text-primary-foreground data-[state=active]:shadow-neon"
            >
              <LineIcon className="h-4 w-4 mr-1.5" />
              Evolução
            </TabsTrigger>
            <TabsTrigger
              value="bio"
              className="font-mono-tac uppercase text-xs tracking-widest data-[state=active]:bg-neon data-[state=active]:text-primary-foreground data-[state=active]:shadow-neon"
            >
              <ScaleIcon className="h-4 w-4 mr-1.5" />
              Bio
            </TabsTrigger>
          </TabsList>

          <TabsContent value="simular" className="mt-5">
            <SimularForm onSalvar={handleSalvarSimulado} initial={simulado} />
          </TabsContent>

          <TabsContent value="radar" className="mt-5">
            <RadarChartTaf simulado={simulado} metas={metas} />
          </TabsContent>

          <TabsContent value="evolucao" className="mt-5">
            <EvolucaoChart data={evolucao} />
          </TabsContent>

          <TabsContent value="bio" className="mt-5">
            <BioestatisticaSection userId={userId} />
          </TabsContent>
        </Tabs>

        {/* === STATUS DA MISSÃO === */}
        <section className="grid md:grid-cols-2 gap-4">
          <div className={`panel p-5 ${expiryInfo?.critical ? "panel-neon shadow-neon" : ""}`}>
            <div className="flex items-center gap-2 mb-3">
              <CalendarClock
                className={`h-4 w-4 ${expiryInfo?.critical ? "text-destructive" : "text-neon"}`}
              />
              <h3 className="font-mono-tac uppercase text-xs tracking-widest text-foreground font-bold">
                Status da Missão
              </h3>
            </div>
            {expiryInfo ? (
              <>
                <div className="text-[10px] font-mono-tac uppercase tracking-widest text-muted-foreground">
                  Vencimento da Vigência
                </div>
                <div
                  className={`mt-1 text-2xl font-mono-tac font-bold tabular-nums ${expiryInfo.critical ? "text-destructive" : "text-neon text-glow"}`}
                >
                  {expiryInfo.formatted}
                </div>
                <p className="mt-2 text-[11px] font-mono-tac uppercase tracking-wider text-muted-foreground">
                  {expiryInfo.days > 0
                    ? `${expiryInfo.days} dia(s) restantes`
                    : "Vigência expirada — contate o Comando"}
                </p>
                {hiringFormatted && (
                  <p className="mt-3 text-[10px] font-mono-tac uppercase tracking-widest text-muted-foreground">
                    Início: <span className="text-foreground">{hiringFormatted}</span>
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs font-mono-tac text-muted-foreground">
                Vigência não definida. Contate o Comando.
              </p>
            )}
          </div>

          {/* === SEGURANÇA === */}
          <div className="panel p-5">
            <div className="flex items-center gap-2 mb-3">
              <KeyRound className="h-4 w-4 text-neon" />
              <h3 className="font-mono-tac uppercase text-xs tracking-widest text-foreground font-bold">
                Segurança
              </h3>
            </div>
            <p className="text-[11px] font-mono-tac text-muted-foreground mb-3 uppercase tracking-wider">
              Altere sua senha de operador
            </p>
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <Label className="text-[10px] font-mono-tac uppercase tracking-widest text-muted-foreground">
                  Nova Senha
                </Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                  required
                  autoComplete="new-password"
                  className="mt-1 h-10 bg-background/50 focus-visible:ring-neon focus-visible:border-neon"
                />
              </div>
              <Button
                type="submit"
                disabled={pwLoading}
                className="w-full h-10 font-mono-tac uppercase tracking-widest text-xs bg-neon text-primary-foreground hover:bg-neon/90 shadow-neon"
              >
                <ShieldAlert className="h-4 w-4" />
                {pwLoading ? "Atualizando..." : "Atualizar Senha"}
              </Button>
            </form>
          </div>
          {/* === NOME DE GUERRA === */}
          <div className="panel p-5">
            <div className="flex items-center gap-2 mb-3">
              <UserCog className="h-4 w-4 text-neon" />
              <h3 className="font-mono-tac uppercase text-xs tracking-widest text-foreground font-bold">
                Nome de Guerra
              </h3>
            </div>
            <p className="text-[10px] font-mono-tac text-muted-foreground mb-3 uppercase tracking-wider">
              Este será o seu único identificador público nos futuros painéis de ranking tático.
            </p>
            <form onSubmit={handleSaveNomeDeGuerra} className="space-y-3">
              <div>
                <Label className="text-[10px] font-mono-tac uppercase tracking-widest text-muted-foreground">
                  Nome de Guerra
                </Label>
                <Input
                  type="text"
                  value={nomeDeGuerra}
                  onChange={(e) => setNomeDeGuerra(e.target.value)}
                  placeholder="Ex: BRAVO-7"
                  className="mt-1 h-10 bg-background/50 focus-visible:ring-neon focus-visible:border-neon"
                />
              </div>
              <Button
                type="submit"
                disabled={nomeLoading}
                className="w-full h-10 font-mono-tac uppercase tracking-widest text-xs bg-neon text-primary-foreground hover:bg-neon/90 shadow-neon"
              >
                <UserCog className="h-4 w-4" />
                {nomeLoading ? "Salvando..." : "Salvar Nome de Guerra"}
              </Button>
            </form>
          </div>
        </section>

        <footer className="pt-6 pb-4 text-center space-y-1">
          <div className="text-[10px] font-mono-tac uppercase tracking-[0.3em] text-muted-foreground">
            // Central T.A.F — Sistema de Comando Operacional //
          </div>
          <a
            href="/termos"
            className="text-[10px] font-mono-tac uppercase tracking-widest text-muted-foreground hover:text-neon transition-colors"
          >
            Termos e Condições de Uso
          </a>
        </footer>
      </main>

      <ConfigEditalModal
        open={configOpen}
        onOpenChange={setConfigOpen}
        metas={metas}
        onSalvar={handleSalvarMetas}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix,
  highlight,
  tooltip,
}: {
  label: string;
  value: string;
  suffix?: string;
  highlight?: boolean;
  tooltip?: string;
}) {
  return (
    <div className={`panel p-3 ${highlight ? "panel-neon shadow-neon" : ""}`}>
      <div className="text-[10px] font-mono-tac uppercase tracking-widest text-muted-foreground flex items-center gap-1">
        {label}
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-neon cursor-help transition-colors" />
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="max-w-xs text-[11px] leading-relaxed font-mono-tac normal-case tracking-normal bg-card border-border text-foreground"
              >
                {tooltip}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span
          className={`font-mono-tac text-2xl font-bold tabular-nums ${
            highlight ? "text-neon text-glow" : "text-foreground"
          }`}
        >
          {value}
        </span>
        {suffix && (
          <span className="text-[11px] font-mono-tac text-muted-foreground">{suffix}</span>
        )}
      </div>
    </div>
  );
}

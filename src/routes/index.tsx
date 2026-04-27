import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/taf/Header";
import { CountdownTatico } from "@/components/taf/CountdownTatico";
import { SimularForm } from "@/components/taf/SimularForm";
import { RadarChartTaf } from "@/components/taf/RadarChartTaf";
import { EvolucaoChart } from "@/components/taf/EvolucaoChart";
import { ConfigEditalModal } from "@/components/taf/ConfigEditalModal";
import {
  EVOLUCAO_MOCK,
  METAS_PADRAO,
  SIMULADO_MOCK,
  indiceProntidao,
  type Metas,
  type Simulado,
} from "@/lib/taf-data";
import { Crosshair, Radar as RadarIcon, LineChart as LineIcon } from "lucide-react";

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

// Data alvo do TAF (60 dias a partir de hoje, fictícia)
const TAF_DATE = new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString();

function Index() {
  const [metas, setMetas] = useState<Metas>(METAS_PADRAO);
  const [simulado, setSimulado] = useState<Simulado>(SIMULADO_MOCK);
  const [evolucao, setEvolucao] = useState(EVOLUCAO_MOCK);
  const [configOpen, setConfigOpen] = useState(false);

  const indiceAtual = useMemo(() => indiceProntidao(simulado, metas), [simulado, metas]);

  const handleSalvarSimulado = (s: Simulado) => {
    setSimulado(s);
    const idx = indiceProntidao(s, metas);
    const hoje = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
    setEvolucao((prev) => [...prev, { data: hoje, indice: idx }].slice(-12));
  };

  return (
    <div className="min-h-screen text-foreground">
      <Header onConfigurar={() => setConfigOpen(true)} />

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-6xl">
        <CountdownTatico targetDate={TAF_DATE} />

        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Índice Geral" value={`${indiceAtual}`} suffix="pts" highlight />
          <StatCard label="Barra Fixa" value={`${simulado.barra}`} suffix={`/${metas.barra}`} />
          <StatCard label="Flexão" value={`${simulado.flexao}`} suffix={`/${metas.flexao}`} />
          <StatCard
            label="Corrida 12'"
            value={`${simulado.corrida}`}
            suffix={`/${metas.corrida}m`}
          />
        </section>

        <Tabs defaultValue="simular" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-card border border-border h-12 p-1">
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
        </Tabs>

        <footer className="pt-6 pb-4 text-center text-[10px] font-mono-tac uppercase tracking-[0.3em] text-muted-foreground">
          // Central T.A.F — Sistema de Comando Operacional //
        </footer>
      </main>

      <ConfigEditalModal
        open={configOpen}
        onOpenChange={setConfigOpen}
        metas={metas}
        onSalvar={setMetas}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix,
  highlight,
}: {
  label: string;
  value: string;
  suffix?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`panel p-3 ${
        highlight ? "panel-neon shadow-neon" : ""
      }`}
    >
      <div className="text-[10px] font-mono-tac uppercase tracking-widest text-muted-foreground">
        {label}
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

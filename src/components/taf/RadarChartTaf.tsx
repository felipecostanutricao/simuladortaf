import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { LABELS, scorePorModalidade, type Metas, type Modalidade, type Simulado } from "@/lib/taf-data";

type Props = {
  simulado: Simulado;
  metas: Metas;
};

export function RadarChartTaf({ simulado, metas }: Props) {
  const data = (Object.keys(LABELS) as Modalidade[]).map((k) => ({
    modalidade: LABELS[k],
    operador: Math.min(120, scorePorModalidade(simulado[k], metas[k], k)),
    meta: 100,
  }));

  return (
    <div className="panel panel-neon p-4 sm:p-6">
      <div className="mb-4">
        <h3 className="text-sm font-mono-tac uppercase tracking-widest text-neon text-glow">
          Mapa de Performance Tática
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Comparativo entre desempenho do operador e a Mancha de Prontidão (meta = 100).
        </p>
      </div>

      <div className="h-[360px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="75%">
            <PolarGrid stroke="oklch(0.30 0.015 240)" />
            <PolarAngleAxis
              dataKey="modalidade"
              tick={{ fill: "oklch(0.85 0.02 240)", fontSize: 11, fontFamily: "ui-monospace" }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 120]}
              tick={{ fill: "oklch(0.55 0.02 240)", fontSize: 10 }}
              stroke="oklch(0.30 0.015 240)"
            />
            <Radar
              name="Mancha de Prontidão"
              dataKey="meta"
              stroke="oklch(0.55 0.18 145)"
              fill="oklch(0.55 0.18 145)"
              fillOpacity={0.15}
              strokeDasharray="4 4"
            />
            <Radar
              name="Operador"
              dataKey="operador"
              stroke="oklch(0.85 0.24 145)"
              fill="oklch(0.85 0.24 145)"
              fillOpacity={0.45}
              strokeWidth={2}
            />
            <Tooltip
              contentStyle={{
                background: "oklch(0.18 0.012 240)",
                border: "1px solid oklch(0.30 0.015 240)",
                borderRadius: 8,
                fontFamily: "ui-monospace",
                fontSize: 12,
              }}
              labelStyle={{ color: "oklch(0.85 0.24 145)" }}
            />
            <Legend
              wrapperStyle={{
                fontFamily: "ui-monospace",
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

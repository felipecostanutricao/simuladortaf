import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

type Ponto = { data: string; indice: number };

type Props = {
  data: Ponto[];
};

export function EvolucaoChart({ data }: Props) {
  const ultimo = data[data.length - 1]?.indice ?? 0;
  const primeiro = data[0]?.indice ?? 0;
  const delta = ultimo - primeiro;

  return (
    <div className="panel panel-neon p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-mono-tac uppercase tracking-widest text-neon text-glow">
            Índice de Prontidão Geral
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Evolução da capacidade operacional ao longo do tempo.
          </p>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-mono-tac text-3xl font-bold text-neon tabular-nums">
            {ultimo}
          </span>
          <span
            className={`font-mono-tac text-xs uppercase ${
              delta >= 0 ? "text-neon" : "text-destructive"
            }`}
          >
            {delta >= 0 ? "+" : ""}
            {delta} pts
          </span>
        </div>
      </div>

      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="lineGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.85 0.24 145)" stopOpacity={1} />
                <stop offset="100%" stopColor="oklch(0.55 0.18 145)" stopOpacity={1} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="oklch(0.28 0.015 240)" strokeDasharray="3 3" />
            <XAxis
              dataKey="data"
              stroke="oklch(0.55 0.02 240)"
              tick={{ fontSize: 11, fontFamily: "ui-monospace" }}
            />
            <YAxis
              domain={[0, 100]}
              stroke="oklch(0.55 0.02 240)"
              tick={{ fontSize: 11, fontFamily: "ui-monospace" }}
            />
            <ReferenceLine
              y={70}
              stroke="oklch(0.55 0.18 145)"
              strokeDasharray="4 4"
              label={{
                value: "META OPERACIONAL",
                fill: "oklch(0.55 0.18 145)",
                fontSize: 10,
                fontFamily: "ui-monospace",
                position: "insideTopRight",
              }}
            />
            <Tooltip
              contentStyle={{
                background: "oklch(0.18 0.012 240)",
                border: "1px solid oklch(0.85 0.24 145 / 0.4)",
                borderRadius: 8,
                fontFamily: "ui-monospace",
                fontSize: 12,
              }}
              labelStyle={{ color: "oklch(0.85 0.24 145)" }}
              formatter={(v: number) => [`${v} pts`, "Prontidão"]}
            />
            <Line
              type="monotone"
              dataKey="indice"
              stroke="url(#lineGlow)"
              strokeWidth={3}
              dot={{ r: 4, fill: "oklch(0.85 0.24 145)", stroke: "oklch(0.16 0.01 240)", strokeWidth: 2 }}
              activeDot={{ r: 6, fill: "oklch(0.88 0.26 145)" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

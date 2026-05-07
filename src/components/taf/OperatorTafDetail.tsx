import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface TafRecord {
  barra_result: number;
  flexao_result: number;
  corrida_result: number;
  natacao_result: number;
  performed_at: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function calcIndice(r: TafRecord): number {
  const barra = Math.min((r.barra_result / 6) * 100, 100);
  const flexao = Math.min((r.flexao_result / 30) * 100, 100);
  const corrida = Math.min((r.corrida_result / 2400) * 100, 100);
  const natacao = Math.min((r.natacao_result / 60) * 100, 100);
  return Math.round((barra + flexao + corrida + natacao) / 4);
}

export function OperatorTafDetail({ userId, name, onClose }: { userId: string; name: string; onClose: () => void }) {
  const [records, setRecords] = useState<TafRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("taf_records")
      .select("barra_result, flexao_result, corrida_result, natacao_result, performed_at")
      .eq("user_id", userId)
      .order("performed_at", { ascending: true })
      .limit(20)
      .then(({ data }) => {
        if (data) setRecords(data);
        setLoading(false);
      });
  }, [userId]);

  const chartData = records.map((r) => ({
    data: formatDate(r.performed_at),
    indice: calcIndice(r),
  }));

  return (
    <div className="panel panel-neon p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-mono-tac uppercase text-xs tracking-widest text-neon text-glow font-bold">
          Evolução TAF — {name}
        </h3>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <p className="text-xs font-mono-tac text-muted-foreground uppercase tracking-widest">Carregando dados...</p>
      ) : records.length === 0 ? (
        <p className="text-xs font-mono-tac text-muted-foreground uppercase tracking-widest">Nenhum simulado registrado.</p>
      ) : (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-3.5 w-3.5 text-neon" />
            <span className="font-mono-tac uppercase text-[10px] tracking-widest text-neon font-bold">Índice Geral</span>
          </div>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="oklch(0.28 0.015 240)" strokeDasharray="3 3" />
                <XAxis dataKey="data" stroke="oklch(0.55 0.02 240)" tick={{ fontSize: 9, fontFamily: "ui-monospace" }} />
                <YAxis domain={[0, 100]} stroke="oklch(0.55 0.02 240)" tick={{ fontSize: 9, fontFamily: "ui-monospace" }} />
                <Tooltip
                  contentStyle={{ background: "oklch(0.18 0.012 240)", border: "1px solid oklch(0.85 0.24 145 / 0.4)", borderRadius: 8, fontFamily: "ui-monospace", fontSize: 10 }}
                  formatter={(v: number) => [`${v}%`, "Índice"]}
                />
                <Line type="monotone" dataKey="indice" stroke="oklch(0.85 0.24 145)" strokeWidth={2} dot={{ r: 3, fill: "oklch(0.85 0.24 145)" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

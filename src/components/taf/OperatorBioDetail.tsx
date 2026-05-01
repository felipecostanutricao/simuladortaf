import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Activity, TrendingUp, X } from "lucide-react";
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

interface PhysicalRecord {
  weight: number;
  height: number;
  bmi: number;
  created_at: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function classifyBmi(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: "Abaixo do Peso", color: "text-yellow-400" };
  if (bmi < 25) return { label: "Peso Ideal", color: "text-neon" };
  if (bmi < 30) return { label: "Sobrepeso", color: "text-orange-400" };
  return { label: "Obesidade", color: "text-destructive" };
}

export function OperatorBioDetail({ userId, name, onClose }: { userId: string; name: string; onClose: () => void }) {
  const [records, setRecords] = useState<PhysicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("physical_evolution")
      .select("weight, height, bmi, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setRecords(data.map(r => ({ weight: Number(r.weight), height: Number(r.height), bmi: Number(r.bmi), created_at: r.created_at })));
        setLoading(false);
      });
  }, [userId]);

  const weightData = records.map(r => ({ data: formatDate(r.created_at), peso: r.weight }));
  const bmiData = records.map(r => ({ data: formatDate(r.created_at), imc: r.bmi }));
  const last = records[records.length - 1];

  return (
    <div className="panel panel-neon p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-mono-tac uppercase text-xs tracking-widest text-neon text-glow font-bold">
          Bioestatística — {name}
        </h3>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <p className="text-xs font-mono-tac text-muted-foreground uppercase tracking-widest">Carregando dados...</p>
      ) : records.length === 0 ? (
        <p className="text-xs font-mono-tac text-muted-foreground uppercase tracking-widest">Nenhum registro biométrico.</p>
      ) : (
        <>
          {last && (
            <div className="flex gap-4 text-[10px] font-mono-tac uppercase tracking-widest text-muted-foreground">
              <span>Último: {last.weight}kg | {last.height}m | IMC {last.bmi}</span>
              <span className={classifyBmi(last.bmi).color}>{classifyBmi(last.bmi).label}</span>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-3.5 w-3.5 text-neon" />
                <span className="font-mono-tac uppercase text-[10px] tracking-widest text-neon font-bold">Peso</span>
              </div>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weightData} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke="oklch(0.28 0.015 240)" strokeDasharray="3 3" />
                    <XAxis dataKey="data" stroke="oklch(0.55 0.02 240)" tick={{ fontSize: 9, fontFamily: "ui-monospace" }} />
                    <YAxis stroke="oklch(0.55 0.02 240)" tick={{ fontSize: 9, fontFamily: "ui-monospace" }} />
                    <Tooltip contentStyle={{ background: "oklch(0.18 0.012 240)", border: "1px solid oklch(0.85 0.24 145 / 0.4)", borderRadius: 8, fontFamily: "ui-monospace", fontSize: 10 }} formatter={(v: number) => [`${v} kg`, "Peso"]} />
                    <Line type="monotone" dataKey="peso" stroke="oklch(0.85 0.24 145)" strokeWidth={2} dot={{ r: 3, fill: "oklch(0.85 0.24 145)" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-3.5 w-3.5 text-neon" />
                <span className="font-mono-tac uppercase text-[10px] tracking-widest text-neon font-bold">IMC</span>
              </div>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={bmiData} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke="oklch(0.28 0.015 240)" strokeDasharray="3 3" />
                    <XAxis dataKey="data" stroke="oklch(0.55 0.02 240)" tick={{ fontSize: 9, fontFamily: "ui-monospace" }} />
                    <YAxis domain={[15, 40]} stroke="oklch(0.55 0.02 240)" tick={{ fontSize: 9, fontFamily: "ui-monospace" }} />
                    <Tooltip contentStyle={{ background: "oklch(0.18 0.012 240)", border: "1px solid oklch(0.85 0.24 145 / 0.4)", borderRadius: 8, fontFamily: "ui-monospace", fontSize: 10 }} formatter={(v: number) => [`${v}`, "IMC"]} />
                    <Line type="monotone" dataKey="imc" stroke="oklch(0.85 0.24 145)" strokeWidth={2} dot={{ r: 3, fill: "oklch(0.85 0.24 145)" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

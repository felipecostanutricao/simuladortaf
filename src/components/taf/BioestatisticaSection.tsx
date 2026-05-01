import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { playSuccess, playError, playHover } from "@/lib/audio/audioService";
import { Activity, TrendingUp, Scale } from "lucide-react";
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
  id: string;
  weight: number;
  height: number;
  bmi: number;
  created_at: string;
}

function classifyBmi(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: "Abaixo do Peso", color: "text-yellow-400" };
  if (bmi < 25) return { label: "Peso Ideal", color: "text-neon" };
  if (bmi < 30) return { label: "Sobrepeso", color: "text-orange-400" };
  return { label: "Obesidade", color: "text-destructive" };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function BioestatisticaSection({ userId }: { userId: string }) {
  const [records, setRecords] = useState<PhysicalRecord[]>([]);
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("physical_evolution")
      .select("id, weight, height, bmi, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setRecords(data.map(r => ({ ...r, weight: Number(r.weight), height: Number(r.height), bmi: Number(r.bmi) })));
      });
  }, [userId]);

  const bmiCalc = useMemo(() => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (!w || !h || h <= 0) return null;
    return parseFloat((w / (h * h)).toFixed(2));
  }, [weight, height]);

  const classification = bmiCalc ? classifyBmi(bmiCalc) : null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (!w || !h || h <= 0) {
      playError();
      toast.error("Dados inválidos", { description: "Insira peso e altura válidos." });
      return;
    }
    const bmi = parseFloat((w / (h * h)).toFixed(2));
    setSaving(true);
    const { data, error } = await supabase
      .from("physical_evolution")
      .insert({ user_id: userId, weight: w, height: h, bmi })
      .select("id, weight, height, bmi, created_at")
      .single();
    setSaving(false);
    if (error) {
      playError();
      toast.error("Falha ao salvar", { description: error.message });
      return;
    }
    playSuccess();
    toast.success("Bioestatística registrada");
    setRecords(prev => [...prev, { ...data, weight: Number(data.weight), height: Number(data.height), bmi: Number(data.bmi) }]);
    setWeight("");
    setHeight("");
  };

  const weightData = records.map(r => ({ data: formatDate(r.created_at), peso: r.weight }));
  const bmiData = records.map(r => ({ data: formatDate(r.created_at), imc: r.bmi }));
  const lastRecord = records[records.length - 1];

  return (
    <div className="space-y-5">
      {/* Form */}
      <div className="panel p-5">
        <div className="flex items-center gap-2 mb-4">
          <Scale className="h-4 w-4 text-neon" />
          <h3 className="font-mono-tac uppercase text-xs tracking-widest text-neon text-glow font-bold">
            Registro Biométrico
          </h3>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[10px] font-mono-tac uppercase tracking-widest text-muted-foreground">
                Peso (kg)
              </Label>
              <Input
                type="number"
                step="0.1"
                min="30"
                max="300"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                placeholder="75.0"
                required
                className="mt-1 h-10 bg-background/50 focus-visible:ring-neon focus-visible:border-neon font-mono-tac"
              />
            </div>
            <div>
              <Label className="text-[10px] font-mono-tac uppercase tracking-widest text-muted-foreground">
                Altura (m)
              </Label>
              <Input
                type="number"
                step="0.01"
                min="1.00"
                max="2.50"
                value={height}
                onChange={e => setHeight(e.target.value)}
                placeholder="1.75"
                required
                className="mt-1 h-10 bg-background/50 focus-visible:ring-neon focus-visible:border-neon font-mono-tac"
              />
            </div>
          </div>

          {bmiCalc !== null && classification && (
            <div className="panel panel-neon p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono-tac uppercase tracking-widest text-muted-foreground">IMC Calculado</span>
                <div className="text-2xl font-mono-tac font-bold text-neon text-glow tabular-nums">{bmiCalc}</div>
              </div>
              <span className={`font-mono-tac uppercase text-xs tracking-widest font-bold ${classification.color}`}>
                {classification.label}
              </span>
            </div>
          )}

          <Button
            type="submit"
            disabled={saving}
            onMouseEnter={playHover}
            className="w-full h-10 font-mono-tac uppercase tracking-widest text-xs bg-neon text-primary-foreground hover:bg-neon/90 shadow-neon"
          >
            <Activity className="h-4 w-4" />
            {saving ? "Registrando..." : "Registrar Bioestatística"}
          </Button>
        </form>

        {lastRecord && (
          <div className="mt-4 pt-3 border-t border-border">
            <p className="text-[10px] font-mono-tac uppercase tracking-widest text-muted-foreground">
              Último registro: {lastRecord.weight}kg | {lastRecord.height}m | IMC {lastRecord.bmi} —{" "}
              <span className={classifyBmi(lastRecord.bmi).color}>{classifyBmi(lastRecord.bmi).label}</span>
            </p>
          </div>
        )}
      </div>

      {/* Charts */}
      {records.length >= 2 && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="panel panel-neon p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-neon" />
              <h4 className="font-mono-tac uppercase text-[10px] tracking-widest text-neon text-glow font-bold">
                Evolução de Peso
              </h4>
            </div>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightData} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke="oklch(0.28 0.015 240)" strokeDasharray="3 3" />
                  <XAxis dataKey="data" stroke="oklch(0.55 0.02 240)" tick={{ fontSize: 10, fontFamily: "ui-monospace" }} />
                  <YAxis stroke="oklch(0.55 0.02 240)" tick={{ fontSize: 10, fontFamily: "ui-monospace" }} />
                  <Tooltip
                    contentStyle={{ background: "oklch(0.18 0.012 240)", border: "1px solid oklch(0.85 0.24 145 / 0.4)", borderRadius: 8, fontFamily: "ui-monospace", fontSize: 11 }}
                    formatter={(v: number) => [`${v} kg`, "Peso"]}
                  />
                  <Line type="monotone" dataKey="peso" stroke="oklch(0.85 0.24 145)" strokeWidth={2.5} dot={{ r: 3, fill: "oklch(0.85 0.24 145)", stroke: "oklch(0.16 0.01 240)", strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="panel panel-neon p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-neon" />
              <h4 className="font-mono-tac uppercase text-[10px] tracking-widest text-neon text-glow font-bold">
                Índice de Performance / IMC
              </h4>
            </div>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={bmiData} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke="oklch(0.28 0.015 240)" strokeDasharray="3 3" />
                  <XAxis dataKey="data" stroke="oklch(0.55 0.02 240)" tick={{ fontSize: 10, fontFamily: "ui-monospace" }} />
                  <YAxis domain={[15, 40]} stroke="oklch(0.55 0.02 240)" tick={{ fontSize: 10, fontFamily: "ui-monospace" }} />
                  <Tooltip
                    contentStyle={{ background: "oklch(0.18 0.012 240)", border: "1px solid oklch(0.85 0.24 145 / 0.4)", borderRadius: 8, fontFamily: "ui-monospace", fontSize: 11 }}
                    formatter={(v: number) => [`${v}`, "IMC"]}
                  />
                  <Line type="monotone" dataKey="imc" stroke="oklch(0.85 0.24 145)" strokeWidth={2.5} dot={{ r: 3, fill: "oklch(0.85 0.24 145)", stroke: "oklch(0.16 0.01 240)", strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

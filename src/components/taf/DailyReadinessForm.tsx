import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { playSuccess, playError, playHover } from "@/lib/audio/audioService";
import { HeartPulse, Droplets, Moon, Activity, CheckCircle2 } from "lucide-react";

const HYDRATION_COLORS = [
  { level: 1, color: "#f7f7a0", label: "1", zone: "green" },
  { level: 2, color: "#e8e060", label: "2", zone: "green" },
  { level: 3, color: "#d4c840", label: "3", zone: "green" },
  { level: 4, color: "#c8a830", label: "4", zone: "yellow" },
  { level: 5, color: "#b89020", label: "5", zone: "yellow" },
  { level: 6, color: "#a07818", label: "6", zone: "yellow" },
  { level: 7, color: "#886010", label: "7", zone: "red" },
  { level: 8, color: "#604008", label: "8", zone: "red" },
];

function zoneBorder(zone: string) {
  if (zone === "green") return "ring-green-500";
  if (zone === "yellow") return "ring-yellow-500";
  return "ring-red-500";
}

function zoneLabel(level: number) {
  if (level <= 3) return { text: "Hidratado", color: "text-green-400" };
  if (level <= 6) return { text: "Atenção", color: "text-yellow-400" };
  return { text: "Alerta", color: "text-red-400" };
}

interface Props {
  userId: string;
}

export function DailyReadinessForm({ userId }: Props) {
  const [fatigue, setFatigue] = useState(5);
  const [borg, setBorg] = useState(5);
  const [hydration, setHydration] = useState(1);
  const [sleepHours, setSleepHours] = useState("");
  const [saving, setSaving] = useState(false);
  const [alreadyReported, setAlreadyReported] = useState(false);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    supabase
      .from("daily_readiness")
      .select("id")
      .eq("user_id", userId)
      .eq("report_date", today)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setAlreadyReported(true);
        setLoading(false);
      });
  }, [userId, today]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const hours = parseFloat(sleepHours);
    if (isNaN(hours) || hours < 0 || hours > 24) {
      playError();
      toast.error("Horas de sono inválidas");
      return;
    }

    setSaving(true);

    // Fetch XP value from system_settings
    const { data: settings } = await supabase
      .from("system_settings")
      .select("xp_daily_report")
      .eq("id", 1)
      .single();

    const xpValue = settings?.xp_daily_report ?? 3;

    const { error } = await supabase.from("daily_readiness").insert({
      user_id: userId,
      fatigue_level: fatigue,
      borg_rpe: borg,
      urine_color: hydration,
      sleep_hours: hours,
      report_date: today,
    } as any);

    if (error) {
      setSaving(false);
      if (error.code === "23505") {
        setAlreadyReported(true);
        toast.info("Reporte já registrado hoje.");
        return;
      }
      playError();
      toast.error("Falha ao salvar", { description: error.message });
      return;
    }

    // Grant XP
    await supabase.from("tactical_xp").insert({
      user_id: userId,
      xp_amount: xpValue,
      reason: "daily_readiness",
    } as any);

    playSuccess();
    toast.success(`Prontidão registrada! +${xpValue} XP`);
    setAlreadyReported(true);
    setSaving(false);
  };

  if (loading) return null;

  if (alreadyReported) {
    return (
      <div className="panel p-5">
        <div className="flex items-center gap-2 mb-2">
          <HeartPulse className="h-4 w-4 text-neon" />
          <h3 className="font-mono-tac uppercase text-xs tracking-widest text-neon text-glow font-bold">
            Reporte de Prontidão
          </h3>
        </div>
        <div className="flex items-center gap-2 text-green-400 py-4">
          <CheckCircle2 className="h-5 w-5" />
          <span className="font-mono-tac text-sm uppercase tracking-wider">
            Reporte do dia já concluído. Retorne amanhã.
          </span>
        </div>
      </div>
    );
  }

  const hydrationInfo = zoneLabel(hydration);

  return (
    <div className="panel p-5">
      <div className="flex items-center gap-2 mb-4">
        <HeartPulse className="h-4 w-4 text-neon" />
        <h3 className="font-mono-tac uppercase text-xs tracking-widest text-neon text-glow font-bold">
          Reporte de Prontidão Diário
        </h3>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Fatigue */}
        <div>
          <Label className="text-[10px] font-mono-tac uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            Nível de Fadiga: <span className="text-neon">{fatigue}</span>/10
          </Label>
          <Slider
            value={[fatigue]}
            onValueChange={(v) => setFatigue(v[0])}
            min={0}
            max={10}
            step={1}
            className="mt-2"
          />
          <div className="flex justify-between text-[9px] font-mono-tac text-muted-foreground mt-1">
            <span>Descansado</span>
            <span>Exausto</span>
          </div>
        </div>

        {/* Borg */}
        <div>
          <Label className="text-[10px] font-mono-tac uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            Percepção de Esforço (Borg): <span className="text-neon">{borg}</span>/10
          </Label>
          <Slider
            value={[borg]}
            onValueChange={(v) => setBorg(v[0])}
            min={0}
            max={10}
            step={1}
            className="mt-2"
          />
          <div className="flex justify-between text-[9px] font-mono-tac text-muted-foreground mt-1">
            <span>Nenhum esforço</span>
            <span>Máximo</span>
          </div>
        </div>

        {/* Hydration */}
        <div>
          <Label className="text-[10px] font-mono-tac uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 mb-2">
            <Droplets className="h-3.5 w-3.5" />
            Hidratação / Cor da Urina: <span className={hydrationInfo.color}>{hydrationInfo.text}</span>
          </Label>
          <div className="grid grid-cols-8 gap-1.5">
            {HYDRATION_COLORS.map((h) => (
              <button
                key={h.level}
                type="button"
                onClick={() => setHydration(h.level)}
                onMouseEnter={playHover}
                className={`h-10 rounded-md transition-all ${
                  hydration === h.level
                    ? `ring-2 ${zoneBorder(h.zone)} scale-110`
                    : "opacity-70 hover:opacity-100"
                }`}
                style={{ backgroundColor: h.color }}
                title={`Nível ${h.level}`}
              />
            ))}
          </div>
        </div>

        {/* Sleep */}
        <div>
          <Label className="text-[10px] font-mono-tac uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Moon className="h-3.5 w-3.5" />
            Horas de Sono
          </Label>
          <Input
            type="number"
            step="0.5"
            min="0"
            max="24"
            value={sleepHours}
            onChange={(e) => setSleepHours(e.target.value)}
            placeholder="7.5"
            required
            className="mt-1 h-10 bg-background/50 focus-visible:ring-neon focus-visible:border-neon font-mono-tac"
          />
        </div>

        <Button
          type="submit"
          disabled={saving}
          onMouseEnter={playHover}
          className="w-full h-10 font-mono-tac uppercase tracking-widest text-xs bg-neon text-primary-foreground hover:bg-neon/90 shadow-neon"
        >
          <HeartPulse className="h-4 w-4" />
          {saving ? "Registrando..." : "Registrar Prontidão"}
        </Button>
      </form>
    </div>
  );
}

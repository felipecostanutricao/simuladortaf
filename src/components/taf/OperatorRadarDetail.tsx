import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Radar, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const URINE_COLORS = [
  "#f5f5dc", "#f0e68c", "#daa520", "#cd853f",
  "#b8860b", "#a0522d", "#8b4513", "#654321",
];

export function OperatorRadarDetail({ userId, name, onClose }: { userId: string; name: string; onClose: () => void }) {
  const [data, setData] = useState<{
    fatigue_level: number;
    borg_rpe: number;
    sleep_hours: number;
    urine_color: number;
    report_date: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("daily_readiness")
      .select("fatigue_level, borg_rpe, sleep_hours, urine_color, report_date")
      .eq("user_id", userId)
      .order("report_date", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data: row }) => {
        if (row) setData(row);
        setLoading(false);
      });
  }, [userId]);

  return (
    <div className="panel panel-neon p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-mono-tac uppercase text-xs tracking-widest text-neon text-glow font-bold">
          Prontidão — {name}
        </h3>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <p className="text-xs font-mono-tac text-muted-foreground uppercase tracking-widest">Carregando dados...</p>
      ) : !data ? (
        <p className="text-xs font-mono-tac text-muted-foreground uppercase tracking-widest">Nenhum reporte registrado.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="panel p-3 text-center">
            <p className="text-[10px] font-mono-tac uppercase tracking-widest text-muted-foreground mb-1">Fadiga</p>
            <p className="text-2xl font-mono-tac font-bold text-neon tabular-nums">{data.fatigue_level}/10</p>
          </div>
          <div className="panel p-3 text-center">
            <p className="text-[10px] font-mono-tac uppercase tracking-widest text-muted-foreground mb-1">Borg RPE</p>
            <p className="text-2xl font-mono-tac font-bold text-neon tabular-nums">{data.borg_rpe}/10</p>
          </div>
          <div className="panel p-3 text-center">
            <p className="text-[10px] font-mono-tac uppercase tracking-widest text-muted-foreground mb-1">Sono</p>
            <p className="text-2xl font-mono-tac font-bold text-neon tabular-nums">{data.sleep_hours}h</p>
          </div>
          <div className="panel p-3 text-center">
            <p className="text-[10px] font-mono-tac uppercase tracking-widest text-muted-foreground mb-1">Urina</p>
            <div className="flex items-center justify-center gap-2 mt-1">
              <div
                className="w-6 h-6 rounded-full border border-border"
                style={{ backgroundColor: URINE_COLORS[data.urine_color - 1] || URINE_COLORS[0] }}
              />
              <span className="text-sm font-mono-tac text-muted-foreground">Nível {data.urine_color}</span>
            </div>
          </div>
          <div className="col-span-2 md:col-span-4">
            <p className="text-[10px] font-mono-tac uppercase tracking-widest text-muted-foreground">
              Data do reporte: {new Date(data.report_date).toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

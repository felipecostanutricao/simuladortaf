import { useState } from "react";
import { Save, Dumbbell, Activity, Footprints, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { Simulado } from "@/lib/taf-data";

type Props = {
  onSalvar: (s: Simulado) => void;
  initial?: Simulado;
};

const ICONS = {
  barra: Dumbbell,
  flexao: Activity,
  corrida: Footprints,
  natacao: Waves,
} as const;

export function SimularForm({ onSalvar, initial }: Props) {
  const [barra, setBarra] = useState(initial?.barra ?? 0);
  const [flexao, setFlexao] = useState(initial?.flexao ?? 0);
  const [corrida, setCorrida] = useState(initial?.corrida ?? 0);
  const [natacao, setNatacao] = useState(initial?.natacao ?? 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSalvar({ barra, flexao, corrida, natacao });
    toast.success("Simulado registrado", {
      description: "Performance computada na sua evolução tática.",
    });
  };

  const fields: Array<{
    key: keyof typeof ICONS;
    label: string;
    unit: string;
    value: number;
    set: (n: number) => void;
  }> = [
    { key: "barra", label: "Barra Fixa", unit: "repetições", value: barra, set: setBarra },
    { key: "flexao", label: "Flexão de Braço", unit: "repetições", value: flexao, set: setFlexao },
    { key: "corrida", label: "Corrida 12 min", unit: "metros", value: corrida, set: setCorrida },
    { key: "natacao", label: "Natação 50m", unit: "segundos", value: natacao, set: setNatacao },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((f) => {
          const Icon = ICONS[f.key];
          return (
            <div
              key={f.key}
              className="panel p-4 hover:panel-neon transition-colors"
            >
              <Label
                htmlFor={f.key}
                className="flex items-center gap-2 text-xs font-mono-tac uppercase tracking-widest text-muted-foreground"
              >
                <Icon className="h-4 w-4 text-neon" />
                {f.label}
              </Label>
              <Input
                id={f.key}
                type="number"
                min={0}
                value={f.value || ""}
                onChange={(e) => f.set(Number(e.target.value) || 0)}
                placeholder="0"
                className="mt-2 h-14 text-2xl font-mono-tac font-bold bg-background/50 border-border focus-visible:ring-neon focus-visible:border-neon tabular-nums"
              />
              <p className="mt-1 text-[10px] font-mono-tac uppercase text-muted-foreground">
                {f.unit}
              </p>
            </div>
          );
        })}
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full h-14 font-mono-tac uppercase tracking-[0.2em] text-base bg-neon text-primary-foreground hover:bg-neon/90 shadow-neon"
      >
        <Save className="h-5 w-5" />
        Salvar Simulado
      </Button>
    </form>
  );
}

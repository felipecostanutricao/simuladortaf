import { useEffect, useState } from "react";
import { Timer } from "lucide-react";

type Props = {
  /** ISO date string */
  targetDate: string;
};

function diff(target: Date) {
  const now = new Date();
  const ms = Math.max(0, target.getTime() - now.getTime());
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms / 3600000) % 24);
  const minutes = Math.floor((ms / 60000) % 60);
  const seconds = Math.floor((ms / 1000) % 60);
  return { days, hours, minutes, seconds };
}

export function CountdownTatico({ targetDate }: Props) {
  const target = new Date(targetDate);
  const [t, setT] = useState(() => diff(target));

  useEffect(() => {
    const id = setInterval(() => setT(diff(target)), 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  const items: Array<[string, number]> = [
    ["DIAS", t.days],
    ["HRS", t.hours],
    ["MIN", t.minutes],
    ["SEG", t.seconds],
  ];

  return (
    <section className="panel panel-neon p-5 sm:p-6 animate-pulse-neon">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-neon" />
          <span className="text-[11px] font-mono-tac uppercase tracking-[0.25em] text-muted-foreground">
            Countdown Tático — TAF
          </span>
        </div>
        <span className="text-[11px] font-mono-tac uppercase text-neon/80">
          ALVO: {target.toLocaleDateString("pt-BR")}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        {items.map(([label, value]) => (
          <div
            key={label}
            className="rounded-md border border-neon/30 bg-background/50 p-3 sm:p-4 text-center"
          >
            <div className="font-mono-tac text-3xl sm:text-5xl font-bold text-neon text-glow tabular-nums">
              {String(value).padStart(2, "0")}
            </div>
            <div className="mt-1 text-[10px] sm:text-xs font-mono-tac uppercase tracking-widest text-muted-foreground">
              {label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

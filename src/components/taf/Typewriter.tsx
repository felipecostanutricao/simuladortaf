import { useEffect, useState } from "react";
import { playTick } from "@/lib/audio/audioService";

interface TypewriterProps {
  text: string;
  speedMs?: number;
  className?: string;
  withSound?: boolean;
  startDelayMs?: number;
}

export function Typewriter({
  text,
  speedMs = 55,
  className,
  withSound = true,
  startDelayMs = 0,
}: TypewriterProps) {
  const [out, setOut] = useState("");

  useEffect(() => {
    setOut("");
    let i = 0;
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      i++;
      setOut(text.slice(0, i));
      if (withSound && text[i - 1] && text[i - 1] !== " ") {
        if (Math.random() > 0.35) playTick();
      }
      if (i < text.length) {
        window.setTimeout(tick, speedMs + Math.random() * 30);
      }
    };
    const t = window.setTimeout(tick, startDelayMs);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [text, speedMs, withSound, startDelayMs]);

  return (
    <span className={className}>
      {out}
      <span className="inline-block w-[0.5ch] -mb-0.5 bg-current animate-pulse" style={{ height: "0.9em" }} />
    </span>
  );
}

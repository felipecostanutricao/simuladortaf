// Tactical UI synth — Web Audio API. Lazy AudioContext, low volume (10-15%).

let ctx: AudioContext | null = null;
let unlocked = false;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

// Browsers require a user gesture before audio can start.
export function unlockAudio() {
  if (unlocked) return;
  const c = getCtx();
  if (c && c.state !== "running") void c.resume();
  unlocked = true;
}

if (typeof window !== "undefined") {
  const handler = () => {
    unlockAudio();
    window.removeEventListener("pointerdown", handler);
    window.removeEventListener("keydown", handler);
  };
  window.addEventListener("pointerdown", handler, { once: true });
  window.addEventListener("keydown", handler, { once: true });
}

interface ToneOpts {
  freq: number;
  durationMs: number;
  type?: OscillatorType;
  gain?: number;
  startOffsetMs?: number;
  attackMs?: number;
  releaseMs?: number;
}

function tone({
  freq,
  durationMs,
  type = "sine",
  gain = 0.12,
  startOffsetMs = 0,
  attackMs = 4,
  releaseMs = 30,
}: ToneOpts) {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(g);
  g.connect(c.destination);

  const start = c.currentTime + startOffsetMs / 1000;
  const attack = attackMs / 1000;
  const release = releaseMs / 1000;
  const dur = durationMs / 1000;

  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + attack);
  g.gain.setValueAtTime(gain, start + Math.max(attack, dur - release));
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);

  osc.start(start);
  osc.stop(start + dur + 0.02);
}

// Throttle hover ticks so rapid mouse movement doesn't spam.
let lastHover = 0;
export function playHover() {
  const now = Date.now();
  if (now - lastHover < 60) return;
  lastHover = now;
  tone({ freq: 1200, durationMs: 18, type: "triangle", gain: 0.06, releaseMs: 12 });
}

export function playSuccess() {
  tone({ freq: 400, durationMs: 90, type: "sine", gain: 0.12 });
  tone({ freq: 600, durationMs: 110, type: "sine", gain: 0.12, startOffsetMs: 80 });
}

export function playError() {
  tone({ freq: 150, durationMs: 150, type: "sawtooth", gain: 0.13, releaseMs: 60 });
  tone({ freq: 110, durationMs: 180, type: "sawtooth", gain: 0.1, startOffsetMs: 40, releaseMs: 80 });
}

export function playTick() {
  // Decoder click — short, dry, randomized
  const freq = 1800 + Math.random() * 800;
  tone({ freq, durationMs: 8, type: "square", gain: 0.04, releaseMs: 6 });
}

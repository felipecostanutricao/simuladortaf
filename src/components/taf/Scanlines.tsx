// Global CRT scanlines + subtle vignette flicker.
export function Scanlines() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[9998] mix-blend-overlay"
      style={{
        backgroundImage:
          "repeating-linear-gradient(to bottom, rgba(255,255,255,0.045) 0px, rgba(255,255,255,0.045) 1px, transparent 1px, transparent 3px)",
        opacity: 0.55,
      }}
    >
      <div
        className="absolute inset-0 animate-pulse"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.35) 100%)",
        }}
      />
    </div>
  );
}

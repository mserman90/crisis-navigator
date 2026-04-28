import { useEffect, useState } from "react";

type Props = {
  /** Sembolik [x, y] koordinat (her biri 0-100). Gerçek lat/lng DEĞİL. */
  center: [number, number];
  /** Sanal harita yakınlaştırma (1-10). */
  zoom: number;
  /** Kurgusal konum etiketi (ör. "Kerathon Limanı"). */
  locationName: string;
};

/**
 * Sanal taktik harita. Gerçek dünya tile'ları yerine prosedürel olarak
 * üretilmiş kurgusal bir kıta görseli gösterir; AI tarafından dönen [x, y]
 * koordinatı bu sanal grid üzerinde işaretlenir.
 */
export function TacticalMap({ center, zoom, locationName }: Props) {
  const [pulse, setPulse] = useState(0);

  // Hedef pulse animasyonu için tick
  useEffect(() => {
    const id = setInterval(() => setPulse((p) => (p + 1) % 1000), 1400);
    return () => clearInterval(id);
  }, []);

  // Koordinatları 0-100 aralığına sıkıştır (güvenlik)
  const x = Math.max(0, Math.min(100, center?.[0] ?? 50));
  const y = Math.max(0, Math.min(100, center?.[1] ?? 50));

  // Yakınlaştırma görsel etkisi: viewBox'u küçültüp hedef etrafında merkezle
  const z = Math.max(1, Math.min(10, zoom || 3));
  const span = 100 / z; // viewBox boyutu
  const vbX = Math.max(0, Math.min(100 - span, x - span / 2));
  const vbY = Math.max(0, Math.min(100 - span, y - span / 2));

  // Kurgusal kıta gövdesi (deterministik, prosedürel poligonlar)
  const landmasses = [
    "M10,30 Q22,18 38,24 Q52,30 60,22 Q72,16 84,28 Q92,40 80,52 Q66,60 54,54 Q40,48 28,56 Q14,62 8,50 Z",
    "M20,72 Q34,66 48,74 Q60,82 74,76 Q86,72 90,84 Q82,92 68,90 Q52,88 36,92 Q22,94 16,86 Z",
    "M64,8 Q74,4 84,10 Q90,16 86,22 Q78,26 70,22 Q62,18 64,8 Z",
  ];

  return (
    <div className="relative rounded-3xl overflow-hidden border border-border bg-surface shadow-soft">
      <svg
        viewBox={`${vbX} ${vbY} ${span} ${span}`}
        className="h-72 w-full block"
        style={{
          background:
            "radial-gradient(ellipse at center, oklch(0.22 0.04 235) 0%, oklch(0.14 0.03 240) 70%, oklch(0.10 0.02 245) 100%)",
          transition: "all 1.2s ease-in-out",
        }}
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Grid */}
        <defs>
          <pattern id="tac-grid" width="5" height="5" patternUnits="userSpaceOnUse">
            <path
              d="M 5 0 L 0 0 0 5"
              fill="none"
              stroke="oklch(0.55 0.10 220 / 0.18)"
              strokeWidth="0.1"
            />
          </pattern>
          <radialGradient id="tac-pulse" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="oklch(0.70 0.20 25)" stopOpacity="0.9" />
            <stop offset="60%" stopColor="oklch(0.60 0.22 25)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="oklch(0.50 0.22 25)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width="100" height="100" fill="url(#tac-grid)" />

        {/* Kurgusal kıtalar */}
        {landmasses.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="oklch(0.32 0.04 200 / 0.55)"
            stroke="oklch(0.62 0.10 210 / 0.55)"
            strokeWidth="0.15"
          />
        ))}

        {/* Mesafe halkaları */}
        {[3, 6, 10].map((r, i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={r}
            fill="none"
            stroke="oklch(0.70 0.18 25 / 0.35)"
            strokeWidth="0.12"
            strokeDasharray="0.6 0.4"
          />
        ))}

        {/* Hedef pulse */}
        <circle
          key={pulse}
          cx={x}
          cy={y}
          r="8"
          fill="url(#tac-pulse)"
          style={{
            transformOrigin: `${x}px ${y}px`,
            animation: "tac-ping 1.4s ease-out forwards",
          }}
        />

        {/* Hedef nokta */}
        <circle cx={x} cy={y} r="0.9" fill="oklch(0.85 0.22 25)" />
        <circle cx={x} cy={y} r="0.4" fill="oklch(1 0 0)" />

        {/* Crosshair */}
        <line
          x1={x - 4}
          y1={y}
          x2={x - 1.4}
          y2={y}
          stroke="oklch(0.85 0.22 25)"
          strokeWidth="0.18"
        />
        <line
          x1={x + 1.4}
          y1={y}
          x2={x + 4}
          y2={y}
          stroke="oklch(0.85 0.22 25)"
          strokeWidth="0.18"
        />
        <line
          x1={x}
          y1={y - 4}
          x2={x}
          y2={y - 1.4}
          stroke="oklch(0.85 0.22 25)"
          strokeWidth="0.18"
        />
        <line
          x1={x}
          y1={y + 1.4}
          x2={x}
          y2={y + 4}
          stroke="oklch(0.85 0.22 25)"
          strokeWidth="0.18"
        />
      </svg>

      <style>{`
        @keyframes tac-ping {
          0%   { transform: scale(0.4); opacity: 0.95; transform-box: fill-box; transform-origin: center; }
          100% { transform: scale(2.2); opacity: 0;    transform-box: fill-box; transform-origin: center; }
        }
      `}</style>

      {/* HUD: konum etiketi */}
      <div className="absolute top-3 left-3 z-10 glass border border-border rounded-full px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-foreground flex items-center gap-2">
        <span className="size-1.5 rounded-full bg-destructive animate-pulse" />
        {locationName || "—"}
      </div>

      {/* HUD: koordinat */}
      <div className="absolute bottom-3 right-3 z-10 glass border border-border rounded-full px-3 py-1.5 text-[10px] font-mono tracking-widest text-muted-foreground">
        SECTOR {x.toFixed(1)} / {y.toFixed(1)} · Z{z}
      </div>

      {/* HUD: SİM rozeti */}
      <div className="absolute top-3 right-3 z-10 glass border border-border rounded-full px-3 py-1.5 text-[9px] font-mono uppercase tracking-[0.25em] text-warning flex items-center gap-1.5">
        <span className="size-1 rounded-full bg-warning animate-pulse" />
        SIM · FICTIONAL THEATRE
      </div>
    </div>
  );
}

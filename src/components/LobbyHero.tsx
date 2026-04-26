import { Activity, Radar, Shield, Globe2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function LobbyHero() {
  const { lang } = useI18n();

  const copy = lang === "tr"
    ? {
        kicker: "CANLI · KRİZ KOMUTA AĞI",
        titleA: "Sahnede",
        titleB: "Kriz",
        titleC: "Yönetiliyor.",
        sub: "Yapay zeka destekli senaryolar, gerçek zamanlı kararlar, çok oyunculu komuta masası. Bir sonraki krizi sen yönet.",
        chip1: "Gerçek zamanlı senkron",
        chip2: "AI senaryo motoru",
        chip3: "Çok oyunculu komuta",
        statusLabel: "Sistem durumu",
        statusValue: "OPERASYONEL",
        chooseRole: "Aşağıdan rolünü seç ↓",
      }
    : {
        kicker: "LIVE · CRISIS COMMAND NETWORK",
        titleA: "The Crisis",
        titleB: "Is",
        titleC: "Live.",
        sub: "AI-driven scenarios, real-time decisions, a multiplayer command desk. Run the next crisis on your terms.",
        chip1: "Realtime sync",
        chip2: "AI scenario engine",
        chip3: "Multiplayer command",
        statusLabel: "System status",
        statusValue: "OPERATIONAL",
        chooseRole: "Pick your role below ↓",
      };

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-border bg-surface mb-14 hero-noise">
      {/* Layered radial color wash */}
      <div className="absolute inset-0 hero-radial" aria-hidden />

      {/* Animated mesh blobs */}
      <div
        className="absolute -top-40 -left-40 size-[520px] rounded-full blur-3xl opacity-60 animate-hero-blob"
        style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--primary) 55%, transparent), transparent 70%)" }}
        aria-hidden
      />
      <div
        className="absolute -bottom-40 -right-32 size-[560px] rounded-full blur-3xl opacity-60 animate-hero-blob"
        style={{
          background: "radial-gradient(circle, color-mix(in oklab, var(--destructive) 45%, transparent), transparent 70%)",
          animationDelay: "-6s",
        }}
        aria-hidden
      />
      <div
        className="absolute top-1/3 right-1/4 size-[360px] rounded-full blur-3xl opacity-50 animate-hero-blob"
        style={{
          background: "radial-gradient(circle, color-mix(in oklab, var(--info) 55%, transparent), transparent 70%)",
          animationDelay: "-12s",
        }}
        aria-hidden
      />

      {/* Subtle grid */}
      <div className="absolute inset-0 bg-grid opacity-[0.35]" aria-hidden />

      {/* Scan line */}
      <div className="absolute inset-x-0 top-0 h-full overflow-hidden pointer-events-none" aria-hidden>
        <div
          className="absolute inset-x-0 h-32 animate-hero-scan"
          style={{
            background:
              "linear-gradient(180deg, transparent, color-mix(in oklab, var(--primary) 18%, transparent), transparent)",
          }}
        />
      </div>

      {/* Orbiting radar — right side, hidden on small screens */}
      <div className="hidden lg:block absolute -right-24 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden>
        <div className="relative size-[460px]">
          <div className="absolute inset-0 rounded-full border border-border/70" />
          <div className="absolute inset-8 rounded-full border border-border/50" />
          <div className="absolute inset-20 rounded-full border border-border/40" />
          <div className="absolute inset-32 rounded-full border border-border/30" />

          <div className="absolute inset-0 animate-hero-orbit">
            <div
              className="absolute left-1/2 top-0 -translate-x-1/2 size-3 rounded-full"
              style={{ background: "var(--primary)", boxShadow: "0 0 24px var(--primary)" }}
            />
          </div>
          <div className="absolute inset-8 animate-hero-orbit-rev">
            <div
              className="absolute right-0 top-1/2 -translate-y-1/2 size-2.5 rounded-full"
              style={{ background: "var(--destructive)", boxShadow: "0 0 18px var(--destructive)" }}
            />
          </div>
          <div className="absolute inset-20 animate-hero-orbit">
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 size-2 rounded-full"
              style={{ background: "var(--info)", boxShadow: "0 0 16px var(--info)" }}
            />
          </div>

          {/* Center pulse */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div
                className="absolute inset-0 rounded-full animate-hero-ping-slow"
                style={{ background: "color-mix(in oklab, var(--primary) 50%, transparent)" }}
              />
              <div
                className="relative size-16 rounded-full flex items-center justify-center text-primary-foreground"
                style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-elevated)" }}
              >
                <Radar size={26} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative px-6 sm:px-10 lg:px-14 py-14 lg:py-20 max-w-3xl">
        <div
          className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 backdrop-blur px-3 py-1.5 text-[10px] font-mono tracking-[0.25em] text-muted-foreground animate-hero-fade-up"
          style={{ animationDelay: "0ms" }}
        >
          <span className="relative flex size-1.5">
            <span
              className="absolute inline-flex h-full w-full rounded-full animate-hero-ping-slow"
              style={{ background: "color-mix(in oklab, var(--destructive) 80%, transparent)" }}
            />
            <span className="relative inline-flex rounded-full size-1.5" style={{ background: "var(--destructive)" }} />
          </span>
          {copy.kicker}
        </div>

        <h1
          className="mt-6 font-display font-semibold tracking-tight text-foreground text-5xl sm:text-6xl lg:text-7xl leading-[0.95] animate-hero-fade-up"
          style={{ animationDelay: "120ms" }}
        >
          <span className="block">{copy.titleA}</span>
          <span className="block">
            <span className="hero-shimmer-text">{copy.titleB}</span>{" "}
            <span className="text-foreground">{copy.titleC}</span>
          </span>
        </h1>

        <p
          className="mt-6 text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed animate-hero-fade-up"
          style={{ animationDelay: "240ms" }}
        >
          {copy.sub}
        </p>

        <div
          className="mt-8 flex flex-wrap gap-2 animate-hero-fade-up"
          style={{ animationDelay: "360ms" }}
        >
          <Chip icon={<Activity size={12} />}>{copy.chip1}</Chip>
          <Chip icon={<Globe2 size={12} />}>{copy.chip2}</Chip>
          <Chip icon={<Shield size={12} />}>{copy.chip3}</Chip>
        </div>

        <div
          className="mt-10 flex items-center gap-6 animate-hero-fade-up"
          style={{ animationDelay: "480ms" }}
        >
          <div className="flex items-center gap-2.5">
            <div className="relative flex size-2.5">
              <span
                className="absolute inline-flex h-full w-full rounded-full animate-hero-ping-slow"
                style={{ background: "color-mix(in oklab, var(--success) 80%, transparent)" }}
              />
              <span className="relative inline-flex rounded-full size-2.5" style={{ background: "var(--success)" }} />
            </div>
            <div className="text-xs font-mono">
              <div className="uppercase tracking-[0.2em] text-muted-foreground">{copy.statusLabel}</div>
              <div className="text-foreground font-semibold tracking-wider">{copy.statusValue}</div>
            </div>
          </div>

          {/* Tick bars */}
          <div className="flex items-end gap-1 h-8">
            {Array.from({ length: 14 }).map((_, i) => (
              <span
                key={i}
                className="w-1 rounded-sm bg-primary/70 animate-hero-tick"
                style={{
                  height: `${30 + ((i * 37) % 70)}%`,
                  animationDelay: `${i * 90}ms`,
                }}
              />
            ))}
          </div>
        </div>

        <div
          className="mt-10 text-xs font-mono uppercase tracking-[0.25em] text-muted-foreground animate-hero-fade-up"
          style={{ animationDelay: "600ms" }}
        >
          {copy.chooseRole}
        </div>
      </div>
    </section>
  );
}

function Chip({ children, icon }: { children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/70 backdrop-blur px-3 py-1 text-xs text-foreground">
      <span className="text-primary">{icon}</span>
      {children}
    </span>
  );
}

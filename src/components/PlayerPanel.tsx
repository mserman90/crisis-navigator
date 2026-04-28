import { useState } from "react";
import { Activity, Brain, EyeOff, ShieldAlert, Zap, Bot } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { TacticalMap } from "./TacticalMap";
import { useI18n } from "@/lib/i18n";
import { generateScenario } from "@/server/ai.functions";
import { useSessionStore } from "@/hooks/useSessionStore";
import type { Option, SessionRow } from "@/lib/types";
import { toast } from "sonner";
import { getServerFnErrorMessage } from "@/lib/serverFnError";

const clamp = (n: number) => Math.max(0, Math.min(100, n));

type Props = {
  session: SessionRow;
};

export function PlayerPanel({ session }: Props) {
  const { t, lang } = useI18n();
  const { update: updateSession } = useSessionStore();
  const [ap, setAp] = useState(3);
  const [intelRevealed, setIntelRevealed] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const generateScenarioFn = useServerFn(generateScenario);

  const triggerNextRound = async () => {
    setAiLoading(true);
    try {
      const last = session.history[session.history.length - 1];
      const round = await generateScenarioFn({
        data: {
          threat: session.threat,
          lastMove: last?.text ?? (lang === "tr" ? "Henüz hamle yok." : "No move yet."),
          metrics: session.metrics,
          lang,
        },
      });
      await updateSession({
        status: "PLAYING",
        current_round: round,
      });
      setAp(3);
      setIntelRevealed(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t.aiUnavailable);
    } finally {
      setAiLoading(false);
    }
  };

  const handleChoice = async (opt: Option) => {
    const m = session.metrics;
    const newMetrics = {
      water: clamp(m.water + (opt.impact.water ?? 0)),
      trust: clamp(m.trust + (opt.impact.trust ?? 0)),
      diplomacy: clamp(m.diplomacy + (opt.impact.diplomacy ?? 0)),
      infrastructure: clamp(m.infrastructure + (opt.impact.infrastructure ?? 0)),
    };
    await updateSession({
      status: "EVALUATION",
      metrics: newMetrics,
      history: [...session.history, opt],
    });
  };

  if (session.status === "LOBBY") {
    return (
      <div className="bg-surface border border-border rounded-3xl p-12 text-center shadow-soft min-h-[360px] flex flex-col items-center justify-center">
        {session.game_mode === "SOLO_PLAYER" ? (
          <>
            <Bot size={44} className="text-info mb-5" />
            <h2 className="text-2xl font-display font-semibold mb-5">{t.virtualRefReady}</h2>
            <button
              onClick={triggerNextRound}
              disabled={aiLoading}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold tracking-wide hover:bg-primary/90 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
            >
              {aiLoading ? <Activity size={18} className="animate-spin" /> : <Zap size={18} />}
              {aiLoading ? t.generating : t.startSimShort}
            </button>
          </>
        ) : (
          <>
            <Activity size={44} className="text-primary animate-pulse mb-5" />
            <h2 className="text-2xl font-display font-semibold mb-2">{t.waitingRoom}</h2>
            <p className="text-sm text-muted-foreground font-mono uppercase tracking-widest">
              {t.waitingDesc}
            </p>
          </>
        )}
      </div>
    );
  }

  if (session.status === "EVALUATION") {
    const last = session.history[session.history.length - 1];
    return (
      <div className="bg-surface border border-border rounded-3xl p-8 shadow-soft animate-in slide-in-from-bottom-4 duration-500">
        <h2 className="text-info font-display font-semibold mb-5 flex items-center gap-2 text-xl">
          <Activity className="text-primary" size={20} /> {t.tacticalReport}
        </h2>
        <div className="p-5 bg-surface-2 rounded-2xl border border-border mb-5">
          <p className="text-sm text-foreground font-mono whitespace-pre-line leading-relaxed">
            {last?.feedback}
          </p>
        </div>
        <div className="text-center p-5 border border-dashed border-border rounded-2xl bg-surface-2/50">
          {session.game_mode === "SOLO_PLAYER" ? (
            <div className="flex flex-col items-center gap-3">
              <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">
                {t.waitingNextRound}
              </p>
              <button
                onClick={triggerNextRound}
                disabled={aiLoading}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
              >
                {aiLoading ? <Activity size={18} className="animate-spin" /> : <Zap size={18} />}
                {aiLoading ? t.aiThinkingShort : t.nextPhase}
              </button>
            </div>
          ) : (
            <>
              <Activity size={22} className="text-muted-foreground animate-pulse mx-auto mb-2" />
              <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">
                {t.refCalculating}
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // PLAYING
  const round = session.current_round;
  if (!round) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-in fade-in duration-500">
      <div className="lg:col-span-5 space-y-5">
        <TacticalMap center={round.location} zoom={round.mapZoom} locationName={round.locationName} />
        <div className="bg-surface border border-border rounded-3xl p-6 shadow-soft">
          <h3 className="text-xs font-semibold text-destructive mb-3 flex items-center gap-2 uppercase tracking-[0.2em] font-mono">
            <Activity size={14} /> {t.tacticalSituation}
          </h3>
          <p className="text-sm text-foreground leading-relaxed">{round.situation}</p>
        </div>
        {intelRevealed && (
          <div className="bg-info/5 border border-info/30 p-5 rounded-2xl animate-in slide-in-from-top-2">
            <h4 className="text-[10px] font-semibold text-info uppercase mb-2 flex items-center gap-2 tracking-[0.2em] font-mono">
              <Brain size={12} /> {t.deepIntel}
            </h4>
            <p className="text-xs text-foreground/80 italic leading-relaxed">{round.deepIntel}</p>
          </div>
        )}
      </div>

      <div className="lg:col-span-7 space-y-4">
        <div className="flex justify-between items-center bg-surface border border-border rounded-2xl p-3 px-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] font-mono text-muted-foreground">
            {t.decisionPool}
          </h3>
          <div className="flex items-center gap-3">
            {!intelRevealed && (
              <button
                onClick={() => {
                  if (ap >= 1) {
                    setAp(ap - 1);
                    setIntelRevealed(true);
                  }
                }}
                disabled={ap < 1}
                className="text-[10px] font-semibold text-info bg-info/10 px-3 py-1.5 rounded-lg border border-info/30 hover:bg-info/20 transition-colors uppercase tracking-widest disabled:opacity-40"
              >
                {t.revealIntel}
              </button>
            )}
            <div className="flex items-center gap-1.5 bg-surface-2 px-3 py-1.5 rounded-lg border border-border">
              <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">AP:</span>
              {[1, 2, 3].map((i) => (
                <Zap
                  key={i}
                  size={13}
                  className={i <= ap ? "text-info fill-info" : "text-border"}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {round.options.map((o, idx) => (
            <button
              key={idx}
              onClick={() => handleChoice(o)}
              disabled={o.apCost > ap}
              className={`w-full p-5 rounded-3xl border text-left transition-all group ${
                o.apCost <= ap
                  ? "bg-surface border-border hover:border-primary hover:shadow-soft"
                  : "opacity-50 cursor-not-allowed bg-surface-2 border-border"
              }`}
            >
              <div className="flex justify-between items-start mb-3 gap-3">
                <span className="font-semibold text-foreground text-sm leading-relaxed">{o.text}</span>
                <div className="flex items-center gap-1 font-mono text-[10px] text-info bg-info/10 px-2 py-1 rounded border border-info/20 shrink-0">
                  <Zap size={10} /> {o.apCost} AP
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-[10px] font-mono uppercase">
                <span className="flex items-center gap-1 text-muted-foreground border border-border bg-surface-2 px-2 py-1 rounded-lg">
                  <ShieldAlert size={11} /> {t.type}: {o.category}
                </span>
                {intelRevealed ? (
                  <div className="flex flex-wrap gap-2 px-2 py-1">
                    {Object.entries(o.impact).map(([k, v]) => (
                      <span
                        key={k}
                        className={
                          (v ?? 0) > 0
                            ? "text-success"
                            : (v ?? 0) < 0
                            ? "text-destructive"
                            : "text-muted-foreground"
                        }
                      >
                        {k.slice(0, 3)}:{(v ?? 0) > 0 ? "+" : ""}{v}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted-foreground flex items-center gap-1 px-2 py-1 border border-border rounded-lg">
                    <EyeOff size={11} /> {t.impact}: {t.hidden}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

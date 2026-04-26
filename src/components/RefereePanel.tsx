import { useEffect, useRef, useState } from "react";
import { Activity, Bot, Brain, RefreshCw, Send, Terminal, Zap } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useI18n } from "@/lib/i18n";
import { generateScenario, generateOperatorChoice } from "@/server/ai.functions";
import { useSessionStore } from "@/hooks/useSessionStore";
import type { Option, SessionRow } from "@/lib/types";
import { toast } from "sonner";

const clamp = (n: number) => Math.max(0, Math.min(100, n));

export function RefereePanel({ session }: { session: SessionRow }) {
  const { t, lang } = useI18n();
  const { update: updateSession, reset: resetSession } = useSessionStore();
  const [aiLoading, setAiLoading] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [newsInput, setNewsInput] = useState("");
  const generateScenarioFn = useServerFn(generateScenario);
  const generateChoiceFn = useServerFn(generateOperatorChoice);

  // Track which round we already auto-played to prevent re-trigger loops
  const playedSituationRef = useRef<string | null>(null);

  // Sanal oyuncu (auto-play) for SOLO_WHITE_CELL
  useEffect(() => {
    if (
      session.game_mode !== "SOLO_WHITE_CELL" ||
      session.status !== "PLAYING" ||
      !session.current_round
    ) {
      return;
    }
    if (playedSituationRef.current === session.current_round.situation) return;
    playedSituationRef.current = session.current_round.situation;

    let cancelled = false;
    setAiThinking(true);

    (async () => {
      try {
        await new Promise((r) => setTimeout(r, 2500));
        if (cancelled) return;
        const round = session.current_round!;
        const { choice } = await generateChoiceFn({
          data: {
            situation: round.situation,
            options: round.options.map((o) => ({ text: o.text })),
            metrics: session.metrics,
            lang,
          },
        });
        if (cancelled) return;
        const opt: Option = round.options[Math.min(choice, round.options.length - 1)];
        const m = session.metrics;
        const newMetrics = {
          water: clamp(m.water + (opt.impact.water ?? 0)),
          trust: clamp(m.trust + (opt.impact.trust ?? 0)),
          diplomacy: clamp(m.diplomacy + (opt.impact.diplomacy ?? 0)),
          infrastructure: clamp(m.infrastructure + (opt.impact.infrastructure ?? 0)),
        };
        await updateSession(session.session_id, {
          status: "EVALUATION",
          metrics: newMetrics,
          history: [...session.history, opt],
        });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t.aiUnavailable);
      } finally {
        if (!cancelled) setAiThinking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session, generateChoiceFn, lang, t.aiUnavailable]);

  const triggerScenario = async () => {
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
      await updateSession(session.session_id, {
        status: "PLAYING",
        current_round: round,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t.aiUnavailable);
    } finally {
      setAiLoading(false);
    }
  };

  const pushNews = async () => {
    if (!newsInput.trim()) return;
    const time = new Date().toLocaleTimeString(lang === "tr" ? "tr-TR" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    await updateSession(session.session_id, {
      news_feed: [...session.news_feed, { text: newsInput, time }],
    });
    setNewsInput("");
  };

  const lastMove = session.history[session.history.length - 1];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-5">
        <div className="bg-surface border border-border rounded-3xl p-6 shadow-soft">
          <h3 className="text-sm font-display font-semibold mb-4 flex items-center gap-2">
            <Brain size={18} className="text-primary" />
            {t.aiEngine}
          </h3>

          {aiThinking && (
            <div className="mb-4 flex items-center gap-2 text-info text-sm bg-info/10 border border-info/20 rounded-xl px-3 py-2 font-mono">
              <Bot size={16} className="animate-pulse" />
              {t.aiThinking}
            </div>
          )}

          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-1.5">
            {t.lastDecision}
          </div>
          <div className="text-sm text-foreground bg-surface-2 border border-border rounded-xl px-4 py-3 mb-5 font-mono">
            {lastMove?.text ?? t.noMoves}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={triggerScenario}
              disabled={aiLoading}
              className="flex-1 min-w-[200px] inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {aiLoading ? <Activity size={16} className="animate-spin" /> : <Zap size={16} />}
              {session.status === "LOBBY" ? t.startSim : t.nextMove}
            </button>
            <button
              onClick={() => resetSession(session.session_id, session.game_mode)}
              className="inline-flex items-center gap-2 bg-surface-2 border border-border text-foreground px-4 py-3 rounded-xl font-semibold hover:bg-secondary transition-colors"
            >
              <RefreshCw size={16} />
              {t.reset}
            </button>
          </div>
        </div>

        {session.current_round && (
          <div className="bg-surface border border-border rounded-3xl p-6 shadow-soft">
            <h4 className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">
              {t.currentSituation}
            </h4>
            <p className="text-sm text-foreground mb-4 leading-relaxed">
              {session.current_round.situation}
            </p>
            <div className="space-y-2">
              {session.current_round.options.map((opt, i) => (
                <div
                  key={i}
                  className="text-xs text-foreground bg-surface-2 border border-border rounded-lg px-3 py-2 font-mono flex items-center justify-between gap-3"
                >
                  <span>{opt.text}</span>
                  <span className="shrink-0 text-info flex items-center gap-1">
                    <Zap size={10} /> {opt.apCost}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <div className="bg-surface border border-border rounded-3xl p-6 shadow-soft">
          <h3 className="text-sm font-display font-semibold mb-4 flex items-center gap-2">
            <Terminal size={18} className="text-destructive" />
            {t.liveIntel}
          </h3>
          <textarea
            value={newsInput}
            onChange={(e) => setNewsInput(e.target.value)}
            placeholder={t.newsPlaceholder}
            className="w-full bg-surface-2 border border-border rounded-xl p-3 text-sm font-mono text-foreground focus:outline-none focus:border-destructive min-h-[110px] mb-4"
          />
          <button
            onClick={pushNews}
            className="w-full inline-flex justify-center items-center gap-2 bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20 font-semibold uppercase tracking-widest text-xs p-3 rounded-xl transition-colors"
          >
            <Send size={14} /> {t.publish}
          </button>
        </div>
      </div>
    </div>
  );
}

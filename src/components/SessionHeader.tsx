import { Activity, ArrowLeft, Copy, ShieldAlert, User } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { LangToggle } from "./LangToggle";
import { toast } from "sonner";
import type { Metrics, Role, SessionRow } from "@/lib/types";

type Props = {
  role: Role;
  session: SessionRow;
  onBack: () => void;
};

export function Header({ role, session, onBack }: Props) {
  const { t } = useI18n();
  const isReferee = role === "WHITE_CELL";

  return (
    <div className="bg-surface border border-border rounded-3xl p-4 md:p-5 mb-6 shadow-soft">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="size-9 rounded-xl border border-border bg-surface-2 hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            title={t.backToLobby}
          >
            <ArrowLeft size={16} />
          </button>
          <div
            className={`size-10 rounded-2xl flex items-center justify-center ${
              isReferee ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
            }`}
          >
            {isReferee ? <ShieldAlert size={20} /> : <User size={20} />}
          </div>
          <div>
            <div className="font-display font-semibold text-foreground flex items-center gap-2">
              {isReferee ? t.refereePanel : t.crisisDesk}
              {session.game_mode !== "MULTI" && (
                <span className="text-[10px] uppercase tracking-widest font-mono text-info bg-info/10 px-2 py-0.5 rounded-full">
                  {t.virtualMode}
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground font-mono uppercase tracking-widest flex items-center gap-2">
              <Activity size={11} />
              {t.status}: {session.status}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <MetricsRow metrics={session.metrics} />
          <LangToggle />
        </div>
      </div>
    </div>
  );
}

function MetricsRow({ metrics }: { metrics: Metrics }) {
  const { t } = useI18n();
  const items = [
    { l: t.water, v: metrics.water },
    { l: t.trust, v: metrics.trust },
    { l: t.diplomacy, v: metrics.diplomacy },
    { l: t.infrastructure, v: metrics.infrastructure },
  ];
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {items.map((m) => (
        <div
          key={m.l}
          className="flex items-center gap-2 bg-surface-2 border border-border rounded-full px-3 py-1.5 font-mono text-[11px]"
        >
          <span className="text-muted-foreground tracking-widest">{m.l}</span>
          <span className={metricColor(m.v)}>{m.v}</span>
        </div>
      ))}
    </div>
  );
}

function metricColor(v: number) {
  if (v >= 75) return "text-success font-semibold";
  if (v >= 40) return "text-warning font-semibold";
  return "text-destructive font-semibold";
}

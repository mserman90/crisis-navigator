import { Globe2, ShieldAlert, User, Bot, Users } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { LangToggle } from "./LangToggle";
import type { Role, SessionRow } from "@/lib/types";

type Props = {
  onSelect: (role: Role, mode: SessionRow["game_mode"]) => void;
};

export function Lobby({ onSelect }: Props) {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background bg-grid">
      <div className="max-w-6xl mx-auto px-6 py-12 lg:py-20">
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-gradient-to-br from-primary to-info flex items-center justify-center text-primary-foreground shadow-soft">
              <Globe2 size={20} />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-mono">
                {t.appSubtitle}
              </div>
              <h1 className="text-xl font-display font-semibold text-foreground -mt-0.5">
                {t.appTitle}
              </h1>
            </div>
          </div>
          <LangToggle />
        </header>

        <section className="mb-12">
          <h2 className="text-4xl lg:text-5xl font-display font-semibold tracking-tight text-foreground max-w-3xl">
            {t.lobbyTitle}
          </h2>
          <p className="mt-3 text-muted-foreground max-w-2xl">
            {t.appSubtitle}
          </p>
        </section>

        <section className="space-y-10">
          <div>
            <div className="flex items-center gap-2 mb-4 text-xs uppercase tracking-[0.2em] text-muted-foreground font-mono">
              <Users size={14} />
              {t.multiplayer}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Tile
                accent="primary"
                icon={<User size={22} />}
                title={t.playerOption}
                description={t.playerOptionDesc}
                onClick={() => onSelect("PLAYER", "MULTI")}
              />
              <Tile
                accent="destructive"
                icon={<ShieldAlert size={22} />}
                title={t.refereeOption}
                description={t.refereeOptionDesc}
                onClick={() => onSelect("WHITE_CELL", "MULTI")}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4 text-xs uppercase tracking-[0.2em] text-muted-foreground font-mono">
              <Bot size={14} />
              {t.solo}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Tile
                accent="info"
                badge={t.new}
                icon={<Bot size={22} />}
                title={t.soloPlayer}
                description={t.soloPlayerDesc}
                onClick={() => onSelect("PLAYER", "SOLO_PLAYER")}
              />
              <Tile
                accent="warning"
                badge={t.new}
                icon={<Bot size={22} />}
                title={t.soloReferee}
                description={t.soloRefereeDesc}
                onClick={() => onSelect("WHITE_CELL", "SOLO_WHITE_CELL")}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Tile({
  icon,
  title,
  description,
  onClick,
  accent,
  badge,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  accent: "primary" | "destructive" | "info" | "warning";
  badge?: string;
}) {
  const accentMap = {
    primary: "group-hover:border-primary group-hover:shadow-[0_0_0_1px_var(--primary)] text-primary",
    destructive:
      "group-hover:border-destructive group-hover:shadow-[0_0_0_1px_var(--destructive)] text-destructive",
    info: "group-hover:border-info group-hover:shadow-[0_0_0_1px_var(--info)] text-info",
    warning:
      "group-hover:border-warning group-hover:shadow-[0_0_0_1px_var(--warning)] text-warning",
  } as const;
  return (
    <button
      onClick={onClick}
      className={`group relative text-left bg-surface border border-border rounded-3xl p-6 transition-all hover:-translate-y-0.5 hover:shadow-elevated ${accentMap[accent]}`}
    >
      {badge && (
        <span className="absolute top-4 right-4 text-[9px] tracking-[0.2em] font-mono px-2 py-0.5 rounded-full bg-foreground text-background">
          {badge}
        </span>
      )}
      <div className="size-10 rounded-2xl bg-secondary flex items-center justify-center mb-4 transition-colors group-hover:bg-foreground/5">
        <span className={accentMap[accent].split(" ").pop()}>{icon}</span>
      </div>
      <div className="font-display text-lg font-semibold text-foreground mb-1">{title}</div>
      <div className="text-sm text-muted-foreground leading-relaxed">{description}</div>
    </button>
  );
}

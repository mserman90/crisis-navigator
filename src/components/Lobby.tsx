import { useState } from "react";
import { Globe2, ShieldAlert, User, Bot, Users, LogOut, KeyRound, Plus } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { LangToggle } from "./LangToggle";
import { useAuth } from "./AuthProvider";
import { AuthDialog } from "./AuthDialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import type { Role, SessionRow } from "@/lib/types";
import { LobbyHero } from "./LobbyHero";

type StartArgs = {
  role: Role;
  mode: SessionRow["game_mode"];
  sessionCode?: string;
  asJoin?: boolean;
};

type Props = {
  onSelect: (args: StartArgs) => void;
};

export function Lobby({ onSelect }: Props) {
  const { t, lang } = useI18n();
  const { user, signOut } = useAuth();
  const [authPrompt, setAuthPrompt] = useState<null | { role: Role; mode: SessionRow["game_mode"] }>(null);
  const [joinCode, setJoinCode] = useState("");
  const [showJoin, setShowJoin] = useState(false);

  const labels = lang === "tr"
    ? {
        joinTitle: "Mevcut Oturuma Katıl",
        joinDesc: "Sahibinden aldığın oturum kodunu gir.",
        joinPlaceholder: "Oturum kodu (örn. ATLAS-7421)",
        joinBtn: "Oturuma Katıl",
        createNew: "Yeni Oturum Oluştur",
        signedInAs: "Giriş yapan",
        signOut: "Çıkış",
        signInRequired: "Çok oyunculu modlar için giriş gerekiyor",
        cancel: "Vazgeç",
      }
    : {
        joinTitle: "Join existing session",
        joinDesc: "Enter the session code provided by the owner.",
        joinPlaceholder: "Session code (e.g. ATLAS-7421)",
        joinBtn: "Join session",
        createNew: "Create new session",
        signedInAs: "Signed in as",
        signOut: "Sign out",
        signInRequired: "Sign in is required for multiplayer modes",
        cancel: "Cancel",
      };

  const requestStart = (role: Role, mode: SessionRow["game_mode"]) => {
    // Solo modes are playable without an account; multiplayer requires sign-in.
    if (mode === "MULTI" && !user) {
      setAuthPrompt({ role, mode });
      return;
    }
    onSelect({ role, mode });
  };

  const requestJoin = (role: Role) => {
    if (!user) {
      setAuthPrompt({ role, mode: "MULTI" });
      return;
    }
    if (!joinCode.trim()) return;
    onSelect({ role, mode: "MULTI", sessionCode: joinCode.trim().toUpperCase(), asJoin: true });
  };

  if (authPrompt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background bg-grid p-6">
        <AuthDialog
          onCancel={() => setAuthPrompt(null)}
          description={labels.signInRequired}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-grid">
      <div className="max-w-6xl mx-auto px-6 py-12 lg:py-20">
        <header className="flex items-center justify-between mb-12 gap-4 flex-wrap">
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
          <div className="flex items-center gap-3">
            <LangToggle />
            {user ? (
              <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                <span className="hidden sm:inline">
                  {labels.signedInAs}: <span className="text-foreground">{user.email}</span>
                </span>
                <Button size="sm" variant="ghost" onClick={() => signOut()}>
                  <LogOut size={14} />
                  {labels.signOut}
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setAuthPrompt({ role: "PLAYER", mode: "MULTI" })}>
                {lang === "tr" ? "Giriş Yap" : "Sign in"}
              </Button>
            )}
          </div>
        </header>

        <LobbyHero />

        <section className="space-y-10">
          <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground font-mono">
                <Users size={14} />
                {t.multiplayer}
              </div>
              <Button size="sm" variant="ghost" onClick={() => setShowJoin((v) => !v)}>
                <KeyRound size={14} />
                {showJoin ? labels.cancel : labels.joinTitle}
              </Button>
            </div>

            {showJoin && (
              <div className="mb-4 bg-surface border border-border rounded-2xl p-5">
                <p className="text-xs text-muted-foreground mb-3">{labels.joinDesc}</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder={labels.joinPlaceholder}
                    className="flex-1 font-mono uppercase"
                  />
                  <div className="flex gap-2">
                    <Button onClick={() => requestJoin("PLAYER")} disabled={!joinCode.trim()}>
                      <User size={14} /> {t.playerOption}
                    </Button>
                    <Button variant="outline" onClick={() => requestJoin("WHITE_CELL")} disabled={!joinCode.trim()}>
                      <ShieldAlert size={14} /> {t.refereeOption}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <Tile
                accent="primary"
                icon={<User size={22} />}
                title={t.playerOption}
                description={t.playerOptionDesc}
                badge={labels.createNew}
                onClick={() => requestStart("PLAYER", "MULTI")}
              />
              <Tile
                accent="destructive"
                icon={<ShieldAlert size={22} />}
                title={t.refereeOption}
                description={t.refereeOptionDesc}
                badge={labels.createNew}
                onClick={() => requestStart("WHITE_CELL", "MULTI")}
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
                onClick={() => requestStart("PLAYER", "SOLO_PLAYER")}
              />
              <Tile
                accent="warning"
                badge={t.new}
                icon={<Bot size={22} />}
                title={t.soloReferee}
                description={t.soloRefereeDesc}
                onClick={() => requestStart("WHITE_CELL", "SOLO_WHITE_CELL")}
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
        <span className="absolute top-4 right-4 text-[9px] tracking-[0.2em] font-mono px-2 py-0.5 rounded-full bg-foreground text-background flex items-center gap-1">
          <Plus size={9} /> {badge}
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

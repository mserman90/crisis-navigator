import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Lobby } from "@/components/Lobby";
import { Header } from "@/components/SessionHeader";
import { LiveTicker } from "@/components/LiveTicker";
import { PlayerPanel } from "@/components/PlayerPanel";
import { RefereePanel } from "@/components/RefereePanel";
import { useAuth } from "@/components/AuthProvider";
import { useSession } from "@/hooks/useSession";
import {
  LocalSessionStoreProvider,
  RemoteSessionStoreProvider,
  useSessionStore,
} from "@/hooks/useSessionStore";
import { useI18n } from "@/lib/i18n";
import type { Role, SessionRow } from "@/lib/types";
import { Activity, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Strategic Crisis Simulation — Wargame Network" },
      {
        name: "description",
        content:
          "Multiplayer and AI-driven strategic crisis wargame: run the crisis desk as Blue Team, or escalate scenarios as the White Cell referee.",
      },
      { property: "og:title", content: "Strategic Crisis Simulation" },
      {
        property: "og:description",
        content:
          "AI-powered cyber-hydrological wargame. Play vs a referee or vs an autonomous virtual operator.",
      },
    ],
  }),
  component: Index,
});

function generateSessionCode() {
  const words = ["ATLAS", "DELTA", "ORION", "NOVA", "ECHO", "AXIS", "VEGA", "RAVEN"];
  const word = words[Math.floor(Math.random() * words.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${word}-${num}`;
}

function Index() {
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<Role | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [gameMode, setGameMode] = useState<SessionRow["game_mode"] | null>(null);
  const [joinAsParticipant, setJoinAsParticipant] = useState(false);

  const handleSelect = (args: {
    role: Role;
    mode: SessionRow["game_mode"];
    sessionCode?: string;
    asJoin?: boolean;
  }) => {
    setRole(args.role);
    setGameMode(args.mode);
    setJoinAsParticipant(!!args.asJoin);
    if (args.mode === "MULTI") {
      setSessionId(args.sessionCode ?? generateSessionCode());
    } else {
      // Solo modes: per-user session id (still tied to owner via RLS when signed in)
      setSessionId(`solo-${args.mode.toLowerCase()}-${user?.id ?? "guest"}-${Date.now()}`);
    }
  };

  const handleBack = () => {
    setRole(null);
    setSessionId(null);
    setGameMode(null);
    setJoinAsParticipant(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 font-mono text-sm text-muted-foreground uppercase tracking-widest">
          <Activity size={16} className="animate-spin" />
          {t.connecting}
        </div>
      </div>
    );
  }

  if (!role || !sessionId || !gameMode) {
    return <Lobby onSelect={handleSelect} />;
  }

  // Guest solo play: no Supabase row, no auth required.
  const isGuestSolo = !user && gameMode !== "MULTI";

  if (isGuestSolo) {
    return (
      <LocalSessionStoreProvider sessionId={sessionId} gameMode={gameMode}>
        <GuestSoloShell role={role} onBack={handleBack} />
      </LocalSessionStoreProvider>
    );
  }

  return (
    <RemoteSessionShell
      role={role}
      sessionId={sessionId}
      gameMode={gameMode}
      ownerUserId={user?.id ?? null}
      joinAsParticipant={joinAsParticipant}
      onBack={handleBack}
    />
  );
}

function GuestSoloShell({ role, onBack }: { role: Role; onBack: () => void }) {
  const { session } = useSessionStore();
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <LiveTicker items={session.news_feed} />
      <div className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8">
        <Header role={role} session={session} onBack={onBack} />
        {role === "PLAYER" ? <PlayerPanel session={session} /> : <RefereePanel session={session} />}
      </div>
    </div>
  );
}

function RemoteSessionShell({
  role,
  sessionId,
  gameMode,
  ownerUserId,
  joinAsParticipant,
  onBack,
}: {
  role: Role;
  sessionId: string;
  gameMode: SessionRow["game_mode"];
  ownerUserId: string | null;
  joinAsParticipant: boolean;
  onBack: () => void;
}) {
  const { t, lang } = useI18n();
  const { data: session, loading, error } = useSession({
    sessionId,
    gameMode,
    ownerUserId,
    joinAsParticipant,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 font-mono text-sm text-muted-foreground uppercase tracking-widest">
          <Activity size={16} className="animate-spin" />
          {t.syncing}
        </div>
      </div>
    );
  }

  if (error || !session) {
    const notFound = error === "not_found" || (!session && joinAsParticipant);
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md text-center bg-surface border border-border rounded-3xl p-8 shadow-elevated">
          <AlertTriangle size={32} className="text-destructive mx-auto mb-4" />
          <h2 className="text-lg font-display font-semibold text-foreground mb-2">
            {lang === "tr"
              ? notFound
                ? "Oturum bulunamadı veya erişim yok"
                : "Oturuma erişilemedi"
              : notFound
                ? "Session not found or no access"
                : "Cannot access session"}
          </h2>
          <p className="text-sm text-muted-foreground mb-6 font-mono">
            {error && error !== "not_found" ? error : null}
          </p>
          <Button onClick={onBack}>{t.backToLobby}</Button>
        </div>
      </div>
    );
  }

  return (
    <RemoteSessionStoreProvider session={session}>
      <div className="min-h-screen flex flex-col bg-background">
        <LiveTicker items={session.news_feed} />
        <div className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8">
          <Header role={role} session={session} onBack={onBack} />
          {role === "PLAYER" ? (
            <PlayerPanel session={session} />
          ) : (
            <RefereePanel session={session} />
          )}
        </div>
      </div>
    </RemoteSessionStoreProvider>
  );
}

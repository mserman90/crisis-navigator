import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Lobby } from "@/components/Lobby";
import { Header } from "@/components/SessionHeader";
import { LiveTicker } from "@/components/LiveTicker";
import { PlayerPanel } from "@/components/PlayerPanel";
import { RefereePanel } from "@/components/RefereePanel";
import { useSession } from "@/hooks/useSession";
import { useI18n } from "@/lib/i18n";
import type { Role, SessionRow } from "@/lib/types";
import { Activity } from "lucide-react";

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

function Index() {
  const { t } = useI18n();
  const [role, setRole] = useState<Role | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [gameMode, setGameMode] = useState<SessionRow["game_mode"] | null>(null);

  const { data: session, loading } = useSession(sessionId, gameMode);

  const handleSelect = (selectedRole: Role, mode: SessionRow["game_mode"]) => {
    setRole(selectedRole);
    setGameMode(mode);
    setSessionId(mode === "MULTI" ? "global-multi-session" : `solo-${Date.now()}`);
  };

  const handleBack = () => {
    setRole(null);
    setSessionId(null);
    setGameMode(null);
  };

  if (!role || !sessionId) {
    return <Lobby onSelect={handleSelect} />;
  }

  if (loading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 font-mono text-sm text-muted-foreground uppercase tracking-widest">
          <Activity size={16} className="animate-spin" />
          {t.syncing}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <LiveTicker items={session.news_feed} />
      <div className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8">
        <Header role={role} session={session} onBack={handleBack} />
        {role === "PLAYER" ? (
          <PlayerPanel session={session} />
        ) : (
          <RefereePanel session={session} />
        )}
      </div>
    </div>
  );
}

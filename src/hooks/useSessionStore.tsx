import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { SessionRow } from "@/lib/types";

export const initialMetrics = { water: 100, trust: 100, diplomacy: 100, infrastructure: 100 };

export type SessionStore = {
  session: SessionRow;
  update: (patch: Partial<SessionRow>) => Promise<void> | void;
  reset: () => Promise<void> | void;
};

const Ctx = createContext<SessionStore | null>(null);

export function useSessionStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("SessionStoreProvider missing");
  return v;
}

/** Backend-backed store: writes go to Supabase. Caller passes the live row from useSession. */
export function RemoteSessionStoreProvider({
  session,
  children,
}: {
  session: SessionRow;
  children: React.ReactNode;
}) {
  const update = useCallback(
    async (patch: Partial<SessionRow>) => {
      await supabase.from("wargames").update(patch as never).eq("session_id", session.session_id);
    },
    [session.session_id]
  );
  const reset = useCallback(async () => {
    await supabase
      .from("wargames")
      .update({
        status: "LOBBY",
        game_mode: session.game_mode,
        metrics: initialMetrics,
        history: [],
        news_feed: [],
        current_round: null,
      } as never)
      .eq("session_id", session.session_id);
  }, [session.session_id, session.game_mode]);

  const value = useMemo<SessionStore>(() => ({ session, update, reset }), [session, update, reset]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** In-memory store for unauthenticated solo play. No persistence, no realtime. */
export function LocalSessionStoreProvider({
  sessionId,
  gameMode,
  children,
}: {
  sessionId: string;
  gameMode: SessionRow["game_mode"];
  children: React.ReactNode;
}) {
  const initialRef = useRef<SessionRow>({
    id: `local-${sessionId}`,
    session_id: sessionId,
    status: "LOBBY",
    game_mode: gameMode,
    threat: "Cyber-Hydrological Hybrid Attack",
    metrics: initialMetrics,
    history: [],
    news_feed: [],
    current_round: null,
    owner_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  const [session, setSession] = useState<SessionRow>(initialRef.current);

  const update = useCallback((patch: Partial<SessionRow>) => {
    setSession((prev) => ({ ...prev, ...patch, updated_at: new Date().toISOString() }));
  }, []);
  const reset = useCallback(() => {
    setSession({
      ...initialRef.current,
      created_at: initialRef.current.created_at,
      updated_at: new Date().toISOString(),
    });
  }, []);

  const value = useMemo<SessionStore>(() => ({ session, update, reset }), [session, update, reset]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

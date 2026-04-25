import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { SessionRow } from "@/lib/types";

const initialMetrics = { water: 100, trust: 100, diplomacy: 100, infrastructure: 100 };

export function useSession(sessionId: string | null, gameMode: SessionRow["game_mode"] | null) {
  const [data, setData] = useState<SessionRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId || !gameMode) return;
    let cancelled = false;

    const ensureRow = async () => {
      const { data: existing } = await supabase
        .from("wargames")
        .select("*")
        .eq("session_id", sessionId)
        .maybeSingle();

      if (cancelled) return;

      if (!existing) {
        const { data: created } = await supabase
          .from("wargames")
          .insert({
            session_id: sessionId,
            status: "LOBBY",
            game_mode: gameMode,
            threat: "Cyber-Hydrological Hybrid Attack",
            metrics: initialMetrics,
            history: [],
            news_feed: [],
            current_round: null,
          })
          .select()
          .single();
        if (!cancelled && created) setData(created as unknown as SessionRow);
      } else {
        setData(existing as unknown as SessionRow);
      }
      setLoading(false);
    };

    ensureRow();

    const channel = supabase
      .channel(`wargames:${sessionId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "wargames", filter: `session_id=eq.${sessionId}` },
        (payload) => {
          if (payload.new) setData(payload.new as unknown as SessionRow);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [sessionId, gameMode]);

  return { data, loading };
}

export async function updateSession(sessionId: string, patch: Partial<SessionRow>) {
  await supabase.from("wargames").update(patch as never).eq("session_id", sessionId);
}

export async function resetSession(sessionId: string, gameMode: SessionRow["game_mode"]) {
  await supabase
    .from("wargames")
    .update({
      status: "LOBBY",
      game_mode: gameMode,
      metrics: initialMetrics,
      history: [],
      news_feed: [],
      current_round: null,
    } as never)
    .eq("session_id", sessionId);
}

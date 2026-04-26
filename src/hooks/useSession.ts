import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { SessionRow } from "@/lib/types";

const initialMetrics = { water: 100, trust: 100, diplomacy: 100, infrastructure: 100 };

type Args = {
  sessionId: string | null;
  gameMode: SessionRow["game_mode"] | null;
  /** When provided, the row will be created if it doesn't exist with this user as owner. */
  ownerUserId?: string | null;
  /** When true and game mode is MULTI, the current user will be registered as a participant after the row is found. */
  joinAsParticipant?: boolean;
};

export function useSession({ sessionId, gameMode, ownerUserId, joinAsParticipant }: Args) {
  const [data, setData] = useState<SessionRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId || !gameMode) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    const ensureRow = async () => {
      const { data: existing, error: selectErr } = await supabase
        .from("wargames")
        .select("*")
        .eq("session_id", sessionId)
        .maybeSingle();

      if (cancelled) return;

      if (selectErr) {
        setError(selectErr.message);
        setLoading(false);
        return;
      }

      let row = existing as unknown as SessionRow | null;

      if (!row) {
        if (!ownerUserId) {
          setError("not_found");
          setLoading(false);
          return;
        }
        const { data: created, error: insertErr } = await supabase
          .from("wargames")
          .insert({
            session_id: sessionId,
            owner_id: ownerUserId,
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
        if (insertErr) {
          setError(insertErr.message);
          setLoading(false);
          return;
        }
        row = created as unknown as SessionRow;
      }

      if (!cancelled && row) {
        setData(row);

        // Register as participant for MULTI sessions when joining as a non-owner
        if (
          joinAsParticipant &&
          row.game_mode === "MULTI" &&
          ownerUserId &&
          row.owner_id !== ownerUserId
        ) {
          await supabase
            .from("session_participants")
            .upsert(
              { wargame_id: row.id, user_id: ownerUserId },
              { onConflict: "wargame_id,user_id", ignoreDuplicates: true }
            );
        }
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
  }, [sessionId, gameMode, ownerUserId, joinAsParticipant]);

  return { data, loading, error };
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

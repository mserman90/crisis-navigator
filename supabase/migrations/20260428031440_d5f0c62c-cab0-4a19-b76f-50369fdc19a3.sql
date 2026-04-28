-- 1) Add 'role' column on session_participants for server-side referee enforcement
ALTER TABLE public.session_participants
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'PLAYER'
  CHECK (role IN ('PLAYER', 'WHITE_CELL'));

-- 2) Helper: is the user the owner of a wargame?
CREATE OR REPLACE FUNCTION public.is_session_owner(_wargame_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.wargames w
    WHERE w.id = _wargame_id AND w.owner_id = _user_id
  );
$$;

-- 3) Helper: is the user a referee (WHITE_CELL) or owner?
CREATE OR REPLACE FUNCTION public.is_session_referee(_wargame_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.wargames w
    WHERE w.id = _wargame_id AND w.owner_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.session_participants p
    WHERE p.wargame_id = _wargame_id
      AND p.user_id = _user_id
      AND p.role = 'WHITE_CELL'
  );
$$;

-- 4) Replace the over-permissive UPDATE policy on wargames.
-- Owners may update any field. Participants may only update player-relevant
-- fields, may not change owner_id, game_mode, session_id, or owner-only state.
DROP POLICY IF EXISTS "Owners and participants can update" ON public.wargames;

-- Owners: full update, but owner_id must remain themselves
CREATE POLICY "Owners can update wargames"
ON public.wargames
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Participants (MULTI): may update only if non-sensitive fields changed.
-- We enforce this with a trigger because RLS cannot easily diff columns.
CREATE POLICY "Participants can update gameplay fields"
ON public.wargames
FOR UPDATE
TO authenticated
USING (
  game_mode = 'MULTI'
  AND owner_id <> auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.session_participants p
    WHERE p.wargame_id = wargames.id AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  game_mode = 'MULTI'
  AND owner_id <> auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.session_participants p
    WHERE p.wargame_id = wargames.id AND p.user_id = auth.uid()
  )
);

-- 5) Trigger to lock down which columns non-owner participants can change.
-- Owners can change anything; non-owners may only modify metrics, history,
-- and (for WHITE_CELL referees) news_feed, current_round, status.
CREATE OR REPLACE FUNCTION public.enforce_wargames_update_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  is_owner boolean;
  is_ref boolean;
BEGIN
  -- Service role / no JWT: skip checks
  IF uid IS NULL THEN
    RETURN NEW;
  END IF;

  is_owner := (OLD.owner_id = uid);

  IF is_owner THEN
    -- Owner can change anything except handing ownership to a stranger:
    -- they may transfer to themselves only (effectively no change).
    IF NEW.owner_id IS DISTINCT FROM OLD.owner_id AND NEW.owner_id <> uid THEN
      RAISE EXCEPTION 'Cannot transfer wargame ownership';
    END IF;
    RETURN NEW;
  END IF;

  -- Non-owner: forbid changes to immutable / ownership-related columns
  IF NEW.owner_id IS DISTINCT FROM OLD.owner_id
     OR NEW.session_id IS DISTINCT FROM OLD.session_id
     OR NEW.game_mode IS DISTINCT FROM OLD.game_mode
     OR NEW.threat IS DISTINCT FROM OLD.threat
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Only the owner can modify session ownership or identity fields';
  END IF;

  is_ref := EXISTS (
    SELECT 1 FROM public.session_participants p
    WHERE p.wargame_id = OLD.id
      AND p.user_id = uid
      AND p.role = 'WHITE_CELL'
  );

  -- Non-referee participants may only update metrics and history
  IF NOT is_ref THEN
    IF NEW.status IS DISTINCT FROM OLD.status
       OR NEW.current_round IS DISTINCT FROM OLD.current_round
       OR NEW.news_feed IS DISTINCT FROM OLD.news_feed THEN
      RAISE EXCEPTION 'Only the referee or owner can modify status, current_round, or news_feed';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_wargames_update_columns_trg ON public.wargames;
CREATE TRIGGER enforce_wargames_update_columns_trg
BEFORE UPDATE ON public.wargames
FOR EACH ROW EXECUTE FUNCTION public.enforce_wargames_update_columns();

-- 6) Restrict joining session_participants to MULTI sessions in LOBBY status,
-- and prevent self-promoting to WHITE_CELL on insert.
DROP POLICY IF EXISTS "Users can join MULTI sessions" ON public.session_participants;

CREATE POLICY "Users can join MULTI sessions in lobby"
ON public.session_participants
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND role = 'PLAYER'
  AND EXISTS (
    SELECT 1 FROM public.wargames w
    WHERE w.id = session_participants.wargame_id
      AND w.game_mode = 'MULTI'
      AND w.status = 'LOBBY'
  )
);

-- Only the owner can change a participant's role (e.g. promote to WHITE_CELL).
CREATE POLICY "Owners can update participant role"
ON public.session_participants
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.wargames w
    WHERE w.id = session_participants.wargame_id AND w.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.wargames w
    WHERE w.id = session_participants.wargame_id AND w.owner_id = auth.uid()
  )
);

-- 7) Realtime channel authorization: only members of a wargame may subscribe
-- to its postgres_changes channel (channel topic is 'wargames:<session_id>').
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can subscribe to wargame channel" ON realtime.messages;
CREATE POLICY "Members can subscribe to wargame channel"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- Allow only when topic matches a wargame channel for which the user is a member
  (realtime.topic() LIKE 'wargames:%')
  AND EXISTS (
    SELECT 1 FROM public.wargames w
    WHERE w.session_id = substring(realtime.topic() from 10)
      AND (
        w.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.session_participants p
          WHERE p.wargame_id = w.id AND p.user_id = auth.uid()
        )
      )
  )
);

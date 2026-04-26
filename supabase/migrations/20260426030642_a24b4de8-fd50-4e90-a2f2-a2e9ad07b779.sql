-- 1. Drop existing permissive policies
DROP POLICY IF EXISTS "Anyone can create wargames" ON public.wargames;
DROP POLICY IF EXISTS "Anyone can read wargames" ON public.wargames;
DROP POLICY IF EXISTS "Anyone can update wargames" ON public.wargames;

-- 2. Add owner_id to wargames
ALTER TABLE public.wargames
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Existing rows: leave owner_id null (legacy); they will be inaccessible going forward.

CREATE INDEX IF NOT EXISTS wargames_owner_id_idx ON public.wargames(owner_id);
CREATE INDEX IF NOT EXISTS wargames_session_id_idx ON public.wargames(session_id);

-- 3. session_participants table
CREATE TABLE IF NOT EXISTS public.session_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wargame_id uuid NOT NULL REFERENCES public.wargames(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (wargame_id, user_id)
);

CREATE INDEX IF NOT EXISTS session_participants_wargame_idx ON public.session_participants(wargame_id);
CREATE INDEX IF NOT EXISTS session_participants_user_idx ON public.session_participants(user_id);

ALTER TABLE public.session_participants ENABLE ROW LEVEL SECURITY;

-- 4. Security definer helper to avoid recursive RLS
CREATE OR REPLACE FUNCTION public.is_session_member(_wargame_id uuid, _user_id uuid)
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
    WHERE p.wargame_id = _wargame_id AND p.user_id = _user_id
  );
$$;

-- 5. wargames RLS policies
-- SELECT: owner OR participant (any mode)
CREATE POLICY "Members can read their wargames"
ON public.wargames
FOR SELECT
TO authenticated
USING (
  owner_id = auth.uid()
  OR (
    game_mode = 'MULTI'
    AND EXISTS (
      SELECT 1 FROM public.session_participants p
      WHERE p.wargame_id = wargames.id AND p.user_id = auth.uid()
    )
  )
);

-- INSERT: must set owner_id to self
CREATE POLICY "Authenticated users can create wargames"
ON public.wargames
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

-- UPDATE: owner always; participants only on MULTI
CREATE POLICY "Owners and participants can update"
ON public.wargames
FOR UPDATE
TO authenticated
USING (
  owner_id = auth.uid()
  OR (
    game_mode = 'MULTI'
    AND EXISTS (
      SELECT 1 FROM public.session_participants p
      WHERE p.wargame_id = wargames.id AND p.user_id = auth.uid()
    )
  )
)
WITH CHECK (
  owner_id = auth.uid()
  OR (
    game_mode = 'MULTI'
    AND EXISTS (
      SELECT 1 FROM public.session_participants p
      WHERE p.wargame_id = wargames.id AND p.user_id = auth.uid()
    )
  )
);

-- DELETE: only owner
CREATE POLICY "Owners can delete wargames"
ON public.wargames
FOR DELETE
TO authenticated
USING (owner_id = auth.uid());

-- 6. session_participants RLS policies
-- SELECT: members of the same session
CREATE POLICY "Members can read participants"
ON public.session_participants
FOR SELECT
TO authenticated
USING (public.is_session_member(wargame_id, auth.uid()));

-- INSERT: a logged-in user can join a MULTI session by inserting their own row
CREATE POLICY "Users can join MULTI sessions"
ON public.session_participants
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.wargames w
    WHERE w.id = wargame_id AND w.game_mode = 'MULTI'
  )
);

-- DELETE: a user can remove their own participation; owner can remove any
CREATE POLICY "Users can leave or owners can remove"
ON public.session_participants
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.wargames w
    WHERE w.id = wargame_id AND w.owner_id = auth.uid()
  )
);

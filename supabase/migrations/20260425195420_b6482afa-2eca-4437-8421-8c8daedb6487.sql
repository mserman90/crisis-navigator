
CREATE TABLE public.wargames (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'LOBBY',
  game_mode text NOT NULL DEFAULT 'MULTI',
  threat text NOT NULL DEFAULT 'Cyber-Hydrological Hybrid Attack',
  metrics jsonb NOT NULL DEFAULT '{"water":100,"trust":100,"diplomacy":100,"infrastructure":100}'::jsonb,
  history jsonb NOT NULL DEFAULT '[]'::jsonb,
  news_feed jsonb NOT NULL DEFAULT '[]'::jsonb,
  current_round jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX wargames_session_id_idx ON public.wargames(session_id);

ALTER TABLE public.wargames ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read wargames"
  ON public.wargames FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create wargames"
  ON public.wargames FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update wargames"
  ON public.wargames FOR UPDATE
  USING (true);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER wargames_updated_at
  BEFORE UPDATE ON public.wargames
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.wargames;
ALTER TABLE public.wargames REPLICA IDENTITY FULL;

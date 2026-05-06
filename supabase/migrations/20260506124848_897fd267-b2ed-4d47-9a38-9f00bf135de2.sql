
-- tactical_xp: stores XP events
CREATE TABLE public.tactical_xp (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  xp_amount integer NOT NULL,
  reason text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.tactical_xp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own xp"
ON public.tactical_xp FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own xp"
ON public.tactical_xp FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow all authenticated users to read all XP for ranking
CREATE POLICY "Authenticated can read all xp for ranking"
ON public.tactical_xp FOR SELECT
TO authenticated
USING (true);

-- daily_readiness: daily report per user
CREATE TABLE public.daily_readiness (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  fatigue_level integer NOT NULL DEFAULT 0,
  borg_level integer NOT NULL DEFAULT 0,
  hydration_level integer NOT NULL DEFAULT 1,
  sleep_hours numeric(3,1) NOT NULL DEFAULT 0,
  report_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, report_date)
);

ALTER TABLE public.daily_readiness ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own readiness"
ON public.daily_readiness FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own readiness"
ON public.daily_readiness FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own readiness"
ON public.daily_readiness FOR UPDATE
USING (auth.uid() = user_id);

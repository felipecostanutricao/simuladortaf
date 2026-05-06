
CREATE TABLE public.system_settings (
  id integer PRIMARY KEY DEFAULT 1,
  weight_cooldown_days integer NOT NULL DEFAULT 7,
  xp_simulado integer NOT NULL DEFAULT 10,
  xp_simulado_perfect integer NOT NULL DEFAULT 25,
  xp_bio_update integer NOT NULL DEFAULT 5,
  xp_daily_report integer NOT NULL DEFAULT 3,
  rank_operador_min integer NOT NULL DEFAULT 100,
  rank_elite_min integer NOT NULL DEFAULT 500,
  rank_fe_min integer NOT NULL DEFAULT 1000,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Seed the single row
INSERT INTO public.system_settings (id) VALUES (1);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read
CREATE POLICY "Admins can view system_settings"
ON public.system_settings FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can update
CREATE POLICY "Admins can update system_settings"
ON public.system_settings FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

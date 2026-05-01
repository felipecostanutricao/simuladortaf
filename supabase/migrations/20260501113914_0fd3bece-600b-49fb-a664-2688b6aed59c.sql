CREATE TABLE public.physical_evolution (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  weight NUMERIC(5,2) NOT NULL,
  height NUMERIC(4,2) NOT NULL,
  bmi NUMERIC(5,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.physical_evolution ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own physical_evolution"
  ON public.physical_evolution FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own physical_evolution"
  ON public.physical_evolution FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own physical_evolution"
  ON public.physical_evolution FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own physical_evolution"
  ON public.physical_evolution FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all physical_evolution"
  ON public.physical_evolution FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));
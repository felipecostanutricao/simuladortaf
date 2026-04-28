-- profiles
ALTER TABLE public.profiles RENAME COLUMN display_name TO full_name;
ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;

-- taf_goals
ALTER TABLE public.taf_goals RENAME COLUMN barra TO barra_meta;
ALTER TABLE public.taf_goals RENAME COLUMN flexao TO flexao_meta;
ALTER TABLE public.taf_goals RENAME COLUMN corrida TO corrida_meta;
ALTER TABLE public.taf_goals RENAME COLUMN natacao TO natacao_meta;
ALTER TABLE public.taf_goals ADD COLUMN data_taf DATE;

-- taf_records
ALTER TABLE public.taf_records RENAME COLUMN barra TO barra_result;
ALTER TABLE public.taf_records RENAME COLUMN flexao TO flexao_result;
ALTER TABLE public.taf_records RENAME COLUMN corrida TO corrida_result;
ALTER TABLE public.taf_records RENAME COLUMN natacao TO natacao_result;
ALTER TABLE public.taf_records DROP COLUMN indice;

-- Update trigger to use full_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)));

  INSERT INTO public.taf_goals (user_id) VALUES (NEW.id);

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
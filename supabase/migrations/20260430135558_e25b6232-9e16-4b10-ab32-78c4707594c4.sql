-- 1. Garantir que is_active default é FALSE para novos perfis
ALTER TABLE public.profiles ALTER COLUMN is_active SET DEFAULT false;

-- 2. Atualizar função handle_new_user para inserir is_active = false
-- (admin master continua ativo automaticamente)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    CASE WHEN NEW.email = 'felipecostanutricao@gmail.com' THEN true ELSE false END
  );

  INSERT INTO public.taf_goals (user_id) VALUES (NEW.id);

  IF NEW.email = 'felipecostanutricao@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'recruta');
  END IF;

  RETURN NEW;
END;
$function$;

-- 3. Garantir trigger no auth.users (caso não exista)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Manter admin master sempre ativo
UPDATE public.profiles SET is_active = true WHERE email = 'felipecostanutricao@gmail.com';
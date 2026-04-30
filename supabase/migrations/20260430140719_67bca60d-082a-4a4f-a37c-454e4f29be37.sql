-- 1. Adiciona colunas de vigência
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS hiring_date timestamptz,
  ADD COLUMN IF NOT EXISTS expiry_date timestamptz;

-- 2. Função de trigger para gerir vigência ao ativar/desativar
CREATE OR REPLACE FUNCTION public.handle_profile_activation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ativação: false -> true
  IF (TG_OP = 'UPDATE' AND OLD.is_active = false AND NEW.is_active = true) THEN
    -- Só define automaticamente se o admin não enviou datas explícitas
    IF NEW.hiring_date IS NULL OR NEW.hiring_date = OLD.hiring_date THEN
      NEW.hiring_date := now();
    END IF;
    IF NEW.expiry_date IS NULL OR NEW.expiry_date = OLD.expiry_date THEN
      NEW.expiry_date := COALESCE(NEW.hiring_date, now()) + interval '30 days';
    END IF;
  END IF;

  -- Desativação: true -> false (limpa datas)
  IF (TG_OP = 'UPDATE' AND OLD.is_active = true AND NEW.is_active = false) THEN
    NEW.hiring_date := NULL;
    NEW.expiry_date := NULL;
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Trigger
DROP TRIGGER IF EXISTS trg_profile_activation ON public.profiles;
CREATE TRIGGER trg_profile_activation
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_profile_activation();

-- 4. Garante que o admin master já existente tenha vigência longa
UPDATE public.profiles
SET hiring_date = COALESCE(hiring_date, now()),
    expiry_date = COALESCE(expiry_date, now() + interval '3650 days')
WHERE email = 'felipecostanutricao@gmail.com' AND is_active = true;
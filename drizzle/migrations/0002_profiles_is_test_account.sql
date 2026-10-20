ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_test_account boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.protect_profile_test_flag()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  _privileged boolean := COALESCE(auth.role(), '') = 'service_role'
    OR current_user IN ('postgres', 'supabase_admin', 'service_role');
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_test_account AND NOT _privileged THEN
      RAISE EXCEPTION 'is_test_account só pode ser definido pelo seed' USING ERRCODE = '42501';
    END IF;
  ELSIF NEW.is_test_account IS DISTINCT FROM OLD.is_test_account AND NOT _privileged THEN
    RAISE EXCEPTION 'is_test_account só pode ser alterado pelo seed' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.protect_profile_test_flag() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS protect_profile_test_flag_trigger ON public.profiles;
CREATE TRIGGER protect_profile_test_flag_trigger
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_test_flag();
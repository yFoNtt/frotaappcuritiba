CREATE OR REPLACE FUNCTION public.bootstrap_own_profile(
  _document_type text DEFAULT NULL,
  _document_number text DEFAULT NULL,
  _cnh_number text DEFAULT NULL,
  _cnh_expiry date DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
  ) THEN
    RAISE EXCEPTION 'Profile already exists' USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.profiles (
    user_id,
    document_type,
    document_number,
    cnh_number,
    cnh_expiry
  )
  VALUES (
    _user_id,
    _document_type,
    _document_number,
    _cnh_number,
    _cnh_expiry
  );
END;
$$;

REVOKE ALL ON FUNCTION public.bootstrap_own_profile(text, text, text, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bootstrap_own_profile(text, text, text, date) TO authenticated, service_role;

CREATE POLICY "MFA verified profile inserts"
ON public.profiles AS RESTRICTIVE
FOR INSERT TO authenticated
WITH CHECK (private.is_mfa_session_verified());
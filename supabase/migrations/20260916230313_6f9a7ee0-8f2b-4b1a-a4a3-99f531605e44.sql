CREATE OR REPLACE FUNCTION private.is_mfa_session_verified()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT
        NOT p.mfa_enabled
        OR (
          p.mfa_verified_session_id IS NOT NULL
          AND p.mfa_verified_session_id::text = (auth.jwt() ->> 'session_id')
          AND p.mfa_verified_until > now()
        )
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
    ),
    false
  )
$$;

REVOKE ALL ON FUNCTION private.is_mfa_session_verified() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_mfa_session_verified() TO authenticated, service_role;

DROP POLICY "MFA verified access to profiles" ON public.profiles;

CREATE POLICY "MFA verified profile reads"
ON public.profiles AS RESTRICTIVE
FOR SELECT TO authenticated
USING (private.is_mfa_session_verified());

CREATE POLICY "MFA verified profile updates"
ON public.profiles AS RESTRICTIVE
FOR UPDATE TO authenticated
USING (private.is_mfa_session_verified())
WITH CHECK (private.is_mfa_session_verified());

CREATE POLICY "MFA verified profile deletes"
ON public.profiles AS RESTRICTIVE
FOR DELETE TO authenticated
USING (private.is_mfa_session_verified());
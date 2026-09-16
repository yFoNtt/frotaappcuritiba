CREATE OR REPLACE FUNCTION private.is_mfa_session_verified()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
    AND COALESCE(
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
      true
    )
$$;

REVOKE ALL ON FUNCTION private.is_mfa_session_verified() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_mfa_session_verified() TO authenticated, service_role;

INSERT INTO public.profiles (user_id)
SELECT u.id
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1
  FROM public.profiles p
  WHERE p.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;
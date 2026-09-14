CREATE OR REPLACE FUNCTION public.set_own_mfa_enabled(_enabled boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  UPDATE public.profiles
  SET mfa_enabled = _enabled,
      mfa_verified_session_id = CASE WHEN _enabled THEN NULL ELSE mfa_verified_session_id END,
      mfa_verified_until = CASE WHEN _enabled THEN NULL ELSE mfa_verified_until END,
      updated_at = now()
  WHERE user_id = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public.set_own_mfa_enabled(boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_own_mfa_enabled(boolean) TO authenticated;

CREATE POLICY "MFA verified access to user roles"
ON public.user_roles AS RESTRICTIVE FOR ALL TO authenticated
USING (public.is_mfa_session_verified())
WITH CHECK (public.is_mfa_session_verified());

CREATE POLICY "MFA verified access to private storage"
ON storage.objects AS RESTRICTIVE FOR ALL TO authenticated
USING (
  bucket_id NOT IN ('documents', 'inspection-photos', 'vehicle-images')
  OR public.is_mfa_session_verified()
)
WITH CHECK (
  bucket_id NOT IN ('documents', 'inspection-photos', 'vehicle-images')
  OR public.is_mfa_session_verified()
);
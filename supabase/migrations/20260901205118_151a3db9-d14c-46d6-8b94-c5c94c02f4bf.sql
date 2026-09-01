CREATE OR REPLACE FUNCTION public.admin_set_user_mfa(_user_id uuid, _enabled boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden_admin_only';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = _user_id) THEN
    RAISE EXCEPTION 'user_not_found';
  END IF;

  UPDATE public.profiles
  SET mfa_enabled = _enabled, updated_at = now()
  WHERE user_id = _user_id;

  RETURN jsonb_build_object('success', true, 'user_id', _user_id, 'mfa_enabled', _enabled);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_user_mfa(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_user_mfa(uuid, boolean) TO authenticated;
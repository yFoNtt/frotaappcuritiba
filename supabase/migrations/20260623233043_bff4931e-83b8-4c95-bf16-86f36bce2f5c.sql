
-- Add blocked columns to profiles + admin RPCs to manage blocking
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS blocked_reason TEXT,
  ADD COLUMN IF NOT EXISTS blocked_by UUID;

-- RPC: admin sets blocked state for any user. Creates a minimal profile row
-- if the target doesn't have one yet, so blocking always lands.
CREATE OR REPLACE FUNCTION public.admin_set_user_blocked(
  _user_id UUID,
  _blocked BOOLEAN,
  _reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _caller UUID := auth.uid();
BEGIN
  IF _caller IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;
  IF NOT public.has_role(_caller, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'forbidden_admin_only' USING ERRCODE = '42501';
  END IF;
  IF _user_id = _caller THEN
    RAISE EXCEPTION 'cannot_block_self' USING ERRCODE = '22023';
  END IF;
  IF public.has_role(_user_id, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'cannot_block_admin' USING ERRCODE = '22023';
  END IF;

  -- Ensure profile row exists so blocked_at always persists
  INSERT INTO public.profiles (user_id)
  VALUES (_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  IF _blocked THEN
    UPDATE public.profiles
    SET blocked_at = now(),
        blocked_reason = _reason,
        blocked_by = _caller,
        updated_at = now()
    WHERE user_id = _user_id;
  ELSE
    UPDATE public.profiles
    SET blocked_at = NULL,
        blocked_reason = NULL,
        blocked_by = NULL,
        updated_at = now()
    WHERE user_id = _user_id;
  END IF;

  RETURN jsonb_build_object('user_id', _user_id, 'blocked', _blocked);
END;
$$;

-- RPC: any authenticated user checks their own block status. Used by the
-- client right after sign-in to force sign-out of blocked accounts.
CREATE OR REPLACE FUNCTION public.is_current_user_blocked()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT blocked_at IS NOT NULL
     FROM public.profiles
     WHERE user_id = auth.uid()),
    false
  );
$$;

REVOKE ALL ON FUNCTION public.admin_set_user_blocked(UUID, BOOLEAN, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_user_blocked(UUID, BOOLEAN, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.is_current_user_blocked() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_current_user_blocked() TO authenticated;

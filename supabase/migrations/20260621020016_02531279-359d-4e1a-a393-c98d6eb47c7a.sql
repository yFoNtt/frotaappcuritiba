ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS invite_token uuid,
  ADD COLUMN IF NOT EXISTS invite_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS invite_claimed_at timestamptz;

DROP INDEX IF EXISTS drivers_invite_token_uniq;
CREATE UNIQUE INDEX drivers_invite_token_uniq
  ON public.drivers (invite_token)
  WHERE invite_token IS NOT NULL;

CREATE OR REPLACE FUNCTION public.get_driver_invite_preview(_token uuid)
RETURNS TABLE (driver_name text, locador_name text, valid boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    d.name AS driver_name,
    COALESCE(p.full_name, 'o locador') AS locador_name,
    (d.user_id IS NULL AND d.invite_expires_at > now()) AS valid
  FROM public.drivers d
  LEFT JOIN public.profiles p ON p.user_id = d.locador_id
  WHERE d.invite_token = _token;
$$;

REVOKE ALL ON FUNCTION public.get_driver_invite_preview(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_driver_invite_preview(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.claim_driver_invite(_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _driver RECORD;
  _lead_conv_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  IF NOT public.has_role(auth.uid(), 'motorista'::public.app_role) THEN
    RETURN jsonb_build_object('success', false, 'error', 'wrong_role');
  END IF;

  SELECT * INTO _driver
  FROM public.drivers
  WHERE invite_token = _token
    AND user_id IS NULL
    AND invite_expires_at > now()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_or_expired');
  END IF;

  UPDATE public.drivers
  SET user_id = auth.uid(),
      invite_token = NULL,
      invite_claimed_at = now()
  WHERE id = _driver.id;

  SELECT id INTO _lead_conv_id
  FROM public.conversations
  WHERE locador_id = _driver.locador_id
    AND interested_user_id = auth.uid()
    AND driver_id IS NULL;

  IF _lead_conv_id IS NOT NULL THEN
    UPDATE public.conversations
    SET driver_id = _driver.id,
        interested_user_id = NULL
    WHERE id = _lead_conv_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'driver_id', _driver.id, 'locador_id', _driver.locador_id);
END;
$$;

REVOKE ALL ON FUNCTION public.claim_driver_invite(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_driver_invite(uuid) TO authenticated;
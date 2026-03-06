CREATE OR REPLACE FUNCTION public.insert_cnh_alert(_user_id uuid, _alert_type text, _cnh_expiry date)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  _alert_id UUID;
BEGIN
  -- Only allow calls from service role (auth.uid() IS NULL) or admin users
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: only admins or service role can insert CNH alerts';
  END IF;

  INSERT INTO public.cnh_alerts (user_id, alert_type, cnh_expiry)
  VALUES (_user_id, _alert_type, _cnh_expiry)
  RETURNING id INTO _alert_id;
  
  RETURN _alert_id;
END;
$$;
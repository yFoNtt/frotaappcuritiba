-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Service role can insert alerts" ON public.cnh_alerts;

-- Create a function to insert alerts (security definer allows bypassing RLS)
CREATE OR REPLACE FUNCTION public.insert_cnh_alert(
  _user_id UUID,
  _alert_type TEXT,
  _cnh_expiry DATE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _alert_id UUID;
BEGIN
  INSERT INTO public.cnh_alerts (user_id, alert_type, cnh_expiry)
  VALUES (_user_id, _alert_type, _cnh_expiry)
  RETURNING id INTO _alert_id;
  
  RETURN _alert_id;
END;
$$;
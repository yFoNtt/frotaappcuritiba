ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS mfa_verified_session_id uuid,
  ADD COLUMN IF NOT EXISTS mfa_verified_until timestamptz;

CREATE TABLE public.mfa_challenges (
  user_id uuid PRIMARY KEY,
  initial_session_id uuid NOT NULL,
  requested_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);
GRANT ALL ON public.mfa_challenges TO service_role;
ALTER TABLE public.mfa_challenges ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_mfa_session_verified()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    NOT p.mfa_enabled
    OR (
      p.mfa_verified_session_id IS NOT NULL
      AND p.mfa_verified_session_id::text = (auth.jwt() ->> 'session_id')
      AND p.mfa_verified_until > now()
    ),
    false
  )
  FROM public.profiles p
  WHERE p.user_id = auth.uid()
$$;

REVOKE ALL ON FUNCTION public.is_mfa_session_verified() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_mfa_session_verified() TO authenticated, service_role;

CREATE POLICY "MFA verified access to audit logs"
ON public.audit_logs AS RESTRICTIVE FOR ALL TO authenticated
USING (public.is_mfa_session_verified())
WITH CHECK (public.is_mfa_session_verified());
CREATE POLICY "MFA verified access to CNH alerts"
ON public.cnh_alerts AS RESTRICTIVE FOR ALL TO authenticated
USING (public.is_mfa_session_verified())
WITH CHECK (public.is_mfa_session_verified());
CREATE POLICY "MFA verified access to consents"
ON public.consents AS RESTRICTIVE FOR ALL TO authenticated
USING (public.is_mfa_session_verified())
WITH CHECK (public.is_mfa_session_verified());
CREATE POLICY "MFA verified access to contracts"
ON public.contracts AS RESTRICTIVE FOR ALL TO authenticated
USING (public.is_mfa_session_verified())
WITH CHECK (public.is_mfa_session_verified());
CREATE POLICY "MFA verified access to conversations"
ON public.conversations AS RESTRICTIVE FOR ALL TO authenticated
USING (public.is_mfa_session_verified())
WITH CHECK (public.is_mfa_session_verified());
CREATE POLICY "MFA verified access to document requests"
ON public.document_requests AS RESTRICTIVE FOR ALL TO authenticated
USING (public.is_mfa_session_verified())
WITH CHECK (public.is_mfa_session_verified());
CREATE POLICY "MFA verified access to documents"
ON public.documents AS RESTRICTIVE FOR ALL TO authenticated
USING (public.is_mfa_session_verified())
WITH CHECK (public.is_mfa_session_verified());
CREATE POLICY "MFA verified access to drivers"
ON public.drivers AS RESTRICTIVE FOR ALL TO authenticated
USING (public.is_mfa_session_verified())
WITH CHECK (public.is_mfa_session_verified());
CREATE POLICY "MFA verified access to checklist templates"
ON public.inspection_checklist_templates AS RESTRICTIVE FOR ALL TO authenticated
USING (public.is_mfa_session_verified())
WITH CHECK (public.is_mfa_session_verified());
CREATE POLICY "MFA verified access to login attempts"
ON public.login_attempts AS RESTRICTIVE FOR ALL TO authenticated
USING (public.is_mfa_session_verified())
WITH CHECK (public.is_mfa_session_verified());
CREATE POLICY "MFA verified access to maintenances"
ON public.maintenances AS RESTRICTIVE FOR ALL TO authenticated
USING (public.is_mfa_session_verified())
WITH CHECK (public.is_mfa_session_verified());
CREATE POLICY "MFA verified access to messages"
ON public.messages AS RESTRICTIVE FOR ALL TO authenticated
USING (public.is_mfa_session_verified())
WITH CHECK (public.is_mfa_session_verified());
CREATE POLICY "MFA verified access to mileage records"
ON public.mileage_records AS RESTRICTIVE FOR ALL TO authenticated
USING (public.is_mfa_session_verified())
WITH CHECK (public.is_mfa_session_verified());
CREATE POLICY "MFA verified access to notifications"
ON public.notifications AS RESTRICTIVE FOR ALL TO authenticated
USING (public.is_mfa_session_verified())
WITH CHECK (public.is_mfa_session_verified());
CREATE POLICY "MFA verified access to payments"
ON public.payments AS RESTRICTIVE FOR ALL TO authenticated
USING (public.is_mfa_session_verified())
WITH CHECK (public.is_mfa_session_verified());
CREATE POLICY "MFA verified access to profiles"
ON public.profiles AS RESTRICTIVE FOR ALL TO authenticated
USING (public.is_mfa_session_verified())
WITH CHECK (public.is_mfa_session_verified());
CREATE POLICY "MFA verified access to site visits"
ON public.site_visits AS RESTRICTIVE FOR ALL TO authenticated
USING (public.is_mfa_session_verified())
WITH CHECK (public.is_mfa_session_verified());
CREATE POLICY "MFA verified access to inspections"
ON public.vehicle_inspections AS RESTRICTIVE FOR ALL TO authenticated
USING (public.is_mfa_session_verified())
WITH CHECK (public.is_mfa_session_verified());
CREATE POLICY "MFA verified access to vehicles"
ON public.vehicles AS RESTRICTIVE FOR ALL TO authenticated
USING (public.is_mfa_session_verified())
WITH CHECK (public.is_mfa_session_verified());

CREATE OR REPLACE FUNCTION public.get_public_vehicle(_vehicle_id uuid)
RETURNS TABLE (
  id uuid, brand text, model text, year integer, color text, fuel_type text, status text,
  weekly_price numeric, km_limit integer, excess_km_fee numeric, deposit numeric,
  allowed_apps text[], description text, images text[], city text, state text,
  current_km integer, created_at timestamptz, whatsapp_locador text, locador_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    v.id, v.brand, v.model, v.year, v.color, v.fuel_type, v.status,
    v.weekly_price, v.km_limit, v.excess_km_fee, v.deposit,
    v.allowed_apps, v.description, v.images, v.city, v.state,
    v.current_km, v.created_at,
    p.whatsapp AS whatsapp_locador,
    CASE WHEN auth.uid() IS NOT NULL THEN v.locador_id ELSE NULL END AS locador_id
  FROM public.vehicles v
  LEFT JOIN public.profiles p ON p.user_id = v.locador_id
  WHERE v.id = _vehicle_id
    AND v.status = 'available'
$$;

REVOKE ALL ON FUNCTION public.get_public_vehicle(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_vehicle(uuid) TO anon, authenticated, service_role;
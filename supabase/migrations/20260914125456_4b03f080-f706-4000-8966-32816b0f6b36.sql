CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.is_mfa_session_verified()
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

REVOKE ALL ON FUNCTION private.is_mfa_session_verified() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_mfa_session_verified() TO authenticated, service_role;

ALTER POLICY "MFA verified access to audit logs" ON public.audit_logs USING (private.is_mfa_session_verified()) WITH CHECK (private.is_mfa_session_verified());
ALTER POLICY "MFA verified access to CNH alerts" ON public.cnh_alerts USING (private.is_mfa_session_verified()) WITH CHECK (private.is_mfa_session_verified());
ALTER POLICY "MFA verified access to consents" ON public.consents USING (private.is_mfa_session_verified()) WITH CHECK (private.is_mfa_session_verified());
ALTER POLICY "MFA verified access to contracts" ON public.contracts USING (private.is_mfa_session_verified()) WITH CHECK (private.is_mfa_session_verified());
ALTER POLICY "MFA verified access to conversations" ON public.conversations USING (private.is_mfa_session_verified()) WITH CHECK (private.is_mfa_session_verified());
ALTER POLICY "MFA verified access to document requests" ON public.document_requests USING (private.is_mfa_session_verified()) WITH CHECK (private.is_mfa_session_verified());
ALTER POLICY "MFA verified access to documents" ON public.documents USING (private.is_mfa_session_verified()) WITH CHECK (private.is_mfa_session_verified());
ALTER POLICY "MFA verified access to drivers" ON public.drivers USING (private.is_mfa_session_verified()) WITH CHECK (private.is_mfa_session_verified());
ALTER POLICY "MFA verified access to checklist templates" ON public.inspection_checklist_templates USING (private.is_mfa_session_verified()) WITH CHECK (private.is_mfa_session_verified());
ALTER POLICY "MFA verified access to login attempts" ON public.login_attempts USING (private.is_mfa_session_verified()) WITH CHECK (private.is_mfa_session_verified());
ALTER POLICY "MFA verified access to maintenances" ON public.maintenances USING (private.is_mfa_session_verified()) WITH CHECK (private.is_mfa_session_verified());
ALTER POLICY "MFA verified access to messages" ON public.messages USING (private.is_mfa_session_verified()) WITH CHECK (private.is_mfa_session_verified());
ALTER POLICY "MFA verified access to mileage records" ON public.mileage_records USING (private.is_mfa_session_verified()) WITH CHECK (private.is_mfa_session_verified());
ALTER POLICY "MFA verified access to notifications" ON public.notifications USING (private.is_mfa_session_verified()) WITH CHECK (private.is_mfa_session_verified());
ALTER POLICY "MFA verified access to payments" ON public.payments USING (private.is_mfa_session_verified()) WITH CHECK (private.is_mfa_session_verified());
ALTER POLICY "MFA verified access to profiles" ON public.profiles USING (private.is_mfa_session_verified()) WITH CHECK (private.is_mfa_session_verified());
ALTER POLICY "MFA verified access to site visits" ON public.site_visits USING (private.is_mfa_session_verified()) WITH CHECK (private.is_mfa_session_verified());
ALTER POLICY "MFA verified access to user roles" ON public.user_roles USING (private.is_mfa_session_verified()) WITH CHECK (private.is_mfa_session_verified());
ALTER POLICY "MFA verified access to inspections" ON public.vehicle_inspections USING (private.is_mfa_session_verified()) WITH CHECK (private.is_mfa_session_verified());
ALTER POLICY "MFA verified access to vehicles" ON public.vehicles USING (private.is_mfa_session_verified()) WITH CHECK (private.is_mfa_session_verified());
ALTER POLICY "MFA verified access to private storage" ON storage.objects USING (bucket_id NOT IN ('documents', 'inspection-photos', 'vehicle-images') OR private.is_mfa_session_verified()) WITH CHECK (bucket_id NOT IN ('documents', 'inspection-photos', 'vehicle-images') OR private.is_mfa_session_verified());

DROP FUNCTION public.is_mfa_session_verified();
DROP FUNCTION public.set_own_mfa_enabled(boolean);
-- Lock down SECURITY DEFINER functions: revoke broad EXECUTE and grant only where needed.

-- Internal trigger functions: should never be called directly via API
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_profiles_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_vehicle_current_km() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_locador_on_driver_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.audit_trigger_func() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_profile_documents() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_driver_cnh() FROM PUBLIC, anon, authenticated;

-- Validation helpers: pure, but no need to expose via API
REVOKE ALL ON FUNCTION public.validate_cpf(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_cnpj(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_cnh(text) FROM PUBLIC, anon, authenticated;

-- Admin-only / service-role-only functions
REVOKE ALL ON FUNCTION public.get_user_emails_for_admin() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.insert_cnh_alert(uuid, text, date) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cleanup_old_login_attempts() FROM PUBLIC, anon, authenticated;

-- has_role / get_user_role: used inside RLS policies. RLS evaluates them with the
-- caller's privileges, but they're SECURITY DEFINER, so granting EXECUTE to
-- authenticated is required for policy evaluation. Keep authenticated, revoke anon.
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

REVOKE ALL ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;

-- Public marketplace functions: intentionally callable by anon and authenticated
REVOKE ALL ON FUNCTION public.get_public_vehicles() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_vehicles() TO anon, authenticated;

REVOKE ALL ON FUNCTION public.get_public_vehicle(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_vehicle(uuid) TO anon, authenticated;
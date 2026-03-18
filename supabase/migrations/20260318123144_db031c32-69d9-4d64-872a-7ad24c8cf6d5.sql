
-- 1) Revoke EXECUTE on has_role from PUBLIC and anon, grant only to authenticated
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

-- Also protect get_user_role
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;

-- 2) Explicit deny policies on login_attempts
CREATE POLICY "Deny anon access to login_attempts"
ON public.login_attempts FOR SELECT TO anon USING (false);

CREATE POLICY "Deny authenticated access to login_attempts"
ON public.login_attempts FOR SELECT TO authenticated USING (false);

-- 3) Deny anon access to vehicles
CREATE POLICY "Deny anon access to vehicles"
ON public.vehicles FOR SELECT TO anon USING (false);

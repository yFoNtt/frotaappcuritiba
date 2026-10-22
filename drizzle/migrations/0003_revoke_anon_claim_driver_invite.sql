REVOKE EXECUTE ON FUNCTION public.claim_driver_invite(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_driver_invite(uuid) TO authenticated, service_role;
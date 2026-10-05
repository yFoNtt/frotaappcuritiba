CREATE OR REPLACE FUNCTION private.is_locador_internal(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'locador'::public.app_role
  )
$$;

REVOKE ALL ON FUNCTION private.is_locador_internal(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_locador_internal(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_locador(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, private
AS $$
  SELECT private.is_locador_internal(_user_id)
$$;

REVOKE ALL ON FUNCTION public.is_locador(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_locador(uuid) TO authenticated, service_role;
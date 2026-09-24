CREATE OR REPLACE FUNCTION private.get_my_role_internal()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = auth.uid()
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION private.get_my_role_internal() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.get_my_role_internal() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, private
AS $$
  SELECT private.get_my_role_internal()
$$;

REVOKE ALL ON FUNCTION public.get_my_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.initialize_own_account_internal(_role public.app_role DEFAULT NULL)
RETURNS public.app_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _metadata_role text;
  _requested_role public.app_role;
  _existing_role public.app_role;
  _full_name text;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT raw_user_meta_data ->> 'role', NULLIF(BTRIM(raw_user_meta_data ->> 'full_name'), '')
  INTO _metadata_role, _full_name
  FROM auth.users
  WHERE id = _user_id;

  IF _role = 'admin'::public.app_role THEN
    RAISE EXCEPTION 'admin_self_assignment_forbidden' USING ERRCODE = '42501';
  END IF;

  IF _role IN ('locador'::public.app_role, 'motorista'::public.app_role) THEN
    _requested_role := _role;
  ELSIF _metadata_role IN ('locador', 'motorista') THEN
    _requested_role := _metadata_role::public.app_role;
  ELSE
    _requested_role := NULL;
  END IF;

  INSERT INTO public.profiles (user_id, full_name)
  VALUES (_user_id, _full_name)
  ON CONFLICT (user_id) DO UPDATE
    SET full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name);

  SELECT role INTO _existing_role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1;

  IF _existing_role IS NOT NULL THEN
    IF _requested_role IS NOT NULL AND _existing_role <> _requested_role THEN
      RAISE EXCEPTION 'account_role_already_defined' USING ERRCODE = '22023';
    END IF;
    RETURN _existing_role;
  END IF;

  IF _requested_role IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, _requested_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN _requested_role;
END;
$$;

REVOKE ALL ON FUNCTION private.initialize_own_account_internal(public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.initialize_own_account_internal(public.app_role) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.initialize_own_account(_role public.app_role DEFAULT NULL)
RETURNS public.app_role
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, private
AS $$
  SELECT private.initialize_own_account_internal(_role)
$$;

REVOKE ALL ON FUNCTION public.initialize_own_account(public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.initialize_own_account(public.app_role) TO authenticated, service_role;
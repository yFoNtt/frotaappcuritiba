CREATE OR REPLACE FUNCTION private.admin_change_user_role_internal(
  _user_id UUID,
  _new_role public.app_role,
  _reason TEXT,
  _confirm_admin_promotion BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _caller UUID := auth.uid();
  _old_role public.app_role;
  _admin_count INTEGER;
BEGIN
  IF _caller IS NULL THEN RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501'; END IF;
  IF NOT public.has_role(_caller, 'admin'::public.app_role) THEN RAISE EXCEPTION 'forbidden_admin_only' USING ERRCODE = '42501'; END IF;
  IF NULLIF(BTRIM(_reason), '') IS NULL THEN RAISE EXCEPTION 'reason_required' USING ERRCODE = '22023'; END IF;
  IF _user_id = _caller THEN RAISE EXCEPTION 'cannot_change_own_role' USING ERRCODE = '22023'; END IF;

  SELECT role INTO _old_role FROM public.user_roles WHERE user_id = _user_id LIMIT 1;
  IF _old_role IS NULL THEN RAISE EXCEPTION 'user_role_not_found' USING ERRCODE = 'P0002'; END IF;
  IF _old_role = _new_role THEN RETURN jsonb_build_object('user_id', _user_id, 'role', _new_role); END IF;
  IF _new_role = 'admin'::public.app_role AND NOT _confirm_admin_promotion THEN
    RAISE EXCEPTION 'admin_promotion_confirmation_required' USING ERRCODE = '22023';
  END IF;
  IF _old_role = 'admin'::public.app_role THEN
    SELECT COUNT(*) INTO _admin_count FROM public.user_roles WHERE role = 'admin'::public.app_role;
    IF _admin_count <= 1 THEN RAISE EXCEPTION 'cannot_remove_last_admin' USING ERRCODE = '22023'; END IF;
  END IF;

  UPDATE public.user_roles SET role = _new_role WHERE user_id = _user_id;
  INSERT INTO public.audit_logs (table_name, record_id, action, changed_by, old_data, new_data, changed_fields)
  VALUES ('auth.users', _user_id, 'ADMIN_ROLE_CHANGE', _caller,
    jsonb_build_object('role', _old_role),
    jsonb_build_object('role', _new_role, 'reason', BTRIM(_reason)),
    ARRAY['role']::TEXT[]);
  RETURN jsonb_build_object('user_id', _user_id, 'role', _new_role);
END;
$$;

CREATE OR REPLACE FUNCTION private.admin_delete_user_internal(_user_id UUID, _reason TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _caller UUID := auth.uid();
BEGIN
  IF _caller IS NULL THEN RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501'; END IF;
  IF NOT public.has_role(_caller, 'admin'::public.app_role) THEN RAISE EXCEPTION 'forbidden_admin_only' USING ERRCODE = '42501'; END IF;
  IF NULLIF(BTRIM(_reason), '') IS NULL THEN RAISE EXCEPTION 'reason_required' USING ERRCODE = '22023'; END IF;
  IF _user_id = _caller THEN RAISE EXCEPTION 'cannot_delete_self' USING ERRCODE = '22023'; END IF;
  IF public.has_role(_user_id, 'admin'::public.app_role) THEN RAISE EXCEPTION 'cannot_delete_admin' USING ERRCODE = '22023'; END IF;
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = _user_id) THEN RAISE EXCEPTION 'user_not_found' USING ERRCODE = 'P0002'; END IF;

  UPDATE public.audit_logs SET changed_by = '00000000-0000-0000-0000-000000000000'::uuid WHERE changed_by = _user_id;
  UPDATE public.messages SET content = '[mensagem removida — conta excluída]', attachment_url = NULL,
    attachment_path = NULL, attachment_name = NULL, attachment_mime = NULL, attachment_size = NULL
    WHERE sender_id = _user_id;
  DELETE FROM public.conversations WHERE interested_user_id = _user_id AND driver_id IS NULL;
  DELETE FROM public.user_roles WHERE user_id = _user_id;
  DELETE FROM public.cnh_alerts WHERE user_id = _user_id;
  DELETE FROM public.notifications WHERE user_id = _user_id;
  DELETE FROM public.consents WHERE user_id = _user_id;
  DELETE FROM public.profiles WHERE user_id = _user_id;
  DELETE FROM auth.users WHERE id = _user_id;
  INSERT INTO public.audit_logs (table_name, record_id, action, changed_by, new_data)
  VALUES ('auth.users', _user_id, 'ADMIN_DELETE', _caller,
    jsonb_build_object('target_user_id', _user_id, 'reason', BTRIM(_reason)));
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_change_user_role(
  _user_id UUID,
  _new_role public.app_role,
  _reason TEXT,
  _confirm_admin_promotion BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE sql
SECURITY INVOKER
SET search_path TO 'public', 'private'
AS $$ SELECT private.admin_change_user_role_internal(_user_id, _new_role, _reason, _confirm_admin_promotion); $$;

CREATE OR REPLACE FUNCTION public.admin_delete_user(_user_id UUID, _reason TEXT)
RETURNS void
LANGUAGE sql
SECURITY INVOKER
SET search_path TO 'public', 'private'
AS $$ SELECT private.admin_delete_user_internal(_user_id, _reason); $$;

REVOKE ALL ON FUNCTION private.admin_change_user_role_internal(UUID, public.app_role, TEXT, BOOLEAN) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.admin_delete_user_internal(UUID, TEXT) FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.admin_change_user_role_internal(UUID, public.app_role, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION private.admin_delete_user_internal(UUID, TEXT) TO authenticated;
REVOKE ALL ON FUNCTION public.admin_change_user_role(UUID, public.app_role, TEXT, BOOLEAN) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_delete_user(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_change_user_role(UUID, public.app_role, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(UUID, TEXT) TO authenticated;
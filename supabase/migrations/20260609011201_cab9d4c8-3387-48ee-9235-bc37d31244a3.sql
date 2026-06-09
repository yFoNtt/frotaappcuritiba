CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  -- Anonimizar audit_logs
  UPDATE public.audit_logs
  SET changed_by = '00000000-0000-0000-0000-000000000000'::uuid
  WHERE changed_by = v_user_id;

  -- Remover consentimentos
  DELETE FROM public.consents WHERE user_id = v_user_id;

  -- Remover perfil
  DELETE FROM public.profiles WHERE user_id = v_user_id;

  -- Tombar conta no auth
  UPDATE auth.users
  SET email = 'deleted_' || v_user_id::text || '@excluido.frotaapp',
      raw_user_meta_data = '{"deleted": true}'::jsonb,
      updated_at = now()
  WHERE id = v_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_own_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;
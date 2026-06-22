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

  -- 1) Anonimizar trilha de auditoria
  UPDATE public.audit_logs
  SET changed_by = '00000000-0000-0000-0000-000000000000'::uuid
  WHERE changed_by = v_user_id;

  -- 2) Redigir conteúdo de mensagens enviadas pelo usuário
  UPDATE public.messages
  SET content = '[mensagem removida — conta excluída]',
      attachment_url = NULL,
      attachment_path = NULL,
      attachment_name = NULL,
      attachment_mime = NULL,
      attachment_size = NULL
  WHERE sender_id = v_user_id;

  -- 3) Remover conversas-lead (marketplace) iniciadas por este usuário
  DELETE FROM public.conversations
  WHERE interested_user_id = v_user_id AND driver_id IS NULL;

  -- 4) Limpar vínculos pessoais
  DELETE FROM public.user_roles WHERE user_id = v_user_id;
  DELETE FROM public.cnh_alerts WHERE user_id = v_user_id;
  DELETE FROM public.notifications WHERE user_id = v_user_id;
  DELETE FROM public.consents WHERE user_id = v_user_id;
  DELETE FROM public.profiles WHERE user_id = v_user_id;

  -- 5) Excluir de fato o usuário em auth.users (dispara FKs ON DELETE CASCADE)
  DELETE FROM auth.users WHERE id = v_user_id;
END;
$$;
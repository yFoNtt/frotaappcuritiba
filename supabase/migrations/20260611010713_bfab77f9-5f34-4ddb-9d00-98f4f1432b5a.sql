
-- 1) Secure SECURITY DEFINER RPC for initial role assignment
CREATE OR REPLACE FUNCTION public.assign_initial_role(_role public.app_role)
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

  IF _role = 'admin'::public.app_role THEN
    RAISE EXCEPTION 'Não é permitido auto-atribuir o papel admin';
  END IF;

  IF _role NOT IN ('locador'::public.app_role, 'motorista'::public.app_role) THEN
    RAISE EXCEPTION 'Papel inválido';
  END IF;

  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = v_user_id) THEN
    RAISE EXCEPTION 'Usuário já possui um papel definido';
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, _role);
END;
$$;

REVOKE ALL ON FUNCTION public.assign_initial_role(public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_initial_role(public.app_role) TO authenticated;

-- 2) Remove permissive self-insert policy on user_roles
DROP POLICY IF EXISTS "Authenticated users can set initial role once" ON public.user_roles;

-- 3) Allow conversation participants to delete their own chat-attachment files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Participants can delete their own chat attachments'
  ) THEN
    CREATE POLICY "Participants can delete their own chat attachments"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'chat-attachments'
      AND owner = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id::text = (storage.foldername(name))[1]
          AND (c.locador_id = auth.uid() OR c.driver_id = auth.uid())
      )
    );
  END IF;
END $$;

-- 4) Remove dead/misleading deny policy on inspection_checklist_templates
DROP POLICY IF EXISTS "Deny public access to inspection_checklist_templates" ON public.inspection_checklist_templates;

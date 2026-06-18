-- 1. CONVERSATIONS: column-level UPDATE
REVOKE UPDATE ON public.conversations FROM authenticated;
GRANT UPDATE (unread_locador, unread_motorista, last_message_preview, last_message_at, updated_at)
  ON public.conversations TO authenticated;

-- 2. MESSAGES: column-level UPDATE (only read_at)
REVOKE UPDATE ON public.messages FROM authenticated;
GRANT UPDATE (read_at) ON public.messages TO authenticated;

-- 3. STORAGE chat-attachments DELETE: fix driver join via drivers table
DROP POLICY IF EXISTS "Participants can delete their own chat attachments" ON storage.objects;

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
      AND (
        c.locador_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.drivers d
          WHERE d.id = c.driver_id AND d.user_id = auth.uid()
        )
      )
  )
);

-- 4. CONSENTS: scope policies explicitly to authenticated role
DROP POLICY IF EXISTS "Usuário insere próprio consentimento" ON public.consents;
DROP POLICY IF EXISTS "Usuário lê próprios consentimentos" ON public.consents;

CREATE POLICY "Usuário insere próprio consentimento"
  ON public.consents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuário lê próprios consentimentos"
  ON public.consents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
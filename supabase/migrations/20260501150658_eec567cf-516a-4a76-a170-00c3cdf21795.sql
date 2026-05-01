
-- ============ CONVERSATIONS ============
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  locador_id UUID NOT NULL,
  driver_id UUID NOT NULL,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_preview TEXT,
  unread_locador INTEGER NOT NULL DEFAULT 0,
  unread_motorista INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (locador_id, driver_id)
);

CREATE INDEX idx_conversations_locador ON public.conversations(locador_id, last_message_at DESC);
CREATE INDEX idx_conversations_driver ON public.conversations(driver_id, last_message_at DESC);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny anon access to conversations"
  ON public.conversations FOR SELECT TO anon USING (false);

CREATE POLICY "Locador can view their conversations"
  ON public.conversations FOR SELECT TO authenticated
  USING (locador_id = auth.uid());

CREATE POLICY "Driver can view their conversations"
  ON public.conversations FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.drivers d
    WHERE d.id = conversations.driver_id AND d.user_id = auth.uid()
  ));

CREATE POLICY "Locador can create conversations with their drivers"
  ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (
    locador_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.drivers d
      WHERE d.id = driver_id AND d.locador_id = auth.uid()
    )
  );

CREATE POLICY "Driver can create conversations with their locador"
  ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.drivers d
      WHERE d.id = driver_id AND d.user_id = auth.uid() AND d.locador_id = conversations.locador_id
    )
  );

CREATE POLICY "Participants can update conversation read counters"
  ON public.conversations FOR UPDATE TO authenticated
  USING (
    locador_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.drivers d WHERE d.id = driver_id AND d.user_id = auth.uid())
  )
  WITH CHECK (
    locador_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.drivers d WHERE d.id = driver_id AND d.user_id = auth.uid())
  );

CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ MESSAGES ============
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('locador','motorista')),
  content TEXT,
  attachment_url TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_conv ON public.messages(conversation_id, created_at DESC);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny anon access to messages"
  ON public.messages FOR SELECT TO anon USING (false);

CREATE POLICY "Participants can read messages"
  ON public.messages FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND (
        c.locador_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.drivers d WHERE d.id = c.driver_id AND d.user_id = auth.uid())
      )
  ));

CREATE POLICY "Participants can send messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (
          (sender_role = 'locador' AND c.locador_id = auth.uid())
          OR (sender_role = 'motorista' AND EXISTS (
            SELECT 1 FROM public.drivers d WHERE d.id = c.driver_id AND d.user_id = auth.uid()
          ))
        )
    )
  );

CREATE POLICY "Participants can mark messages as read"
  ON public.messages FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND (
        c.locador_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.drivers d WHERE d.id = c.driver_id AND d.user_id = auth.uid())
      )
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND (
        c.locador_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.drivers d WHERE d.id = c.driver_id AND d.user_id = auth.uid())
      )
  ));

-- ============ TRIGGER: update conversation on new message ============
CREATE OR REPLACE FUNCTION public.update_conversation_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations
  SET
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(COALESCE(NEW.content, '📎 Anexo'), 120),
    unread_locador = CASE WHEN NEW.sender_role = 'motorista' THEN unread_locador + 1 ELSE unread_locador END,
    unread_motorista = CASE WHEN NEW.sender_role = 'locador' THEN unread_motorista + 1 ELSE unread_motorista END,
    updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_conversation_on_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_conversation_on_message();

-- ============ REALTIME ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;

-- ============ STORAGE BUCKET ============
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Bucket policies: only conversation participants can read/write their own files
-- Path convention: {conversation_id}/{file}
CREATE POLICY "Participants can read chat attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'chat-attachments'
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id::text = (storage.foldername(name))[1]
        AND (
          c.locador_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.drivers d WHERE d.id = c.driver_id AND d.user_id = auth.uid())
        )
    )
  );

CREATE POLICY "Participants can upload chat attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'chat-attachments'
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id::text = (storage.foldername(name))[1]
        AND (
          c.locador_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.drivers d WHERE d.id = c.driver_id AND d.user_id = auth.uid())
        )
    )
  );

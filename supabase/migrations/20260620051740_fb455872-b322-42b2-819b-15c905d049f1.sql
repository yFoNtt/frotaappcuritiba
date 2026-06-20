-- 1) conversations: driver_id opcional + lead fields
ALTER TABLE public.conversations
  ALTER COLUMN driver_id DROP NOT NULL;

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS interested_user_id uuid,
  ADD COLUMN IF NOT EXISTS vehicle_id uuid;

ALTER TABLE public.conversations
  DROP CONSTRAINT IF EXISTS conversations_participant_check;

ALTER TABLE public.conversations
  ADD CONSTRAINT conversations_participant_check
  CHECK (driver_id IS NOT NULL OR interested_user_id IS NOT NULL);

DROP INDEX IF EXISTS conversations_locador_interested_uniq;
CREATE UNIQUE INDEX conversations_locador_interested_uniq
  ON public.conversations (locador_id, interested_user_id)
  WHERE interested_user_id IS NOT NULL;

-- 2) RLS conversations
DROP POLICY IF EXISTS "Interessados podem ver suas conversas-lead" ON public.conversations;
CREATE POLICY "Interessados podem ver suas conversas-lead"
  ON public.conversations FOR SELECT TO authenticated
  USING (interested_user_id = auth.uid());

DROP POLICY IF EXISTS "Motoristas podem iniciar conversa como interessados" ON public.conversations;
CREATE POLICY "Motoristas podem iniciar conversa como interessados"
  ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (
    interested_user_id = auth.uid()
    AND driver_id IS NULL
    AND locador_id <> auth.uid()
    AND public.has_role(auth.uid(), 'motorista'::public.app_role)
    AND (
      vehicle_id IS NULL
      OR EXISTS (SELECT 1 FROM public.vehicles v WHERE v.id = vehicle_id AND v.locador_id = conversations.locador_id)
    )
  );

DROP POLICY IF EXISTS "Participants can update conversation read counters" ON public.conversations;
CREATE POLICY "Participants can update conversation read counters"
  ON public.conversations FOR UPDATE TO authenticated
  USING (
    locador_id = auth.uid()
    OR interested_user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.drivers d WHERE d.id = driver_id AND d.user_id = auth.uid())
  )
  WITH CHECK (
    locador_id = auth.uid()
    OR interested_user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.drivers d WHERE d.id = driver_id AND d.user_id = auth.uid())
  );

-- 3) RLS messages
DROP POLICY IF EXISTS "Participants can read messages" ON public.messages;
CREATE POLICY "Participants can read messages"
  ON public.messages FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND (
        c.locador_id = auth.uid()
        OR c.interested_user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.drivers d WHERE d.id = c.driver_id AND d.user_id = auth.uid())
      )
  ));

DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;
CREATE POLICY "Participants can send messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (
          (sender_role = 'locador' AND c.locador_id = auth.uid())
          OR (sender_role = 'motorista' AND (
            c.interested_user_id = auth.uid()
            OR EXISTS (SELECT 1 FROM public.drivers d WHERE d.id = c.driver_id AND d.user_id = auth.uid())
          ))
        )
    )
  );

DROP POLICY IF EXISTS "Participants can mark messages as read" ON public.messages;
CREATE POLICY "Participants can mark messages as read"
  ON public.messages FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND (
        c.locador_id = auth.uid()
        OR c.interested_user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.drivers d WHERE d.id = c.driver_id AND d.user_id = auth.uid())
      )
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND (
        c.locador_id = auth.uid()
        OR c.interested_user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.drivers d WHERE d.id = c.driver_id AND d.user_id = auth.uid())
      )
  ));

-- 4) storage.objects (chat-attachments)
DROP POLICY IF EXISTS "Participants can read chat attachments" ON storage.objects;
CREATE POLICY "Participants can read chat attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'chat-attachments'
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id::text = (storage.foldername(name))[1]
        AND (
          c.locador_id = auth.uid()
          OR c.interested_user_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.drivers d WHERE d.id = c.driver_id AND d.user_id = auth.uid())
        )
    )
  );

DROP POLICY IF EXISTS "Participants can upload chat attachments" ON storage.objects;
CREATE POLICY "Participants can upload chat attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'chat-attachments'
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id::text = (storage.foldername(name))[1]
        AND (
          c.locador_id = auth.uid()
          OR c.interested_user_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.drivers d WHERE d.id = c.driver_id AND d.user_id = auth.uid())
        )
    )
  );

DROP POLICY IF EXISTS "Participants can delete their own chat attachments" ON storage.objects;
CREATE POLICY "Participants can delete their own chat attachments"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'chat-attachments'
    AND owner = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id::text = (storage.foldername(name))[1]
        AND (
          c.locador_id = auth.uid()
          OR c.interested_user_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.drivers d WHERE d.id = c.driver_id AND d.user_id = auth.uid())
        )
    )
  );

-- 5) get_public_vehicle expõe locador_id só para autenticados
DROP FUNCTION IF EXISTS public.get_public_vehicle(uuid);

CREATE OR REPLACE FUNCTION public.get_public_vehicle(_vehicle_id uuid)
RETURNS TABLE (
  id uuid, brand text, model text, year integer, color text, fuel_type text, status text,
  weekly_price numeric, km_limit integer, excess_km_fee numeric, deposit numeric,
  allowed_apps text[], description text, images text[], city text, state text,
  current_km integer, created_at timestamptz, whatsapp_locador text, locador_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    v.id, v.brand, v.model, v.year, v.color, v.fuel_type, v.status,
    v.weekly_price, v.km_limit, v.excess_km_fee, v.deposit,
    v.allowed_apps, v.description, v.images, v.city, v.state,
    v.current_km, v.created_at,
    p.whatsapp AS whatsapp_locador,
    CASE WHEN auth.uid() IS NOT NULL THEN v.locador_id ELSE NULL END AS locador_id
  FROM public.vehicles v
  LEFT JOIN public.profiles p ON p.user_id = v.locador_id
  WHERE v.id = _vehicle_id;
$$;

REVOKE ALL ON FUNCTION public.get_public_vehicle(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_vehicle(uuid) TO anon, authenticated, service_role;
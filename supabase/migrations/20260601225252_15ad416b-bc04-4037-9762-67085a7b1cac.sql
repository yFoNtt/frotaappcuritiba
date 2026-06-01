
-- 1. Tighten audit_logs SELECT: require locador or admin role
DROP POLICY IF EXISTS "Locadores can view their audit logs" ON public.audit_logs;
CREATE POLICY "Locadores can view their audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'locador'::app_role)
  AND table_name <> ALL (ARRAY['profiles'::text, 'notifications'::text, 'cnh_alerts'::text])
  AND (
    changed_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.drivers
      WHERE drivers.user_id = audit_logs.changed_by
        AND drivers.locador_id = auth.uid()
    )
  )
);

-- 2. Explicit deny for login_attempts mutations (defense in depth)
REVOKE INSERT, UPDATE, DELETE ON public.login_attempts FROM anon, authenticated;

CREATE POLICY "Deny insert on login_attempts"
ON public.login_attempts FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "Deny update on login_attempts"
ON public.login_attempts FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "Deny delete on login_attempts"
ON public.login_attempts FOR DELETE TO anon, authenticated USING (false);

-- 3. Realtime channel topic policy: restrict conversation channels to participants
CREATE POLICY "Conversation participants can read their channel"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() LIKE 'conversations:%'
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id::text = split_part(realtime.topic(), ':', 2)
      AND (
        c.locador_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.drivers d
          WHERE d.id = c.driver_id AND d.user_id = auth.uid()
        )
      )
  )
);

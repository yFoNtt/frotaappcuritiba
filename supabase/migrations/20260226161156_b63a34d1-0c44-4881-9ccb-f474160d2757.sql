
-- Drop the existing locador policy
DROP POLICY IF EXISTS "Locadores can view their audit logs" ON public.audit_logs;

-- Create expanded policy: locadores see their own logs + logs from their drivers
CREATE POLICY "Locadores can view their audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
  changed_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.drivers
    WHERE drivers.user_id = audit_logs.changed_by
      AND drivers.locador_id = auth.uid()
  )
);

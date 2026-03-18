
-- Drop the existing locadores audit_logs policy
DROP POLICY IF EXISTS "Locadores can view their audit logs" ON public.audit_logs;

-- Recreate with exclusion of 'profiles' table to prevent sensitive data leakage
CREATE POLICY "Locadores can view their audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
  table_name != 'profiles'
  AND (
    changed_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM drivers
      WHERE drivers.user_id = audit_logs.changed_by
        AND drivers.locador_id = auth.uid()
    )
  )
);

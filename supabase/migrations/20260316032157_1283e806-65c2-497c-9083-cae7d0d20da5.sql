
-- FIX 1: Restrict self-assignment to only users without an existing role
DROP POLICY IF EXISTS "Users can insert their own role during signup" ON public.user_roles;

CREATE POLICY "Users can insert their own role during signup"
  ON public.user_roles
  FOR INSERT
  TO public
  WITH CHECK (
    auth.uid() = user_id
    AND role IN ('locador'::app_role, 'motorista'::app_role)
    AND NOT EXISTS (
      SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid()
    )
  );

-- FIX 2: Remove the broad authenticated policy for available vehicles
-- Authenticated users already have role-specific policies (locador sees own, admin sees all)
-- Public browsing is handled by the RPC function get_public_vehicles
DROP POLICY IF EXISTS "Authenticated can view available vehicles" ON public.vehicles;

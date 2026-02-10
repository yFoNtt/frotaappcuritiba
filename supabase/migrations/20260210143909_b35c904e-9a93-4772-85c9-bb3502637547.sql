
-- Drop the existing permissive self-signup policy
DROP POLICY IF EXISTS "Users can insert their own role during signup" ON public.user_roles;

-- Create a restricted policy that only allows locador and motorista roles
CREATE POLICY "Users can insert their own role during signup"
ON public.user_roles
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND role IN ('locador'::app_role, 'motorista'::app_role)
);

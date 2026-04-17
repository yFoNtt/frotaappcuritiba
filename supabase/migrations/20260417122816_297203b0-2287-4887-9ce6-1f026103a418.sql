
-- Remove anon insert policy: it allowed setting a role for any user_id since
-- anon sessions have no auth.uid(). The "Authenticated users can set initial
-- role once" policy already covers signup safely (signup leaves the user
-- authenticated, then they insert their own role).
DROP POLICY IF EXISTS "Anon users can insert role during signup" ON public.user_roles;

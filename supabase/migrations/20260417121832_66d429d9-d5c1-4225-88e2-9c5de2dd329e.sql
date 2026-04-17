
-- =======================================================================
-- FIX 1: PRIVILEGE_ESCALATION
-- Restrict self-insert role policy to anonymous users only (signup flow).
-- Authenticated users must not be able to (re)assign themselves a role.
-- =======================================================================
DROP POLICY IF EXISTS "Users can insert their own role during signup" ON public.user_roles;

CREATE POLICY "Anon users can insert role during signup"
ON public.user_roles
FOR INSERT
TO anon
WITH CHECK (
  role = ANY (ARRAY['locador'::app_role, 'motorista'::app_role])
);

-- Allow a brand-new authenticated user (just signed up, no role yet) to set
-- their initial role exactly once. This still blocks role escalation because
-- the NOT EXISTS sub-query prevents replacing or adding roles later.
CREATE POLICY "Authenticated users can set initial role once"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND role = ANY (ARRAY['locador'::app_role, 'motorista'::app_role])
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid()
  )
);

-- =======================================================================
-- FIX 2: INSECURE_STORAGE_ACCESS on documents bucket (requests/ folder)
-- The current policy lets ANY motorista read ANY file under requests/.
-- File path layout: requests/{driver_id}/{type}/{filename}
-- Restrict SELECT so the driver_id segment must match a driver row owned
-- by the current authenticated user.
-- =======================================================================
DROP POLICY IF EXISTS "Motoristas can view their request files" ON storage.objects;

CREATE POLICY "Motoristas can view their own request files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'requests'
  AND EXISTS (
    SELECT 1
    FROM public.drivers d
    WHERE d.user_id = auth.uid()
      AND d.id::text = (storage.foldername(name))[2]
  )
);

-- Also tighten the INSERT policy so a motorista can only upload into their
-- own driver_id folder (not any folder under requests/).
DROP POLICY IF EXISTS "Motoristas can upload document requests" ON storage.objects;

CREATE POLICY "Motoristas can upload their own request files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'requests'
  AND EXISTS (
    SELECT 1
    FROM public.drivers d
    WHERE d.user_id = auth.uid()
      AND d.id::text = (storage.foldername(name))[2]
  )
);

-- =======================================================================
-- FIX 3: SUPA_public_bucket_allows_listing (vehicle-images)
-- Replace the broad "bucket_id = 'vehicle-images'" SELECT policy (which
-- allows listing the whole bucket) with object-level read access. Files are
-- still publicly accessible by URL (the bucket remains public), but anon
-- clients can no longer enumerate the bucket contents via list().
-- =======================================================================
DROP POLICY IF EXISTS "Anyone can view vehicle images" ON storage.objects;

-- Authenticated locadores keep full access to their own folder for management.
CREATE POLICY "Locadores can list their vehicle images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'vehicle-images'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

-- Public files remain reachable via direct URL (bucket is public). No SELECT
-- policy is granted to anon, which prevents bucket listing/enumeration.

-- =======================================================================
-- FIX 4: MISSING_REALTIME_AUTHORIZATION on notifications channel
-- Add RLS on realtime.messages to restrict subscriptions/broadcasts to
-- channels named "notifications:{auth.uid()}". The application code will
-- be updated to subscribe to that per-user topic.
-- =======================================================================
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own notification channel" ON realtime.messages;
DROP POLICY IF EXISTS "Users can subscribe to their own notification channel" ON realtime.messages;

CREATE POLICY "Users can read their own notification channel"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() = 'notifications:' || (auth.uid())::text
);

CREATE POLICY "Users can write to their own notification channel"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  realtime.topic() = 'notifications:' || (auth.uid())::text
);

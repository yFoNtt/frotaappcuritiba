
-- Fix STORAGE_POLICY_BUG: inside the EXISTS subquery, the unqualified `name`
-- was resolved to drivers.name instead of storage.objects.name. Qualify the
-- outer reference explicitly using `storage.objects.name`.

DROP POLICY IF EXISTS "Motoristas can view their own request files" ON storage.objects;
DROP POLICY IF EXISTS "Motoristas can upload their own request files" ON storage.objects;

CREATE POLICY "Motoristas can view their own request files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(storage.objects.name))[1] = 'requests'
  AND EXISTS (
    SELECT 1
    FROM public.drivers d
    WHERE d.user_id = auth.uid()
      AND d.id::text = (storage.foldername(storage.objects.name))[2]
  )
);

CREATE POLICY "Motoristas can upload their own request files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND (storage.foldername(storage.objects.name))[1] = 'requests'
  AND EXISTS (
    SELECT 1
    FROM public.drivers d
    WHERE d.user_id = auth.uid()
      AND d.id::text = (storage.foldername(storage.objects.name))[2]
  )
);

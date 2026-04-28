-- Add UPDATE policy on documents bucket scoped to locador's own folder
DROP POLICY IF EXISTS "Locadores can update their documents in storage" ON storage.objects;
CREATE POLICY "Locadores can update their documents in storage"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents'
  AND auth.uid()::text = (storage.foldername(storage.objects.name))[1]
)
WITH CHECK (
  bucket_id = 'documents'
  AND auth.uid()::text = (storage.foldername(storage.objects.name))[1]
);

-- Allow motoristas to update only their own request files
DROP POLICY IF EXISTS "Motoristas can update their own request files" ON storage.objects;
CREATE POLICY "Motoristas can update their own request files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(storage.objects.name))[1] = 'requests'
  AND EXISTS (
    SELECT 1 FROM public.drivers d
    WHERE d.user_id = auth.uid()
      AND d.id::text = (storage.foldername(storage.objects.name))[2]
  )
)
WITH CHECK (
  bucket_id = 'documents'
  AND (storage.foldername(storage.objects.name))[1] = 'requests'
  AND EXISTS (
    SELECT 1 FROM public.drivers d
    WHERE d.user_id = auth.uid()
      AND d.id::text = (storage.foldername(storage.objects.name))[2]
  )
);
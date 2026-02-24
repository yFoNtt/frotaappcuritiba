-- Make inspection-photos bucket private
UPDATE storage.buckets SET public = false WHERE id = 'inspection-photos';

-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Inspection photos are publicly viewable" ON storage.objects;

-- Add restricted SELECT policy for locadores (photos organized by user_id folder)
CREATE POLICY "Locadores can view their inspection photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'inspection-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add SELECT policy for admins
CREATE POLICY "Admins can view all inspection photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'inspection-photos' AND
  public.has_role(auth.uid(), 'admin'::app_role)
);
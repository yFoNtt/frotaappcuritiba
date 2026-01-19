-- Create storage bucket for vehicle images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vehicle-images',
  'vehicle-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Allow authenticated users to upload images to their own folder
CREATE POLICY "Locadores can upload vehicle images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vehicle-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own images
CREATE POLICY "Locadores can update their vehicle images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'vehicle-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own images
CREATE POLICY "Locadores can delete their vehicle images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'vehicle-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to vehicle images
CREATE POLICY "Anyone can view vehicle images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'vehicle-images');
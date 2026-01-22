
-- Create document update requests table
CREATE TABLE public.document_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  locador_id UUID NOT NULL,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  type TEXT NOT NULL, -- 'cnh', 'comprovante', 'contrato', 'multa', 'outro'
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  description TEXT,
  expires_at DATE,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  rejection_reason TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_requests

-- Locadores can view requests for their drivers
CREATE POLICY "Locadores can view their document requests"
ON public.document_requests FOR SELECT
USING (locador_id = auth.uid());

-- Locadores can update requests (approve/reject)
CREATE POLICY "Locadores can update document requests"
ON public.document_requests FOR UPDATE
USING (locador_id = auth.uid());

-- Locadores can delete requests
CREATE POLICY "Locadores can delete document requests"
ON public.document_requests FOR DELETE
USING (locador_id = auth.uid());

-- Motoristas can view their own requests
CREATE POLICY "Motoristas can view their document requests"
ON public.document_requests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM drivers
    WHERE drivers.id = document_requests.driver_id
    AND drivers.user_id = auth.uid()
  )
);

-- Motoristas can insert their own requests
CREATE POLICY "Motoristas can insert document requests"
ON public.document_requests FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM drivers
    WHERE drivers.id = document_requests.driver_id
    AND drivers.user_id = auth.uid()
  )
);

-- Admins can view all requests
CREATE POLICY "Admins can view all document requests"
ON public.document_requests FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_document_requests_updated_at
BEFORE UPDATE ON public.document_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_profiles_updated_at();

-- Add storage policy for motoristas to upload to documents bucket
CREATE POLICY "Motoristas can upload document requests"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'requests'
  AND EXISTS (
    SELECT 1 FROM drivers
    WHERE drivers.user_id = auth.uid()
  )
);

-- Motoristas can view their uploaded request files
CREATE POLICY "Motoristas can view their request files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'requests'
  AND EXISTS (
    SELECT 1 FROM drivers
    WHERE drivers.user_id = auth.uid()
  )
);

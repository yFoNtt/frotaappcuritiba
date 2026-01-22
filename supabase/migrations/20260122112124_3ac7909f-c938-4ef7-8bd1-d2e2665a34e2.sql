
-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for documents bucket
CREATE POLICY "Locadores can upload their documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Locadores can view their documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Locadores can delete their documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create documents table to track metadata
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  locador_id UUID NOT NULL,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'cnh', 'comprovante', 'contrato', 'multa', 'outro'
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  description TEXT,
  expires_at DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Locadores can view their documents"
ON public.documents FOR SELECT
USING (locador_id = auth.uid());

CREATE POLICY "Locadores can insert their documents"
ON public.documents FOR INSERT
WITH CHECK (locador_id = auth.uid());

CREATE POLICY "Locadores can update their documents"
ON public.documents FOR UPDATE
USING (locador_id = auth.uid());

CREATE POLICY "Locadores can delete their documents"
ON public.documents FOR DELETE
USING (locador_id = auth.uid());

CREATE POLICY "Admins can view all documents"
ON public.documents FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Motoristas can view their documents"
ON public.documents FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM drivers
    WHERE drivers.id = documents.driver_id
    AND drivers.user_id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW
EXECUTE FUNCTION public.update_profiles_updated_at();

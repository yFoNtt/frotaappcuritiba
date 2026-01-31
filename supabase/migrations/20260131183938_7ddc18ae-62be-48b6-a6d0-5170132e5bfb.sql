-- Create the update_updated_at_column function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create vehicle_inspections table for check-in/check-out records
CREATE TABLE public.vehicle_inspections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  locador_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('check_in', 'check_out')),
  km_reading INTEGER NOT NULL,
  fuel_level TEXT NOT NULL CHECK (fuel_level IN ('empty', 'quarter', 'half', 'three_quarters', 'full')),
  exterior_condition TEXT NOT NULL CHECK (exterior_condition IN ('excellent', 'good', 'fair', 'poor')),
  interior_condition TEXT NOT NULL CHECK (interior_condition IN ('excellent', 'good', 'fair', 'poor')),
  tires_condition TEXT CHECK (tires_condition IN ('excellent', 'good', 'fair', 'poor')),
  lights_working BOOLEAN DEFAULT true,
  ac_working BOOLEAN DEFAULT true,
  damages TEXT,
  notes TEXT,
  photos TEXT[] DEFAULT '{}',
  performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_vehicle_inspections_vehicle_id ON public.vehicle_inspections(vehicle_id);
CREATE INDEX idx_vehicle_inspections_driver_id ON public.vehicle_inspections(driver_id);
CREATE INDEX idx_vehicle_inspections_contract_id ON public.vehicle_inspections(contract_id);
CREATE INDEX idx_vehicle_inspections_locador_id ON public.vehicle_inspections(locador_id);
CREATE INDEX idx_vehicle_inspections_type ON public.vehicle_inspections(type);
CREATE INDEX idx_vehicle_inspections_performed_at ON public.vehicle_inspections(performed_at DESC);

-- Enable RLS
ALTER TABLE public.vehicle_inspections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Deny public access to vehicle_inspections"
ON public.vehicle_inspections FOR SELECT
USING (false);

CREATE POLICY "Locadores can view their inspections"
ON public.vehicle_inspections FOR SELECT
USING (locador_id = auth.uid());

CREATE POLICY "Locadores can insert their inspections"
ON public.vehicle_inspections FOR INSERT
WITH CHECK (locador_id = auth.uid());

CREATE POLICY "Locadores can update their inspections"
ON public.vehicle_inspections FOR UPDATE
USING (locador_id = auth.uid());

CREATE POLICY "Locadores can delete their inspections"
ON public.vehicle_inspections FOR DELETE
USING (locador_id = auth.uid());

CREATE POLICY "Admins can view all inspections"
ON public.vehicle_inspections FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Motoristas can view their inspections"
ON public.vehicle_inspections FOR SELECT
USING (EXISTS (
  SELECT 1 FROM drivers
  WHERE drivers.id = vehicle_inspections.driver_id
  AND drivers.user_id = auth.uid()
));

-- Create trigger for updated_at
CREATE TRIGGER update_vehicle_inspections_updated_at
BEFORE UPDATE ON public.vehicle_inspections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for inspection photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('inspection-photos', 'inspection-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for inspection photos
CREATE POLICY "Locadores can upload inspection photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'inspection-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Locadores can update their inspection photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'inspection-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Locadores can delete their inspection photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'inspection-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Inspection photos are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'inspection-photos');
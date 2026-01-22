-- Create mileage records table
CREATE TABLE public.mileage_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  locador_id UUID NOT NULL,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  km_reading INTEGER NOT NULL,
  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mileage_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for locadores
CREATE POLICY "Locadores can view their mileage records"
  ON public.mileage_records
  FOR SELECT
  USING (locador_id = auth.uid());

CREATE POLICY "Locadores can insert their mileage records"
  ON public.mileage_records
  FOR INSERT
  WITH CHECK (locador_id = auth.uid());

CREATE POLICY "Locadores can update their mileage records"
  ON public.mileage_records
  FOR UPDATE
  USING (locador_id = auth.uid());

CREATE POLICY "Locadores can delete their mileage records"
  ON public.mileage_records
  FOR DELETE
  USING (locador_id = auth.uid());

-- RLS Policies for admins
CREATE POLICY "Admins can view all mileage records"
  ON public.mileage_records
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for motoristas (view their own records)
CREATE POLICY "Motoristas can view their mileage records"
  ON public.mileage_records
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM drivers 
    WHERE drivers.id = mileage_records.driver_id 
    AND drivers.user_id = auth.uid()
  ));

-- Create indexes for performance
CREATE INDEX idx_mileage_records_locador ON public.mileage_records(locador_id);
CREATE INDEX idx_mileage_records_driver ON public.mileage_records(driver_id);
CREATE INDEX idx_mileage_records_vehicle ON public.mileage_records(vehicle_id);
CREATE INDEX idx_mileage_records_recorded_at ON public.mileage_records(recorded_at DESC);

-- Add current_km column to vehicles table
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS current_km INTEGER DEFAULT 0;

-- Create trigger to update vehicle current_km when mileage is recorded
CREATE OR REPLACE FUNCTION public.update_vehicle_current_km()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.vehicles
  SET current_km = NEW.km_reading, updated_at = now()
  WHERE id = NEW.vehicle_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_vehicle_km_on_mileage_insert
AFTER INSERT ON public.mileage_records
FOR EACH ROW
EXECUTE FUNCTION public.update_vehicle_current_km();
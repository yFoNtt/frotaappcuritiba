-- Create maintenance types enum-like check
-- Create maintenances table
CREATE TABLE public.maintenances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  locador_id UUID NOT NULL,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('oil_change', 'tire_change', 'revision', 'repair', 'inspection', 'other')),
  description TEXT NOT NULL,
  cost NUMERIC DEFAULT 0,
  km_at_maintenance INTEGER,
  performed_at DATE NOT NULL,
  next_maintenance_date DATE,
  next_maintenance_km INTEGER,
  service_provider TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.maintenances ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_maintenances_locador ON public.maintenances(locador_id);
CREATE INDEX idx_maintenances_vehicle ON public.maintenances(vehicle_id);
CREATE INDEX idx_maintenances_type ON public.maintenances(type);
CREATE INDEX idx_maintenances_status ON public.maintenances(status);
CREATE INDEX idx_maintenances_next_date ON public.maintenances(next_maintenance_date);

-- RLS Policies
CREATE POLICY "Locadores can view their maintenances"
  ON public.maintenances FOR SELECT
  USING (locador_id = auth.uid());

CREATE POLICY "Locadores can insert their maintenances"
  ON public.maintenances FOR INSERT
  WITH CHECK (locador_id = auth.uid());

CREATE POLICY "Locadores can update their maintenances"
  ON public.maintenances FOR UPDATE
  USING (locador_id = auth.uid());

CREATE POLICY "Locadores can delete their maintenances"
  ON public.maintenances FOR DELETE
  USING (locador_id = auth.uid());

CREATE POLICY "Admins can view all maintenances"
  ON public.maintenances FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_maintenances_updated_at
  BEFORE UPDATE ON public.maintenances
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profiles_updated_at();
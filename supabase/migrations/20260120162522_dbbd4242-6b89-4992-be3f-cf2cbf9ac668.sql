-- Create drivers table for locador's drivers
CREATE TABLE public.drivers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  locador_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  cnh_number TEXT NOT NULL,
  cnh_expiry DATE NOT NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(locador_id, email),
  UNIQUE(locador_id, cnh_number)
);

-- Enable RLS
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- Locadores can view their own drivers
CREATE POLICY "Locadores can view their drivers"
ON public.drivers
FOR SELECT
USING (locador_id = auth.uid());

-- Locadores can insert their own drivers
CREATE POLICY "Locadores can insert their drivers"
ON public.drivers
FOR INSERT
WITH CHECK (locador_id = auth.uid());

-- Locadores can update their own drivers
CREATE POLICY "Locadores can update their drivers"
ON public.drivers
FOR UPDATE
USING (locador_id = auth.uid());

-- Locadores can delete their own drivers
CREATE POLICY "Locadores can delete their drivers"
ON public.drivers
FOR DELETE
USING (locador_id = auth.uid());

-- Admins can view all drivers
CREATE POLICY "Admins can view all drivers"
ON public.drivers
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Motoristas can view their own driver record
CREATE POLICY "Motoristas can view their own record"
ON public.drivers
FOR SELECT
USING (user_id = auth.uid());

-- Create trigger for updated_at
CREATE TRIGGER update_drivers_updated_at
BEFORE UPDATE ON public.drivers
FOR EACH ROW
EXECUTE FUNCTION public.update_profiles_updated_at();

-- Add index for faster lookups
CREATE INDEX idx_drivers_locador_id ON public.drivers(locador_id);
CREATE INDEX idx_drivers_vehicle_id ON public.drivers(vehicle_id);
CREATE INDEX idx_drivers_user_id ON public.drivers(user_id);
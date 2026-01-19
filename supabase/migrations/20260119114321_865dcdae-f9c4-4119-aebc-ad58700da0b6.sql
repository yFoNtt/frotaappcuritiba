-- Create vehicles table
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  locador_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  plate TEXT NOT NULL,
  color TEXT NOT NULL,
  fuel_type TEXT NOT NULL CHECK (fuel_type IN ('flex', 'gasoline', 'ethanol', 'diesel', 'electric', 'hybrid')),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'rented', 'maintenance', 'inactive')),
  weekly_price DECIMAL(10,2) NOT NULL,
  km_limit INTEGER,
  excess_km_fee DECIMAL(10,2),
  deposit DECIMAL(10,2),
  allowed_apps TEXT[] DEFAULT '{}',
  description TEXT,
  images TEXT[] DEFAULT '{}',
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  current_driver_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- PUBLIC: Can view only available vehicles (marketplace)
CREATE POLICY "Public can view available vehicles"
ON public.vehicles
FOR SELECT
TO anon, authenticated
USING (status = 'available');

-- Locadores can view ALL their own vehicles (any status)
CREATE POLICY "Locadores can view all their vehicles"
ON public.vehicles
FOR SELECT
TO authenticated
USING (locador_id = auth.uid());

-- Locadores can insert their own vehicles
CREATE POLICY "Locadores can insert their vehicles"
ON public.vehicles
FOR INSERT
TO authenticated
WITH CHECK (locador_id = auth.uid());

-- Locadores can update their own vehicles
CREATE POLICY "Locadores can update their vehicles"
ON public.vehicles
FOR UPDATE
TO authenticated
USING (locador_id = auth.uid());

-- Locadores can delete their own vehicles
CREATE POLICY "Locadores can delete their vehicles"
ON public.vehicles
FOR DELETE
TO authenticated
USING (locador_id = auth.uid());

-- Admins can view all vehicles
CREATE POLICY "Admins can view all vehicles"
ON public.vehicles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_vehicles_updated_at
BEFORE UPDATE ON public.vehicles
FOR EACH ROW
EXECUTE FUNCTION public.update_profiles_updated_at();

-- Create indexes for performance
CREATE INDEX idx_vehicles_locador_id ON public.vehicles(locador_id);
CREATE INDEX idx_vehicles_status ON public.vehicles(status);
CREATE INDEX idx_vehicles_city_state ON public.vehicles(city, state);
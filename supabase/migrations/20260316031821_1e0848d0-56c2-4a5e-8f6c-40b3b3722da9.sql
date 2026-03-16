
-- Drop the view (we'll use RPC instead - cleaner and no linter issues)
DROP VIEW IF EXISTS public.vehicles_public;

-- Create a SECURITY DEFINER function for public vehicle listing
-- Returns only non-sensitive columns for available vehicles
CREATE OR REPLACE FUNCTION public.get_public_vehicles()
RETURNS TABLE (
  id uuid,
  brand text,
  model text,
  year integer,
  color text,
  fuel_type text,
  status text,
  weekly_price numeric,
  km_limit integer,
  excess_km_fee numeric,
  deposit numeric,
  allowed_apps text[],
  description text,
  images text[],
  city text,
  state text,
  current_km integer,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    v.id, v.brand, v.model, v.year, v.color, v.fuel_type, v.status,
    v.weekly_price, v.km_limit, v.excess_km_fee, v.deposit,
    v.allowed_apps, v.description, v.images, v.city, v.state,
    v.current_km, v.created_at
  FROM public.vehicles v
  WHERE v.status = 'available'
  ORDER BY v.created_at DESC;
$$;

-- Create a function for single public vehicle by ID
CREATE OR REPLACE FUNCTION public.get_public_vehicle(_vehicle_id uuid)
RETURNS TABLE (
  id uuid,
  brand text,
  model text,
  year integer,
  color text,
  fuel_type text,
  status text,
  weekly_price numeric,
  km_limit integer,
  excess_km_fee numeric,
  deposit numeric,
  allowed_apps text[],
  description text,
  images text[],
  city text,
  state text,
  current_km integer,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    v.id, v.brand, v.model, v.year, v.color, v.fuel_type, v.status,
    v.weekly_price, v.km_limit, v.excess_km_fee, v.deposit,
    v.allowed_apps, v.description, v.images, v.city, v.state,
    v.current_km, v.created_at
  FROM public.vehicles v
  WHERE v.id = _vehicle_id
    AND v.status = 'available';
$$;


-- =============================================
-- FIX 1: Create a secure public view for vehicles
-- Excludes sensitive data (plate, locador_id) from anonymous access
-- =============================================

-- Create a view for public browsing without sensitive columns
CREATE OR REPLACE VIEW public.vehicles_public AS
SELECT
  id,
  brand,
  model,
  year,
  color,
  fuel_type,
  status,
  weekly_price,
  km_limit,
  excess_km_fee,
  deposit,
  allowed_apps,
  description,
  images,
  city,
  state,
  current_km,
  created_at
FROM public.vehicles
WHERE status = 'available';

-- Remove the old anon-inclusive policy
DROP POLICY IF EXISTS "Public can view available vehicles" ON public.vehicles;

-- Recreate the public policy for authenticated users only
CREATE POLICY "Authenticated can view available vehicles"
  ON public.vehicles
  FOR SELECT
  TO authenticated
  USING (status = 'available');

-- Grant anon access to the view only (no direct table access)
GRANT SELECT ON public.vehicles_public TO anon;
GRANT SELECT ON public.vehicles_public TO authenticated;

-- =============================================
-- FIX 2: Prevent privilege escalation
-- Add unique constraint on user_id to prevent multiple roles
-- =============================================

-- First remove existing duplicates if any (keep the first role)
DELETE FROM public.user_roles a
USING public.user_roles b
WHERE a.user_id = b.user_id
  AND a.created_at > b.created_at;

-- Add unique constraint on user_id (one role per user)
ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id);

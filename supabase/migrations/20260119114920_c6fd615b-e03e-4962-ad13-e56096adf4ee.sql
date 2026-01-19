
-- Remove the foreign key constraint to allow test data
ALTER TABLE public.vehicles DROP CONSTRAINT IF EXISTS vehicles_locador_id_fkey;

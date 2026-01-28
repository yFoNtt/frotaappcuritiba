-- Re-add foreign key constraint for vehicles.locador_id
ALTER TABLE public.vehicles 
ADD CONSTRAINT vehicles_locador_id_fkey 
FOREIGN KEY (locador_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

DROP POLICY "Locadores can update their drivers" ON public.drivers;

CREATE POLICY "Locadores can update their drivers"
ON public.drivers
FOR UPDATE
TO public
USING (locador_id = auth.uid())
WITH CHECK (locador_id = auth.uid());

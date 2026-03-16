
-- Fix: Motoristas can only create document requests for their actual locador
DROP POLICY IF EXISTS "Motoristas can insert document requests" ON public.document_requests;

CREATE POLICY "Motoristas can insert document requests"
  ON public.document_requests
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM drivers
      WHERE drivers.id = document_requests.driver_id
        AND drivers.user_id = auth.uid()
        AND drivers.locador_id = document_requests.locador_id
    )
  );

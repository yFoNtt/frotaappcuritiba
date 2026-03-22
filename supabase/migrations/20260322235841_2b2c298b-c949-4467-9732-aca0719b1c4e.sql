
-- Fix UPDATE policies missing WITH CHECK to prevent ownership transfer attacks

-- 1. vehicles
DROP POLICY IF EXISTS "Locadores can update their vehicles" ON public.vehicles;
CREATE POLICY "Locadores can update their vehicles"
  ON public.vehicles FOR UPDATE TO authenticated
  USING (locador_id = auth.uid())
  WITH CHECK (locador_id = auth.uid());

-- 2. maintenances
DROP POLICY IF EXISTS "Locadores can update their maintenances" ON public.maintenances;
CREATE POLICY "Locadores can update their maintenances"
  ON public.maintenances FOR UPDATE
  USING (locador_id = auth.uid())
  WITH CHECK (locador_id = auth.uid());

-- 3. payments
DROP POLICY IF EXISTS "Locadores can update their payments" ON public.payments;
CREATE POLICY "Locadores can update their payments"
  ON public.payments FOR UPDATE
  USING (locador_id = auth.uid())
  WITH CHECK (locador_id = auth.uid());

-- 4. contracts
DROP POLICY IF EXISTS "Locadores can update their contracts" ON public.contracts;
CREATE POLICY "Locadores can update their contracts"
  ON public.contracts FOR UPDATE
  USING (locador_id = auth.uid())
  WITH CHECK (locador_id = auth.uid());

-- 5. documents
DROP POLICY IF EXISTS "Locadores can update their documents" ON public.documents;
CREATE POLICY "Locadores can update their documents"
  ON public.documents FOR UPDATE
  USING (locador_id = auth.uid())
  WITH CHECK (locador_id = auth.uid());

-- 6. document_requests
DROP POLICY IF EXISTS "Locadores can update document requests" ON public.document_requests;
CREATE POLICY "Locadores can update document requests"
  ON public.document_requests FOR UPDATE
  USING (locador_id = auth.uid())
  WITH CHECK (locador_id = auth.uid());

-- 7. vehicle_inspections
DROP POLICY IF EXISTS "Locadores can update their inspections" ON public.vehicle_inspections;
CREATE POLICY "Locadores can update their inspections"
  ON public.vehicle_inspections FOR UPDATE
  USING (locador_id = auth.uid())
  WITH CHECK (locador_id = auth.uid());

-- 8. notifications
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 9. cnh_alerts
DROP POLICY IF EXISTS "Users can update their own alerts" ON public.cnh_alerts;
CREATE POLICY "Users can update their own alerts"
  ON public.cnh_alerts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 10. profiles
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- vehicles
DROP POLICY "Locadores can insert their vehicles" ON public.vehicles;
CREATE POLICY "Locadores can insert their vehicles"
ON public.vehicles FOR INSERT TO authenticated
WITH CHECK (locador_id = auth.uid() AND has_role(auth.uid(), 'locador'::app_role));

-- drivers
DROP POLICY "Locadores can insert their drivers" ON public.drivers;
CREATE POLICY "Locadores can insert their drivers"
ON public.drivers FOR INSERT TO public
WITH CHECK (locador_id = auth.uid() AND has_role(auth.uid(), 'locador'::app_role));

-- contracts
DROP POLICY "Locadores can insert their contracts" ON public.contracts;
CREATE POLICY "Locadores can insert their contracts"
ON public.contracts FOR INSERT TO public
WITH CHECK (locador_id = auth.uid() AND has_role(auth.uid(), 'locador'::app_role));

-- payments
DROP POLICY "Locadores can insert their payments" ON public.payments;
CREATE POLICY "Locadores can insert their payments"
ON public.payments FOR INSERT TO public
WITH CHECK (locador_id = auth.uid() AND has_role(auth.uid(), 'locador'::app_role));

-- maintenances
DROP POLICY "Locadores can insert their maintenances" ON public.maintenances;
CREATE POLICY "Locadores can insert their maintenances"
ON public.maintenances FOR INSERT TO public
WITH CHECK (locador_id = auth.uid() AND has_role(auth.uid(), 'locador'::app_role));

-- mileage_records
DROP POLICY "Locadores can insert their mileage records" ON public.mileage_records;
CREATE POLICY "Locadores can insert their mileage records"
ON public.mileage_records FOR INSERT TO public
WITH CHECK (locador_id = auth.uid() AND has_role(auth.uid(), 'locador'::app_role));

-- documents
DROP POLICY "Locadores can insert their documents" ON public.documents;
CREATE POLICY "Locadores can insert their documents"
ON public.documents FOR INSERT TO public
WITH CHECK (locador_id = auth.uid() AND has_role(auth.uid(), 'locador'::app_role));

-- vehicle_inspections
DROP POLICY "Locadores can insert their inspections" ON public.vehicle_inspections;
CREATE POLICY "Locadores can insert their inspections"
ON public.vehicle_inspections FOR INSERT TO public
WITH CHECK (locador_id = auth.uid() AND has_role(auth.uid(), 'locador'::app_role));

-- inspection_checklist_templates
DROP POLICY "Locadores can insert their templates" ON public.inspection_checklist_templates;
CREATE POLICY "Locadores can insert their templates"
ON public.inspection_checklist_templates FOR INSERT TO public
WITH CHECK (locador_id = auth.uid() AND has_role(auth.uid(), 'locador'::app_role));

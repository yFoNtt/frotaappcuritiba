CREATE OR REPLACE FUNCTION public.is_locador(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'locador'::public.app_role
  )
$$;

REVOKE ALL ON FUNCTION public.is_locador(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_locador(uuid) TO authenticated, service_role;

CREATE POLICY "Admins can insert vehicles"
ON public.vehicles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.is_locador(locador_id));
CREATE POLICY "Admins can update vehicles"
ON public.vehicles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.is_locador(locador_id));
CREATE POLICY "Admins can delete vehicles"
ON public.vehicles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can insert drivers"
ON public.drivers FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.is_locador(locador_id));
CREATE POLICY "Admins can update drivers"
ON public.drivers FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.is_locador(locador_id));
CREATE POLICY "Admins can delete drivers"
ON public.drivers FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can insert contracts"
ON public.contracts FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.is_locador(locador_id));
CREATE POLICY "Admins can update contracts"
ON public.contracts FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.is_locador(locador_id));
CREATE POLICY "Admins can delete contracts"
ON public.contracts FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can insert payments"
ON public.payments FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.is_locador(locador_id));
CREATE POLICY "Admins can update payments"
ON public.payments FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.is_locador(locador_id));
CREATE POLICY "Admins can delete payments"
ON public.payments FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can insert maintenances"
ON public.maintenances FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.is_locador(locador_id));
CREATE POLICY "Admins can update maintenances"
ON public.maintenances FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.is_locador(locador_id));
CREATE POLICY "Admins can delete maintenances"
ON public.maintenances FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can insert mileage records"
ON public.mileage_records FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  AND EXISTS (
    SELECT 1 FROM public.vehicles v
    WHERE v.id = vehicle_id AND public.is_locador(v.locador_id)
  )
);
CREATE POLICY "Admins can update mileage records"
ON public.mileage_records FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  AND EXISTS (
    SELECT 1 FROM public.vehicles v
    WHERE v.id = vehicle_id AND public.is_locador(v.locador_id)
  )
);
CREATE POLICY "Admins can delete mileage records"
ON public.mileage_records FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can insert inspections"
ON public.vehicle_inspections FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.is_locador(locador_id));
CREATE POLICY "Admins can update inspections"
ON public.vehicle_inspections FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.is_locador(locador_id));
CREATE POLICY "Admins can delete inspections"
ON public.vehicle_inspections FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can insert documents"
ON public.documents FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.is_locador(locador_id));
CREATE POLICY "Admins can update documents"
ON public.documents FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.is_locador(locador_id));
CREATE POLICY "Admins can delete documents"
ON public.documents FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can insert document requests"
ON public.document_requests FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.is_locador(locador_id));
CREATE POLICY "Admins can update document requests"
ON public.document_requests FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.is_locador(locador_id));
CREATE POLICY "Admins can delete document requests"
ON public.document_requests FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can insert checklist templates"
ON public.inspection_checklist_templates FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.is_locador(locador_id));
CREATE POLICY "Admins can update checklist templates"
ON public.inspection_checklist_templates FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.is_locador(locador_id));
CREATE POLICY "Admins can delete checklist templates"
ON public.inspection_checklist_templates FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update profiles"
ON public.profiles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can insert vehicle images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'vehicle-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can update vehicle images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'vehicle-images' AND public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (bucket_id = 'vehicle-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can delete vehicle images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'vehicle-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can insert documents storage"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can update documents storage"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can delete documents storage"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can insert inspection photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'inspection-photos' AND public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can update inspection photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'inspection-photos' AND public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (bucket_id = 'inspection-photos' AND public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can delete inspection photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'inspection-photos' AND public.has_role(auth.uid(), 'admin'::public.app_role));
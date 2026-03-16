
-- Drop existing triggers if any, then recreate all

-- 1. Audit triggers
DROP TRIGGER IF EXISTS audit_contracts ON public.contracts;
DROP TRIGGER IF EXISTS audit_payments ON public.payments;
DROP TRIGGER IF EXISTS audit_drivers ON public.drivers;
DROP TRIGGER IF EXISTS audit_vehicles ON public.vehicles;
DROP TRIGGER IF EXISTS audit_maintenances ON public.maintenances;
DROP TRIGGER IF EXISTS audit_documents ON public.documents;
DROP TRIGGER IF EXISTS audit_document_requests ON public.document_requests;
DROP TRIGGER IF EXISTS audit_vehicle_inspections ON public.vehicle_inspections;

CREATE TRIGGER audit_contracts AFTER INSERT OR UPDATE OR DELETE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_payments AFTER INSERT OR UPDATE OR DELETE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_drivers AFTER INSERT OR UPDATE OR DELETE ON public.drivers FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_vehicles AFTER INSERT OR UPDATE OR DELETE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_maintenances AFTER INSERT OR UPDATE OR DELETE ON public.maintenances FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_documents AFTER INSERT OR UPDATE OR DELETE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_document_requests AFTER INSERT OR UPDATE OR DELETE ON public.document_requests FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_vehicle_inspections AFTER INSERT OR UPDATE OR DELETE ON public.vehicle_inspections FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- 2. Validation triggers
DROP TRIGGER IF EXISTS validate_profile_documents_trigger ON public.profiles;
DROP TRIGGER IF EXISTS validate_driver_cnh_trigger ON public.drivers;

CREATE TRIGGER validate_profile_documents_trigger BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.validate_profile_documents();
CREATE TRIGGER validate_driver_cnh_trigger BEFORE INSERT OR UPDATE ON public.drivers FOR EACH ROW EXECUTE FUNCTION public.validate_driver_cnh();

-- 3. Auto-update vehicle km
DROP TRIGGER IF EXISTS update_vehicle_km_on_mileage ON public.mileage_records;
CREATE TRIGGER update_vehicle_km_on_mileage AFTER INSERT ON public.mileage_records FOR EACH ROW EXECUTE FUNCTION public.update_vehicle_current_km();

-- 4. Notify locador on driver changes
DROP TRIGGER IF EXISTS notify_locador_on_driver_audit ON public.audit_logs;
CREATE TRIGGER notify_locador_on_driver_audit AFTER INSERT ON public.audit_logs FOR EACH ROW EXECUTE FUNCTION public.notify_locador_on_driver_change();

-- 5. Auto-update updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at_trigger ON public.profiles;
DROP TRIGGER IF EXISTS update_contracts_updated_at ON public.contracts;
DROP TRIGGER IF EXISTS update_drivers_updated_at ON public.drivers;
DROP TRIGGER IF EXISTS update_vehicles_updated_at ON public.vehicles;
DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
DROP TRIGGER IF EXISTS update_maintenances_updated_at ON public.maintenances;
DROP TRIGGER IF EXISTS update_documents_updated_at ON public.documents;
DROP TRIGGER IF EXISTS update_document_requests_updated_at ON public.document_requests;
DROP TRIGGER IF EXISTS update_vehicle_inspections_updated_at ON public.vehicle_inspections;
DROP TRIGGER IF EXISTS update_mileage_records_updated_at ON public.mileage_records;
DROP TRIGGER IF EXISTS update_inspection_checklist_templates_updated_at ON public.inspection_checklist_templates;

CREATE TRIGGER update_profiles_updated_at_trigger BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_profiles_updated_at();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON public.drivers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_maintenances_updated_at BEFORE UPDATE ON public.maintenances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_document_requests_updated_at BEFORE UPDATE ON public.document_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vehicle_inspections_updated_at BEFORE UPDATE ON public.vehicle_inspections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_mileage_records_updated_at BEFORE UPDATE ON public.mileage_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inspection_checklist_templates_updated_at BEFORE UPDATE ON public.inspection_checklist_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

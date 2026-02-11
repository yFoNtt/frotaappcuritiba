
CREATE TRIGGER audit_documents
  AFTER INSERT OR UPDATE OR DELETE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_document_requests
  AFTER INSERT OR UPDATE OR DELETE ON public.document_requests
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_vehicle_inspections
  AFTER INSERT OR UPDATE OR DELETE ON public.vehicle_inspections
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

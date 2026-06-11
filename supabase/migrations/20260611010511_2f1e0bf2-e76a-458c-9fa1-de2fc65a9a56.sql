DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'audit_consents_trigger'
  ) THEN
    CREATE TRIGGER audit_consents_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.consents
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
  END IF;
END $$;
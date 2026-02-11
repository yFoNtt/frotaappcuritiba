
-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  action text NOT NULL, -- INSERT, UPDATE, DELETE
  changed_by uuid NOT NULL,
  old_data jsonb,
  new_data jsonb,
  changed_fields text[],
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies: locadores see their own logs, admins see all
CREATE POLICY "Locadores can view their audit logs"
  ON public.audit_logs FOR SELECT
  USING (changed_by = auth.uid());

CREATE POLICY "Admins can view all audit logs"
  ON public.audit_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Deny public access to audit_logs"
  ON public.audit_logs FOR SELECT
  USING (false);

-- Index for fast lookups
CREATE INDEX idx_audit_logs_table_record ON public.audit_logs (table_name, record_id);
CREATE INDEX idx_audit_logs_changed_by ON public.audit_logs (changed_by);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs (created_at DESC);

-- Audit trigger function
CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _changed_fields text[] := '{}';
  _old jsonb;
  _new jsonb;
  _user_id uuid;
  _key text;
BEGIN
  _user_id := COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid);

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (table_name, record_id, action, changed_by, new_data)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', _user_id, to_jsonb(NEW));
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    _old := to_jsonb(OLD);
    _new := to_jsonb(NEW);
    FOR _key IN SELECT jsonb_object_keys(_new)
    LOOP
      IF _key NOT IN ('updated_at') AND (_old ->> _key) IS DISTINCT FROM (_new ->> _key) THEN
        _changed_fields := array_append(_changed_fields, _key);
      END IF;
    END LOOP;

    -- Only log if something actually changed
    IF array_length(_changed_fields, 1) > 0 THEN
      INSERT INTO public.audit_logs (table_name, record_id, action, changed_by, old_data, new_data, changed_fields)
      VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', _user_id, _old, _new, _changed_fields);
    END IF;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (table_name, record_id, action, changed_by, old_data)
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', _user_id, to_jsonb(OLD));
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

-- Attach triggers to critical tables
CREATE TRIGGER audit_contracts
  AFTER INSERT OR UPDATE OR DELETE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_payments
  AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_drivers
  AFTER INSERT OR UPDATE OR DELETE ON public.drivers
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_vehicles
  AFTER INSERT OR UPDATE OR DELETE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_maintenances
  AFTER INSERT OR UPDATE OR DELETE ON public.maintenances
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

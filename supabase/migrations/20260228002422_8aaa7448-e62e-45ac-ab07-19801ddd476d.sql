
-- Function that creates a notification for the locador when a motorista makes changes
CREATE OR REPLACE FUNCTION public.notify_locador_on_driver_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _driver RECORD;
  _table_label TEXT;
  _action_label TEXT;
  _table_labels JSONB := '{
    "contracts": "Contratos",
    "payments": "Pagamentos",
    "drivers": "Motoristas",
    "vehicles": "Veículos",
    "maintenances": "Manutenções",
    "documents": "Documentos",
    "document_requests": "Solicitações",
    "vehicle_inspections": "Vistorias",
    "mileage_records": "Quilometragem"
  }'::jsonb;
  _action_labels JSONB := '{
    "INSERT": "criou",
    "UPDATE": "atualizou",
    "DELETE": "excluiu"
  }'::jsonb;
BEGIN
  -- Check if the changed_by is a motorista linked to a locador
  SELECT d.name, d.locador_id
  INTO _driver
  FROM public.drivers d
  WHERE d.user_id = NEW.changed_by
    AND d.status = 'active'
  LIMIT 1;

  -- If no driver found, this wasn't a motorista action — skip
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Don't notify if the locador is the same as changed_by (shouldn't happen, but safe)
  IF _driver.locador_id = NEW.changed_by THEN
    RETURN NEW;
  END IF;

  _table_label := COALESCE(_table_labels ->> NEW.table_name, NEW.table_name);
  _action_label := COALESCE(_action_labels ->> NEW.action, NEW.action);

  INSERT INTO public.notifications (user_id, type, title, message, metadata)
  VALUES (
    _driver.locador_id,
    'driver_change',
    'Alteração por motorista',
    format('O motorista %s %s um registro em %s.', _driver.name, _action_label, _table_label),
    jsonb_build_object(
      'audit_log_id', NEW.id,
      'driver_name', _driver.name,
      'table_name', NEW.table_name,
      'action', NEW.action,
      'record_id', NEW.record_id
    )
  );

  RETURN NEW;
END;
$$;

-- Trigger on audit_logs after insert
CREATE TRIGGER trg_notify_locador_on_driver_change
AFTER INSERT ON public.audit_logs
FOR EACH ROW
EXECUTE FUNCTION public.notify_locador_on_driver_change();

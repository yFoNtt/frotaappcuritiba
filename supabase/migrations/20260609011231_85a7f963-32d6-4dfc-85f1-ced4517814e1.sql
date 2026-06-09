-- Helper: add FK only if not exists
DO $$
DECLARE
  r RECORD;
BEGIN
  -- drivers.locador_id -> auth.users
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fk_drivers_locador') THEN
    ALTER TABLE public.drivers
      ADD CONSTRAINT fk_drivers_locador
      FOREIGN KEY (locador_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- documents.locador_id -> auth.users
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fk_documents_locador') THEN
    ALTER TABLE public.documents
      ADD CONSTRAINT fk_documents_locador
      FOREIGN KEY (locador_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- notifications.user_id -> auth.users
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fk_notifications_user') THEN
    ALTER TABLE public.notifications
      ADD CONSTRAINT fk_notifications_user
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- contracts.locador_id -> auth.users
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fk_contracts_locador') THEN
    ALTER TABLE public.contracts
      ADD CONSTRAINT fk_contracts_locador
      FOREIGN KEY (locador_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- payments.locador_id -> auth.users
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fk_payments_locador') THEN
    ALTER TABLE public.payments
      ADD CONSTRAINT fk_payments_locador
      FOREIGN KEY (locador_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- maintenances.locador_id -> auth.users
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fk_maintenances_locador') THEN
    ALTER TABLE public.maintenances
      ADD CONSTRAINT fk_maintenances_locador
      FOREIGN KEY (locador_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- mileage_records.locador_id -> auth.users
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fk_mileage_locador') THEN
    ALTER TABLE public.mileage_records
      ADD CONSTRAINT fk_mileage_locador
      FOREIGN KEY (locador_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- vehicle_inspections.locador_id -> auth.users
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fk_inspections_locador') THEN
    ALTER TABLE public.vehicle_inspections
      ADD CONSTRAINT fk_inspections_locador
      FOREIGN KEY (locador_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- inspection_checklist_templates.locador_id -> auth.users
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fk_templates_locador') THEN
    ALTER TABLE public.inspection_checklist_templates
      ADD CONSTRAINT fk_templates_locador
      FOREIGN KEY (locador_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- conversations.locador_id / driver_id -> auth.users
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fk_conversations_locador') THEN
    ALTER TABLE public.conversations
      ADD CONSTRAINT fk_conversations_locador
      FOREIGN KEY (locador_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fk_conversations_driver') THEN
    ALTER TABLE public.conversations
      ADD CONSTRAINT fk_conversations_driver
      FOREIGN KEY (driver_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- document_requests.locador_id -> auth.users
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fk_docreq_locador') THEN
    ALTER TABLE public.document_requests
      ADD CONSTRAINT fk_docreq_locador
      FOREIGN KEY (locador_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- Convert payments_contract_id_fkey to ON DELETE CASCADE
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname='payments_contract_id_fkey' AND confdeltype <> 'c') THEN
    ALTER TABLE public.payments DROP CONSTRAINT payments_contract_id_fkey;
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_contract_id_fkey
      FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;
  END IF;

  -- maintenances vehicle FK with CASCADE
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname='maintenances_vehicle_id_fkey' AND confdeltype <> 'c') THEN
    ALTER TABLE public.maintenances DROP CONSTRAINT maintenances_vehicle_id_fkey;
    ALTER TABLE public.maintenances
      ADD CONSTRAINT maintenances_vehicle_id_fkey
      FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE CASCADE;
  END IF;

  -- mileage_records vehicle FK with CASCADE
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname='mileage_records_vehicle_id_fkey' AND confdeltype <> 'c') THEN
    ALTER TABLE public.mileage_records DROP CONSTRAINT mileage_records_vehicle_id_fkey;
    ALTER TABLE public.mileage_records
      ADD CONSTRAINT mileage_records_vehicle_id_fkey
      FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE CASCADE;
  END IF;

  -- vehicle_inspections vehicle FK with CASCADE
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname='vehicle_inspections_vehicle_id_fkey' AND confdeltype <> 'c') THEN
    ALTER TABLE public.vehicle_inspections DROP CONSTRAINT vehicle_inspections_vehicle_id_fkey;
    ALTER TABLE public.vehicle_inspections
      ADD CONSTRAINT vehicle_inspections_vehicle_id_fkey
      FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE CASCADE;
  END IF;
END $$;
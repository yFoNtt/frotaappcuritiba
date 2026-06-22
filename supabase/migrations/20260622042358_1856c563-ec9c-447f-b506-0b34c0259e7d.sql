DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_conversations_driver') THEN
    ALTER TABLE public.conversations DROP CONSTRAINT fk_conversations_driver;
  END IF;

  ALTER TABLE public.conversations
    ADD CONSTRAINT fk_conversations_driver
    FOREIGN KEY (driver_id) REFERENCES public.drivers(id) ON DELETE CASCADE;
END $$;
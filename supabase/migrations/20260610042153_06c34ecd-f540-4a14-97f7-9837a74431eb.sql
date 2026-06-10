DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='consents' AND policyname='Usuário revoga próprio consentimento') THEN
    CREATE POLICY "Usuário revoga próprio consentimento" ON public.consents
      FOR UPDATE TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
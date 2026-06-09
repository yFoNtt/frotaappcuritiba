CREATE TABLE IF NOT EXISTS public.consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  terms_version text NOT NULL,
  privacy_version text NOT NULL,
  ip_address text,
  user_agent text,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

GRANT SELECT, INSERT ON public.consents TO authenticated;
GRANT ALL ON public.consents TO service_role;

ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='consents' AND policyname='Usuário lê próprios consentimentos') THEN
    CREATE POLICY "Usuário lê próprios consentimentos"
      ON public.consents FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='consents' AND policyname='Usuário insere próprio consentimento') THEN
    CREATE POLICY "Usuário insere próprio consentimento"
      ON public.consents FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_consents_user_id ON public.consents(user_id, accepted_at DESC);
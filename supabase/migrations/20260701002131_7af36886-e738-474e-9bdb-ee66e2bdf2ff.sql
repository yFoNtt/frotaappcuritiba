CREATE TABLE public.site_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  path text NOT NULL,
  referrer text,
  user_agent text,
  is_mobile boolean,
  city text,
  region text,
  country text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_site_visits_created_at ON public.site_visits (created_at DESC);
CREATE INDEX idx_site_visits_ip_created ON public.site_visits (ip_address, created_at DESC);

GRANT SELECT ON public.site_visits TO authenticated;
GRANT ALL ON public.site_visits TO service_role;

ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ver visitas"
  ON public.site_visits
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.cleanup_old_site_visits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.site_visits
  WHERE created_at < now() - interval '180 days';
$$;

REVOKE ALL ON FUNCTION public.cleanup_old_site_visits() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cleanup_old_site_visits() FROM anon;
REVOKE ALL ON FUNCTION public.cleanup_old_site_visits() FROM authenticated;

SELECT cron.schedule(
  'cleanup-site-visits-daily',
  '0 3 * * *',
  $$SELECT public.cleanup_old_site_visits();$$
);
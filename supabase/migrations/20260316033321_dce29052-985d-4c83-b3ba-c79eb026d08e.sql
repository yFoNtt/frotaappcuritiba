
-- Table to track login attempts for rate limiting
CREATE TABLE public.login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip_address text NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now(),
  success boolean NOT NULL DEFAULT false
);

-- Index for fast lookups by email + time
CREATE INDEX idx_login_attempts_email_time ON public.login_attempts (email, attempted_at DESC);
CREATE INDEX idx_login_attempts_ip_time ON public.login_attempts (ip_address, attempted_at DESC);

-- Enable RLS but block all direct access (only edge function with service role can write)
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- No policies = no direct access from client. Only service_role bypasses RLS.

-- Auto-cleanup: delete attempts older than 24 hours (called periodically)
CREATE OR REPLACE FUNCTION public.cleanup_old_login_attempts()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.login_attempts
  WHERE attempted_at < now() - interval '24 hours';
$$;


-- Fix the view to use SECURITY INVOKER (safe default)
ALTER VIEW public.vehicles_public SET (security_invoker = on);

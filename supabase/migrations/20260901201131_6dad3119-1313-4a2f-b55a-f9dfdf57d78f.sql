-- Reverte GRANT indevido introduzido em 20260821123100_4a5bf4dc-98aa-472a-a57d-b42abaf2fe2e.sql
-- Reforça o fail-closed já aplicado anteriormente em 20260318123144 e 20260428011503.
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
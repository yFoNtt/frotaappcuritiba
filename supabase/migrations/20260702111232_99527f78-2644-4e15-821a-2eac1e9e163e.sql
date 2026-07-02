REVOKE ALL ON FUNCTION public.get_user_emails_for_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_emails_for_admin() TO authenticated;
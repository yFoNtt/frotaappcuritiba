-- Create a secure function to get user emails for admin users
CREATE OR REPLACE FUNCTION public.get_user_emails_for_admin()
RETURNS TABLE (
  user_id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow admins to call this function
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  RETURN QUERY
  SELECT 
    au.id as user_id,
    au.email::text,
    au.created_at,
    au.last_sign_in_at
  FROM auth.users au;
END;
$$;

-- Grant execute permission to authenticated users (function itself checks for admin role)
GRANT EXECUTE ON FUNCTION public.get_user_emails_for_admin() TO authenticated;
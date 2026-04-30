-- Returns true if the email already has an application, callable by anon.
-- SECURITY DEFINER bypasses RLS so anon doesn't need SELECT on applications.
CREATE OR REPLACE FUNCTION public.email_already_registered(check_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM applications WHERE email = lower(trim(check_email))
  );
$$;

GRANT EXECUTE ON FUNCTION public.email_already_registered(TEXT) TO anon;

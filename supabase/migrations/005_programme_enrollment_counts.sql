-- Public-readable approved-application counts per programme.
-- SECURITY DEFINER bypasses RLS so anonymous applicants can see whether a
-- programme is full, without exposing any application data.
CREATE OR REPLACE FUNCTION public.programme_enrollment_counts()
RETURNS TABLE (programme_id UUID, approved_count BIGINT)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT programme_id, COUNT(*)::BIGINT
  FROM applications
  WHERE status = 'approved'
  GROUP BY programme_id;
$$;

GRANT EXECUTE ON FUNCTION public.programme_enrollment_counts() TO anon, authenticated;

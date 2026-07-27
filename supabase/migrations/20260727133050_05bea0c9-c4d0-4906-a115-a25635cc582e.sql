
CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS TABLE (
  users_count BIGINT,
  courses_count BIGINT,
  certificates_count BIGINT,
  lessons_completed_count BIGINT,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT users_count, courses_count, certificates_count, lessons_completed_count, updated_at
  FROM public.platform_stats_cache
  WHERE id = 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_platform_stats() TO anon, authenticated;

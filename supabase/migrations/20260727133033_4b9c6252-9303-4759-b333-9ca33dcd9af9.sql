
CREATE TABLE IF NOT EXISTS public.platform_stats_cache (
  id INT PRIMARY KEY DEFAULT 1,
  users_count BIGINT NOT NULL DEFAULT 0,
  courses_count BIGINT NOT NULL DEFAULT 0,
  certificates_count BIGINT NOT NULL DEFAULT 0,
  lessons_completed_count BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

GRANT SELECT ON public.platform_stats_cache TO anon, authenticated;
GRANT ALL ON public.platform_stats_cache TO service_role;
ALTER TABLE public.platform_stats_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform_stats_cache_public_read" ON public.platform_stats_cache;
CREATE POLICY "platform_stats_cache_public_read"
  ON public.platform_stats_cache FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE OR REPLACE FUNCTION public.refresh_platform_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.platform_stats_cache (id, users_count, courses_count, certificates_count, lessons_completed_count, updated_at)
  VALUES (
    1,
    (SELECT count(*) FROM public.profiles),
    (SELECT count(*) FROM public.courses WHERE is_published = true),
    (SELECT count(*) FROM public.certificates),
    (SELECT count(*) FROM public.user_lesson_progress WHERE is_completed = true),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    users_count = EXCLUDED.users_count,
    courses_count = EXCLUDED.courses_count,
    certificates_count = EXCLUDED.certificates_count,
    lessons_completed_count = EXCLUDED.lessons_completed_count,
    updated_at = EXCLUDED.updated_at;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.refresh_platform_stats() FROM PUBLIC, anon, authenticated;

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
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT users_count, courses_count, certificates_count, lessons_completed_count, updated_at
  FROM public.platform_stats_cache
  WHERE id = 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_platform_stats() TO anon, authenticated;

SELECT public.refresh_platform_stats();

-- Agendar refresh de hora em hora
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('refresh-platform-stats');
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'refresh-platform-stats',
  '0 * * * *',
  $$SELECT public.refresh_platform_stats();$$
);

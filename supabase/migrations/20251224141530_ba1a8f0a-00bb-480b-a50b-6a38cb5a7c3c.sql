
-- Update the leaderboard function to support time period filtering
DROP FUNCTION IF EXISTS public.get_leaderboard(integer);

CREATE OR REPLACE FUNCTION public.get_leaderboard(
  p_limit integer DEFAULT 50,
  p_period text DEFAULT 'all'
)
RETURNS TABLE (
  rank bigint,
  user_id uuid,
  display_name text,
  avatar_url text,
  total_xp integer,
  current_level integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_date timestamp with time zone;
BEGIN
  -- Calculate start date based on period
  CASE p_period
    WHEN 'week' THEN
      v_start_date := date_trunc('week', now());
    WHEN 'month' THEN
      v_start_date := date_trunc('month', now());
    ELSE
      v_start_date := NULL; -- all time
  END CASE;

  IF v_start_date IS NULL THEN
    -- All time leaderboard
    RETURN QUERY
    SELECT 
      ROW_NUMBER() OVER (ORDER BY ux.total_xp DESC) as rank,
      ux.user_id,
      COALESCE(p.full_name, 'Anônimo') as display_name,
      p.avatar_url,
      ux.total_xp,
      ux.current_level
    FROM public.user_xp ux
    LEFT JOIN public.profiles p ON p.user_id = ux.user_id
    WHERE ux.total_xp > 0
    ORDER BY ux.total_xp DESC
    LIMIT p_limit;
  ELSE
    -- Period-based leaderboard (XP earned in period)
    RETURN QUERY
    WITH period_xp AS (
      SELECT 
        ux.user_id,
        ux.total_xp,
        ux.current_level,
        -- Calculate XP earned in period based on last_xp_earned_at
        CASE 
          WHEN ux.last_xp_earned_at >= v_start_date THEN ux.total_xp
          ELSE 0
        END as period_xp_amount
      FROM public.user_xp ux
      WHERE ux.total_xp > 0
    )
    SELECT 
      ROW_NUMBER() OVER (ORDER BY px.period_xp_amount DESC, px.total_xp DESC) as rank,
      px.user_id,
      COALESCE(p.full_name, 'Anônimo') as display_name,
      p.avatar_url,
      px.period_xp_amount as total_xp,
      px.current_level
    FROM period_xp px
    LEFT JOIN public.profiles p ON p.user_id = px.user_id
    WHERE px.period_xp_amount > 0
    ORDER BY px.period_xp_amount DESC, px.total_xp DESC
    LIMIT p_limit;
  END IF;
END;
$$;

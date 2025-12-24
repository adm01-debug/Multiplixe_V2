
-- Create a security definer function to get leaderboard data
-- This allows fetching rankings without exposing raw user_xp table
CREATE OR REPLACE FUNCTION public.get_leaderboard(p_limit integer DEFAULT 50)
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
BEGIN
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
END;
$$;

-- Create function to get user's own rank
CREATE OR REPLACE FUNCTION public.get_user_rank(p_user_id uuid)
RETURNS TABLE (
  rank bigint,
  total_users bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH ranked_users AS (
    SELECT 
      user_id,
      ROW_NUMBER() OVER (ORDER BY total_xp DESC) as user_rank
    FROM public.user_xp
    WHERE total_xp > 0
  )
  SELECT 
    COALESCE(ru.user_rank, 0) as rank,
    (SELECT COUNT(*) FROM public.user_xp WHERE total_xp > 0) as total_users
  FROM ranked_users ru
  WHERE ru.user_id = p_user_id;
END;
$$;

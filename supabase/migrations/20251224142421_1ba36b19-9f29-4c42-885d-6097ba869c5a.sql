
-- Create XP history table to track XP changes over time
CREATE TABLE public.user_xp_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  xp_amount integer NOT NULL,
  total_xp_after integer NOT NULL,
  source text NOT NULL DEFAULT 'general',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_xp_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own XP history
CREATE POLICY "Users can view their own XP history"
ON public.user_xp_history
FOR SELECT
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_user_xp_history_user_date ON public.user_xp_history(user_id, created_at DESC);

-- Update add_user_xp function to also log to history
CREATE OR REPLACE FUNCTION public.add_user_xp(p_user_id uuid, p_amount integer, p_source text DEFAULT 'general'::text)
RETURNS user_xp
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_xp public.user_xp;
  v_new_total integer;
BEGIN
  -- Insert or update user XP
  INSERT INTO public.user_xp (user_id, total_xp, last_xp_earned_at)
  VALUES (p_user_id, p_amount, now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_xp = user_xp.total_xp + p_amount,
    last_xp_earned_at = now(),
    xp_from_lessons = CASE WHEN p_source = 'lesson' THEN user_xp.xp_from_lessons + p_amount ELSE user_xp.xp_from_lessons END,
    xp_from_courses = CASE WHEN p_source = 'course' THEN user_xp.xp_from_courses + p_amount ELSE user_xp.xp_from_courses END,
    xp_from_streaks = CASE WHEN p_source = 'streak' THEN user_xp.xp_from_streaks + p_amount ELSE user_xp.xp_from_streaks END,
    xp_from_achievements = CASE WHEN p_source = 'achievement' THEN user_xp.xp_from_achievements + p_amount ELSE user_xp.xp_from_achievements END
  RETURNING * INTO v_user_xp;
  
  -- Log to XP history
  INSERT INTO public.user_xp_history (user_id, xp_amount, total_xp_after, source)
  VALUES (p_user_id, p_amount, v_user_xp.total_xp, p_source);
  
  -- Update current level based on total XP
  UPDATE public.user_xp
  SET current_level = CASE
    WHEN total_xp >= 5200 THEN 10
    WHEN total_xp >= 3800 THEN 9
    WHEN total_xp >= 2700 THEN 8
    WHEN total_xp >= 1900 THEN 7
    WHEN total_xp >= 1300 THEN 6
    WHEN total_xp >= 850 THEN 5
    WHEN total_xp >= 500 THEN 4
    WHEN total_xp >= 250 THEN 3
    WHEN total_xp >= 100 THEN 2
    ELSE 1
  END
  WHERE user_id = p_user_id
  RETURNING * INTO v_user_xp;
  
  RETURN v_user_xp;
END;
$$;

-- Function to get XP history aggregated by day
CREATE OR REPLACE FUNCTION public.get_xp_history(p_user_id uuid, p_days integer DEFAULT 30)
RETURNS TABLE (
  date date,
  daily_xp integer,
  cumulative_xp integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH daily_xp AS (
    SELECT 
      DATE(created_at) as xp_date,
      SUM(xp_amount)::integer as xp_earned
    FROM public.user_xp_history
    WHERE user_id = p_user_id
      AND created_at >= CURRENT_DATE - (p_days || ' days')::interval
    GROUP BY DATE(created_at)
  ),
  date_series AS (
    SELECT generate_series(
      CURRENT_DATE - (p_days || ' days')::interval,
      CURRENT_DATE,
      '1 day'::interval
    )::date as series_date
  )
  SELECT 
    ds.series_date as date,
    COALESCE(dx.xp_earned, 0) as daily_xp,
    COALESCE(
      SUM(dx.xp_earned) OVER (ORDER BY ds.series_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW),
      0
    )::integer as cumulative_xp
  FROM date_series ds
  LEFT JOIN daily_xp dx ON dx.xp_date = ds.series_date
  ORDER BY ds.series_date;
END;
$$;

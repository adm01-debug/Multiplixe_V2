-- Create user streaks table
CREATE TABLE public.user_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  streak_started_at TIMESTAMP WITH TIME ZONE,
  total_streak_days INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

-- Policies for user_streaks
CREATE POLICY "Users can view their own streaks" 
ON public.user_streaks FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streaks" 
ON public.user_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streaks" 
ON public.user_streaks FOR UPDATE USING (auth.uid() = user_id);

-- Function to update streak and award XP
CREATE OR REPLACE FUNCTION public.update_user_streak(p_user_id UUID)
RETURNS TABLE(
  streak_updated BOOLEAN,
  new_streak INTEGER,
  xp_awarded INTEGER,
  is_new_record BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_streak public.user_streaks;
  v_today DATE := CURRENT_DATE;
  v_yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
  v_streak_updated BOOLEAN := FALSE;
  v_new_streak INTEGER := 0;
  v_xp_awarded INTEGER := 0;
  v_is_new_record BOOLEAN := FALSE;
BEGIN
  -- Get or create user streak record
  SELECT * INTO v_user_streak
  FROM public.user_streaks
  WHERE user_id = p_user_id;

  IF v_user_streak IS NULL THEN
    -- First time user - create record and start streak
    INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, last_activity_date, streak_started_at, total_streak_days)
    VALUES (p_user_id, 1, 1, v_today, now(), 1)
    RETURNING * INTO v_user_streak;
    
    v_streak_updated := TRUE;
    v_new_streak := 1;
    v_xp_awarded := 10; -- Base streak XP
    v_is_new_record := TRUE;
  ELSIF v_user_streak.last_activity_date = v_today THEN
    -- Already logged activity today - no change
    v_streak_updated := FALSE;
    v_new_streak := v_user_streak.current_streak;
  ELSIF v_user_streak.last_activity_date = v_yesterday THEN
    -- Consecutive day - increment streak
    v_new_streak := v_user_streak.current_streak + 1;
    v_is_new_record := v_new_streak > v_user_streak.longest_streak;
    
    UPDATE public.user_streaks
    SET 
      current_streak = v_new_streak,
      longest_streak = GREATEST(longest_streak, v_new_streak),
      last_activity_date = v_today,
      total_streak_days = total_streak_days + 1,
      updated_at = now()
    WHERE user_id = p_user_id;
    
    v_streak_updated := TRUE;
    
    -- Calculate XP bonus based on streak length
    -- Base: 10 XP, +5 XP per streak day (max 50 bonus)
    v_xp_awarded := LEAST(10 + (v_new_streak * 5), 60);
  ELSE
    -- Streak broken - reset to 1
    v_new_streak := 1;
    
    UPDATE public.user_streaks
    SET 
      current_streak = 1,
      last_activity_date = v_today,
      streak_started_at = now(),
      total_streak_days = total_streak_days + 1,
      updated_at = now()
    WHERE user_id = p_user_id;
    
    v_streak_updated := TRUE;
    v_xp_awarded := 10; -- Base streak XP for starting new streak
  END IF;

  -- Award XP if streak was updated
  IF v_streak_updated AND v_xp_awarded > 0 THEN
    PERFORM public.add_user_xp(p_user_id, v_xp_awarded, 'streak');
  END IF;

  RETURN QUERY SELECT v_streak_updated, v_new_streak, v_xp_awarded, v_is_new_record;
END;
$$;

-- Add trigger for updated_at
CREATE TRIGGER update_user_streaks_updated_at
BEFORE UPDATE ON public.user_streaks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
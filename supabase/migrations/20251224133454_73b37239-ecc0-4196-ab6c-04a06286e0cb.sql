-- Create user_xp table to track user experience points
CREATE TABLE public.user_xp (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  total_xp INTEGER NOT NULL DEFAULT 0,
  current_level INTEGER NOT NULL DEFAULT 1,
  xp_from_lessons INTEGER NOT NULL DEFAULT 0,
  xp_from_courses INTEGER NOT NULL DEFAULT 0,
  xp_from_streaks INTEGER NOT NULL DEFAULT 0,
  xp_from_achievements INTEGER NOT NULL DEFAULT 0,
  last_xp_earned_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_xp ENABLE ROW LEVEL SECURITY;

-- Create policies for user_xp
CREATE POLICY "Users can view their own XP"
ON public.user_xp
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own XP"
ON public.user_xp
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own XP"
ON public.user_xp
FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_xp_updated_at
BEFORE UPDATE ON public.user_xp
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to add XP to user
CREATE OR REPLACE FUNCTION public.add_user_xp(
  p_user_id UUID,
  p_amount INTEGER,
  p_source TEXT DEFAULT 'general'
)
RETURNS public.user_xp
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_xp public.user_xp;
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
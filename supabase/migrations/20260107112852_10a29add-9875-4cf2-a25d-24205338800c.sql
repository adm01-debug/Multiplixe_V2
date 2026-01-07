-- Create daily_challenges table
CREATE TABLE public.daily_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  challenge_type TEXT NOT NULL, -- 'watch_lessons', 'complete_quiz', 'study_minutes', 'earn_xp'
  target_value INTEGER NOT NULL DEFAULT 1,
  xp_reward INTEGER NOT NULL DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  day_of_week INTEGER, -- NULL = every day, 0-6 = specific day
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_daily_challenge_progress table
CREATE TABLE public.user_daily_challenge_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  challenge_id UUID NOT NULL REFERENCES public.daily_challenges(id) ON DELETE CASCADE,
  challenge_date DATE NOT NULL DEFAULT CURRENT_DATE,
  current_progress INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  xp_claimed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id, challenge_date)
);

-- Enable RLS
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_challenge_progress ENABLE ROW LEVEL SECURITY;

-- Policies for daily_challenges (read-only for all authenticated users)
CREATE POLICY "Anyone can view active challenges" 
ON public.daily_challenges 
FOR SELECT 
USING (is_active = true);

-- Policies for user_daily_challenge_progress
CREATE POLICY "Users can view their own challenge progress" 
ON public.user_daily_challenge_progress 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own challenge progress" 
ON public.user_daily_challenge_progress 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own challenge progress" 
ON public.user_daily_challenge_progress 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Insert default daily challenges
INSERT INTO public.daily_challenges (title, description, challenge_type, target_value, xp_reward) VALUES
('Estudante Dedicado', 'Assista 3 aulas hoje', 'watch_lessons', 3, 75),
('Mestre dos Quizzes', 'Complete 1 quiz com aprovação', 'complete_quiz', 1, 100),
('Maratonista', 'Estude por 30 minutos', 'study_minutes', 30, 50),
('Colecionador de XP', 'Ganhe 100 XP hoje', 'earn_xp', 100, 50),
('Primeira Vitória', 'Complete 1 aula hoje', 'watch_lessons', 1, 25);

-- Create function to claim daily challenge reward
CREATE OR REPLACE FUNCTION public.claim_daily_challenge_reward(
  p_user_id UUID,
  p_progress_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_progress RECORD;
  v_challenge RECORD;
  v_result JSON;
BEGIN
  -- Get progress record
  SELECT * INTO v_progress
  FROM user_daily_challenge_progress
  WHERE id = p_progress_id AND user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Progress not found');
  END IF;
  
  IF v_progress.xp_claimed THEN
    RETURN json_build_object('success', false, 'error', 'Already claimed');
  END IF;
  
  IF NOT v_progress.is_completed THEN
    RETURN json_build_object('success', false, 'error', 'Challenge not completed');
  END IF;
  
  -- Get challenge for XP reward
  SELECT * INTO v_challenge
  FROM daily_challenges
  WHERE id = v_progress.challenge_id;
  
  -- Mark as claimed
  UPDATE user_daily_challenge_progress
  SET xp_claimed = true, updated_at = now()
  WHERE id = p_progress_id;
  
  -- Add XP to user
  PERFORM add_user_xp(v_challenge.xp_reward, 'daily_challenge', p_user_id);
  
  RETURN json_build_object(
    'success', true, 
    'xp_earned', v_challenge.xp_reward,
    'challenge_title', v_challenge.title
  );
END;
$$;
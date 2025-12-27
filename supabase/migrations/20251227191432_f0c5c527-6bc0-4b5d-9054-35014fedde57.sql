-- Tabela para sessões Pomodoro
CREATE TABLE public.pomodoro_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('work', 'break')),
  duration_minutes INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  xp_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own pomodoro sessions"
ON public.pomodoro_sessions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pomodoro sessions"
ON public.pomodoro_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Índice para consultas
CREATE INDEX idx_pomodoro_sessions_user_id ON public.pomodoro_sessions(user_id);
CREATE INDEX idx_pomodoro_sessions_completed_at ON public.pomodoro_sessions(completed_at);

-- Função para completar sessão Pomodoro e ganhar XP
CREATE OR REPLACE FUNCTION public.complete_pomodoro_session(
  p_user_id UUID,
  p_session_type TEXT,
  p_duration_minutes INTEGER
)
RETURNS TABLE (
  session_id UUID,
  xp_earned INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id UUID;
  v_xp_earned INTEGER;
BEGIN
  -- Calcular XP: 10 XP por sessão de trabalho, 0 para pausas
  IF p_session_type = 'work' THEN
    v_xp_earned := 10;
  ELSE
    v_xp_earned := 0;
  END IF;

  -- Inserir sessão
  INSERT INTO pomodoro_sessions (user_id, session_type, duration_minutes, xp_earned)
  VALUES (p_user_id, p_session_type, p_duration_minutes, v_xp_earned)
  RETURNING id INTO v_session_id;

  -- Adicionar XP se for sessão de trabalho
  IF v_xp_earned > 0 THEN
    PERFORM add_user_xp(p_user_id, v_xp_earned, 'pomodoro');
  END IF;

  RETURN QUERY SELECT v_session_id, v_xp_earned;
END;
$$;

-- Adicionar conquistas de Pomodoro
INSERT INTO achievements (slug, name, description, icon, category, requirement_type, requirement_value, xp_reward, gradient)
VALUES
  ('pomodoro_first', 'Primeiro Foco', 'Complete sua primeira sessão Pomodoro', 'Timer', 'focus', 'pomodoro_sessions', 1, 25, 'from-red-500 to-orange-500'),
  ('pomodoro_10', 'Estudante Focado', 'Complete 10 sessões Pomodoro', 'Clock', 'focus', 'pomodoro_sessions', 10, 100, 'from-orange-500 to-yellow-500'),
  ('pomodoro_50', 'Mestre do Foco', 'Complete 50 sessões Pomodoro', 'Target', 'focus', 'pomodoro_sessions', 50, 300, 'from-yellow-500 to-green-500'),
  ('pomodoro_100', 'Zen Master', 'Complete 100 sessões Pomodoro', 'Zap', 'focus', 'pomodoro_sessions', 100, 500, 'from-green-500 to-emerald-500')
ON CONFLICT (slug) DO NOTHING;
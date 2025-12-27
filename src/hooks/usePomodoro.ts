import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export type PomodoroState = 'idle' | 'work' | 'break' | 'paused';

interface PomodoroStats {
  todaySessions: number;
  totalSessions: number;
  totalXpEarned: number;
}

export const usePomodoro = () => {
  const { user } = useAuth();
  const [state, setState] = useState<PomodoroState>('idle');
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [stats, setStats] = useState<PomodoroStats>({ todaySessions: 0, totalSessions: 0, totalXpEarned: 0 });
  const [isFocusMode, setIsFocusMode] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousState = useRef<PomodoroState>('idle');

  const WORK_DURATION = 25 * 60; // 25 minutes
  const BREAK_DURATION = 5 * 60; // 5 minutes

  // Fetch stats
  const fetchStats = useCallback(async () => {
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from('pomodoro_sessions')
      .select('*')
      .eq('user_id', user.id);

    if (data) {
      const todaySessions = data.filter(s => 
        s.session_type === 'work' && new Date(s.completed_at) >= today
      ).length;
      const totalSessions = data.filter(s => s.session_type === 'work').length;
      const totalXpEarned = data.reduce((sum, s) => sum + s.xp_earned, 0);

      setStats({ todaySessions, totalSessions, totalXpEarned });
    }
  }, [user]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Timer logic
  useEffect(() => {
    if (state === 'work' || state === 'break') {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state]);

  const handleSessionComplete = async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const completedType = state === 'work' ? 'work' : 'break';
    const duration = completedType === 'work' ? 25 : 5;

    // Play notification sound
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch {}

    if (user && completedType === 'work') {
      const { data, error } = await supabase.rpc('complete_pomodoro_session', {
        p_user_id: user.id,
        p_session_type: completedType,
        p_duration_minutes: duration
      });

      if (!error && data && data[0]) {
        toast.success(`🍅 Sessão completada! +${data[0].xp_earned} XP`, {
          description: 'Hora de uma pausa de 5 minutos!'
        });
        setSessionsCompleted(prev => prev + 1);
        fetchStats();
      }
    }

    // Auto transition
    if (completedType === 'work') {
      setState('break');
      setTimeLeft(BREAK_DURATION);
    } else {
      toast.info('⏰ Pausa terminada!', {
        description: 'Pronto para mais uma sessão de foco?'
      });
      setState('idle');
      setTimeLeft(WORK_DURATION);
    }
  };

  const startWork = useCallback(() => {
    setState('work');
    setTimeLeft(WORK_DURATION);
    setIsFocusMode(true);
  }, []);

  const startBreak = useCallback(() => {
    setState('break');
    setTimeLeft(BREAK_DURATION);
  }, []);

  const pause = useCallback(() => {
    previousState.current = state;
    setState('paused');
  }, [state]);

  const resume = useCallback(() => {
    setState(previousState.current);
  }, []);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setState('idle');
    setTimeLeft(WORK_DURATION);
    setIsFocusMode(false);
  }, []);

  const toggleFocusMode = useCallback(() => {
    setIsFocusMode(prev => !prev);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    const total = state === 'work' ? WORK_DURATION : BREAK_DURATION;
    return ((total - timeLeft) / total) * 100;
  };

  return {
    state,
    timeLeft,
    formattedTime: formatTime(timeLeft),
    progress: getProgress(),
    sessionsCompleted,
    stats,
    isFocusMode,
    startWork,
    startBreak,
    pause,
    resume,
    stop,
    toggleFocusMode
  };
};

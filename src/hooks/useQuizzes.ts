import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserXP } from '@/hooks/useUserXP';
import { toast } from 'sonner';

interface QuizOption {
  id: string;
  option_text: string;
  order_index: number;
}

interface QuizQuestion {
  id: string;
  question_text: string;
  explanation: string | null;
  order_index: number;
  quiz_options: QuizOption[];
}

interface Quiz {
  id: string;
  lesson_id: string | null;
  course_id: string | null;
  title: string;
  description: string | null;
  passing_score: number;
  xp_reward: number;
  time_limit_seconds: number | null;
  cooldown_hours: number;
  quiz_questions: QuizQuestion[];
}

interface QuizAttempt {
  id: string;
  quiz_id: string;
  score: number;
  total_questions: number;
  passed: boolean;
  xp_earned: number;
  completed_at: string;
}

export const useQuizzes = () => {
  const { user } = useAuth();
  const { addXP } = useUserXP();
  const [loading, setLoading] = useState(false);

  const fetchQuizWithFilter = useCallback(async (
    filter: (q: ReturnType<typeof supabase.from<'quizzes'>>['select']) => unknown
  ): Promise<Quiz | null> => {
    return null;
  }, []);

  const loadQuizBy = async (column: 'lesson_id' | 'course_id', value: string, courseOnly = false): Promise<Quiz | null> => {
    let query = supabase.from('quizzes').select('*').eq(column, value);
    if (courseOnly) query = query.is('lesson_id', null);
    const { data: quizRow, error } = await query.maybeSingle();
    if (error || !quizRow) return null;

    const { data: questions } = await supabase
      .from('quiz_questions')
      .select('id, quiz_id, question_text, explanation, order_index, created_at')
      .eq('quiz_id', quizRow.id)
      .order('order_index');

    const questionIds = (questions || []).map(q => q.id);
    const { data: options } = questionIds.length > 0
      ? await supabase
          .from('quiz_options_public' as never)
          .select('id, question_id, option_text, order_index')
          .in('question_id', questionIds)
          .order('order_index')
      : { data: [] as Array<{ id: string; question_id: string; option_text: string; order_index: number }> };

    const optsByQ = (options || []).reduce<Record<string, QuizOption[]>>((acc, o) => {
      const opt = o as { id: string; question_id: string; option_text: string; order_index: number };
      (acc[opt.question_id] ||= []).push({
        id: opt.id,
        option_text: opt.option_text,
        order_index: opt.order_index,
      });
      return acc;
    }, {});

    return {
      ...quizRow,
      quiz_questions: (questions || []).map(q => ({
        id: q.id,
        question_text: q.question_text,
        explanation: q.explanation,
        order_index: q.order_index,
        quiz_options: (optsByQ[q.id] || []).sort((a, b) => a.order_index - b.order_index),
      })),
    } as Quiz;
  };

  const fetchQuizForLesson = useCallback(async (lessonId: string): Promise<Quiz | null> => {
    return loadQuizBy('lesson_id', lessonId);
  }, []);

  const fetchQuizForCourse = useCallback(async (courseId: string): Promise<Quiz | null> => {
    return loadQuizBy('course_id', courseId, true);
  }, []);

  const fetchUserAttempts = useCallback(async (quizId: string): Promise<QuizAttempt[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('user_quiz_attempts')
        .select('*')
        .eq('user_id', user.id)
        .eq('quiz_id', quizId)
        .order('completed_at', { ascending: false });

      if (error) {
        return [];
      }

      return data || [];
    } catch {
      return [];
    }
  }, [user]);

  const submitQuizAttempt = useCallback(async (
    quiz: Quiz,
    answers: Record<string, string>
  ): Promise<{ score: number; passed: boolean; xpEarned: number } | null> => {
    if (!user) {
      toast.error('Você precisa estar logado para fazer o quiz');
      return null;
    }

    setLoading(true);
    try {
      // Server-side validation via RPC (no gabarito on client)
      const answersPayload = Object.entries(answers).map(([question_id, option_id]) => ({
        question_id,
        option_id,
      }));

      const { data: rpcData, error: rpcError } = await supabase.rpc('submit_quiz_attempt', {
        p_quiz_id: quiz.id,
        p_answers: answersPayload,
      });

      if (rpcError || !rpcData || rpcData.length === 0) {
        toast.error('Erro ao validar quiz');
        return null;
      }

      const result = rpcData[0];
      const scorePercentage = result.score;
      const passed = result.passed;
      const totalQuestions = result.total_questions;

      let xpEarned = 0;
      if (passed) {
        const previousAttempts = await fetchUserAttempts(quiz.id);
        const hasPreviouslyPassed = previousAttempts.some(a => a.passed);
        if (!hasPreviouslyPassed) {
          xpEarned = quiz.xp_reward;
          await addXP(xpEarned, 'achievement');
        }
      }

      const { error } = await supabase
        .from('user_quiz_attempts')
        .insert({
          user_id: user.id,
          quiz_id: quiz.id,
          score: scorePercentage,
          total_questions: totalQuestions,
          passed,
          xp_earned: xpEarned,
          answers,
        });

      if (error) {
        toast.error('Erro ao salvar tentativa');
        return null;
      }

      return { score: scorePercentage, passed, xpEarned };
    } catch {
      toast.error('Erro ao processar quiz');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, addXP, fetchUserAttempts]);

  return {
    loading,
    fetchQuizForLesson,
    fetchQuizForCourse,
    fetchUserAttempts,
    submitQuizAttempt
  };
};

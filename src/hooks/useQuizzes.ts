import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserXP } from '@/hooks/useUserXP';
import { toast } from 'sonner';
import type { QuizReviewPayload } from '@/lib/quizReview';
import { applyAdaptivePlan, type AdaptiveQuizPlan, type QuizDifficultyGrade } from '@/lib/quizAdaptive';

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
  difficulty_level: string | null;
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
  /** Plano adaptativo da tentativa (null quando o servidor não respondeu). */
  adaptive_plan?: AdaptiveQuizPlan | null;
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
  // loadQuizBy é chamado por callbacks com identidade estável; sem o ref, o
  // usuário capturado seria o do primeiro render (ainda sem sessão).
  const userRef = useRef(user);
  userRef.current = user;

  const loadQuizBy = async (column: 'lesson_id' | 'course_id', value: string, courseOnly = false): Promise<Quiz | null> => {
    let query = supabase.from('quizzes').select('*').eq(column, value);
    if (courseOnly) query = query.is('lesson_id', null);
    const { data: quizRow, error } = await query.maybeSingle();
    if (error || !quizRow) return null;

    const { data: questions } = await supabase
      .from('quiz_questions')
      .select('id, quiz_id, question_text, explanation, order_index, difficulty_level, created_at')
      .eq('quiz_id', quizRow.id)
      .order('order_index');

    const questionIds = (questions || []).map(q => q.id);
    // A view quiz_options_public ignorava a RLS (rodava como dona) e vazava as opcoes
    // de qualquer quiz; a leitura agora e pela RPC, que devolve so as colunas de exibicao.
    const { data: options } = questionIds.length > 0
      ? await supabase.rpc('get_quiz_options_publicas' as never, {
          p_question_ids: questionIds,
        } as never)
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

    // FUNC-020: o servidor decide o nível alvo da próxima tentativa pelo
    // desempenho anterior. Sem resposta (ou sem login) segue o quiz inteiro.
    let adaptivePlan: AdaptiveQuizPlan | null = null;
    if (userRef.current) {
      try {
        const { data: planData, error: planError } = await supabase.rpc('get_adaptive_quiz_plan', {
          p_quiz_id: quizRow.id,
        });
        if (!planError && planData) adaptivePlan = planData as unknown as AdaptiveQuizPlan;
      } catch {
        adaptivePlan = null;
      }
    }

    const orderedQuestions = applyAdaptivePlan(
      (questions || []).map(q => ({
        id: q.id,
        question_text: q.question_text,
        explanation: q.explanation,
        order_index: q.order_index,
        difficulty_level: (q as { difficulty_level?: string | null }).difficulty_level ?? null,
        quiz_options: (optsByQ[q.id] || []).sort((a, b) => a.order_index - b.order_index),
      })),
      adaptivePlan
    );

    return {
      ...quizRow,
      quiz_questions: orderedQuestions,
      adaptive_plan: adaptivePlan,
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
  ): Promise<{
    score: number;
    passed: boolean;
    xpEarned: number;
    attemptId?: string;
    weightedScore?: number;
    xpBonus?: number;
    byDifficulty?: Record<string, QuizDifficultyGrade>;
    recommendedDifficulty?: string;
  } | null> => {
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

      const result = rpcData[0] as unknown as {
        score: number;
        passed: boolean;
        total_questions: number;
        weighted_score?: number | null;
        xp_bonus?: number | null;
        by_difficulty?: Record<string, QuizDifficultyGrade> | null;
        recommended_difficulty?: string | null;
      };
      const scorePercentage = result.score;
      const passed = result.passed;
      const totalQuestions = result.total_questions;
      const weightedScore = result.weighted_score ?? undefined;
      const xpBonus = result.xp_bonus ?? 0;
      const byDifficulty = result.by_difficulty ?? undefined;
      const recommendedDifficulty = result.recommended_difficulty ?? undefined;

      let xpEarned = 0;
      if (passed) {
        const previousAttempts = await fetchUserAttempts(quiz.id);
        const hasPreviouslyPassed = previousAttempts.some(a => a.passed);
        if (!hasPreviouslyPassed) {
          xpEarned = quiz.xp_reward + xpBonus;
          await addXP(xpEarned, 'achievement');
        }
      }

      const { data: savedAttempt, error } = await supabase
        .from('user_quiz_attempts')
        .insert({
          user_id: user.id,
          quiz_id: quiz.id,
          score: scorePercentage,
          total_questions: totalQuestions,
          passed,
          xp_earned: xpEarned,
          answers,
          weighted_score: weightedScore ?? null,
          difficulty_level: quiz.adaptive_plan?.target_difficulty ?? null,
          by_difficulty: byDifficulty ?? null,
        })
              .select('id')
              .single();

            if (error || !savedAttempt) {
        toast.error('Erro ao salvar tentativa');
        return null;
      }

            return {
              score: scorePercentage,
              passed,
              xpEarned,
              attemptId: savedAttempt.id,
              weightedScore,
              xpBonus,
              byDifficulty,
              recommendedDifficulty,
            };
    } catch {
      toast.error('Erro ao processar quiz');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, addXP, fetchUserAttempts]);

        const fetchQuizReview = useCallback(async (attemptId: string): Promise<QuizReviewPayload | null> => {
          try {
            const { data, error } = await supabase.rpc('get_quiz_review', { p_attempt_id: attemptId });
            if (error || !data) return null;
            return data as unknown as QuizReviewPayload;
          } catch {
            return null;
          }
        }, []);

  return {
    loading,
    fetchQuizForLesson,
    fetchQuizForCourse,
    fetchUserAttempts,
          submitQuizAttempt,
          fetchQuizReview
  };
};

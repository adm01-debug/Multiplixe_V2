import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserXP } from '@/hooks/useUserXP';
import { toast } from 'sonner';

interface QuizOption {
  id: string;
  option_text: string;
  is_correct: boolean;
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

  const fetchQuizForLesson = useCallback(async (lessonId: string): Promise<Quiz | null> => {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          *,
          quiz_questions (
            *,
            quiz_options (*)
          )
        `)
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (error) {
        return null;
      }

      if (!data) return null;

      // Sort questions and options by order_index
      const quiz = data as Quiz;
      quiz.quiz_questions = quiz.quiz_questions
        .sort((a, b) => a.order_index - b.order_index)
        .map(q => ({
          ...q,
          quiz_options: q.quiz_options.sort((a, b) => a.order_index - b.order_index)
        }));

      return quiz;
    } catch {
      return null;
    }
  }, []);

  const fetchQuizForCourse = useCallback(async (courseId: string): Promise<Quiz | null> => {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          *,
          quiz_questions (
            *,
            quiz_options (*)
          )
        `)
        .eq('course_id', courseId)
        .is('lesson_id', null)
        .maybeSingle();

      if (error) {
        return null;
      }

      if (!data) return null;

      const quiz = data as Quiz;
      quiz.quiz_questions = quiz.quiz_questions
        .sort((a, b) => a.order_index - b.order_index)
        .map(q => ({
          ...q,
          quiz_options: q.quiz_options.sort((a, b) => a.order_index - b.order_index)
        }));

      return quiz;
    } catch {
      return null;
    }
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
      // Calculate score
      let correctAnswers = 0;
      const totalQuestions = quiz.quiz_questions.length;

      quiz.quiz_questions.forEach(question => {
        const selectedOptionId = answers[question.id];
        const correctOption = question.quiz_options.find(opt => opt.is_correct);
        if (correctOption && selectedOptionId === correctOption.id) {
          correctAnswers++;
        }
      });

      const scorePercentage = Math.round((correctAnswers / totalQuestions) * 100);
      const passed = scorePercentage >= quiz.passing_score;
      
      // Only award XP if passed and it's the first time passing
      let xpEarned = 0;
      if (passed) {
        const previousAttempts = await fetchUserAttempts(quiz.id);
        const hasPreviouslyPassed = previousAttempts.some(a => a.passed);
        
        if (!hasPreviouslyPassed) {
          xpEarned = quiz.xp_reward;
          await addXP(xpEarned, 'achievement');
        }
      }

      // Save attempt
      const { error } = await supabase
        .from('user_quiz_attempts')
        .insert({
          user_id: user.id,
          quiz_id: quiz.id,
          score: scorePercentage,
          total_questions: totalQuestions,
          passed,
          xp_earned: xpEarned,
          answers
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

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type {
  PeriodFilter,
  QuizOption,
  CategoryOption,
  CourseQuizStat,
  DailyStats,
  QuizRanking,
  QuizWithCourse,
  PerformanceAlert,
  OverallStats,
} from './types';

export const useQuizStatsData = () => {
  const [stats, setStats] = useState<CourseQuizStat[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [rankings, setRankings] = useState<QuizRanking[]>([]);
  const [alertHistory, setAlertHistory] = useState<PerformanceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>(30);
  const [selectedQuizId, setSelectedQuizId] = useState<string>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [quizOptions, setQuizOptions] = useState<QuizOption[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [overallStats, setOverallStats] = useState<OverallStats>({
    totalAttempts: 0,
    totalPassed: 0,
    averageScore: 0,
    overallPassingRate: 0
  });

  useEffect(() => {
    const fetchQuizStats = async () => {
      setLoading(true);
      try {
        const { data: categories } = await supabase
          .from('categories')
          .select('id, name')
          .order('name');

        if (categories) setCategoryOptions(categories);

        const { data: quizzes } = await supabase
          .from('quizzes')
          .select(`id, title, course_id, courses (id, title, category_id)`)
          .not('course_id', 'is', null);

        if (!quizzes) { setLoading(false); return; }

        const typedQuizzes = quizzes as QuizWithCourse[];
        const options: QuizOption[] = typedQuizzes
          .filter(q => q.courses)
          .map(q => ({
            id: q.id,
            title: q.title,
            courseTitle: q.courses?.title || 'Curso desconhecido',
            categoryId: q.courses?.category_id || null
          }));
        setQuizOptions(options);

        const { data: attempts } = await supabase
          .from('user_quiz_attempts')
          .select('quiz_id, user_id, score, passed, completed_at')
          .order('completed_at', { ascending: true });

        if (!attempts) { setLoading(false); return; }

        const quizIdsInCategory = selectedCategoryId === 'all'
          ? typedQuizzes.map(q => q.id)
          : typedQuizzes.filter(q => q.courses?.category_id === selectedCategoryId).map(q => q.id);

        const filteredAttempts = attempts.filter(a => {
          const matchesQuiz = selectedQuizId === 'all' || a.quiz_id === selectedQuizId;
          const matchesCategory = quizIdsInCategory.includes(a.quiz_id);
          return matchesQuiz && matchesCategory;
        });

        // Daily stats
        const periodDays = periodFilter;
        const dailyMap = new Map<string, { attempts: number; passed: number; totalScore: number }>();
        for (let i = 0; i < periodDays; i++) {
          const date = new Date();
          date.setDate(date.getDate() - (periodDays - 1 - i));
          dailyMap.set(date.toISOString().split('T')[0], { attempts: 0, passed: 0, totalScore: 0 });
        }
        filteredAttempts.forEach(attempt => {
          const dateStr = attempt.completed_at.split('T')[0];
          if (dailyMap.has(dateStr)) {
            const current = dailyMap.get(dateStr)!;
            current.attempts++;
            if (attempt.passed) current.passed++;
            current.totalScore += attempt.score;
          }
        });
        setDailyStats(Array.from(dailyMap.entries()).map(([date, data]) => ({
          date,
          displayDate: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          attempts: data.attempts,
          passed: data.passed,
          passingRate: data.attempts > 0 ? Math.round((data.passed / data.attempts) * 100) : 0,
          averageScore: data.attempts > 0 ? Math.round(data.totalScore / data.attempts) : 0
        })));

        // Profiles for rankings
        const { data: profiles } = await supabase.from('profiles').select('user_id, full_name, avatar_url');
        const profileMap = new Map((profiles || []).map(p => [p.user_id, { name: p.full_name, avatar: p.avatar_url }]));

        const filteredQuizzes = typedQuizzes.filter(q => {
          if (!q.courses) return false;
          const matchesQuiz = selectedQuizId === 'all' || q.id === selectedQuizId;
          const matchesCategory = selectedCategoryId === 'all' || q.courses?.category_id === selectedCategoryId;
          return matchesQuiz && matchesCategory;
        });

        // Aggregate quiz attempts by course (multiple quizzes per course → one entry per course)
        const courseMap = new Map<string, { quizIds: string[]; courseTitle: string; attempts: typeof attempts }>();
        filteredQuizzes.forEach(quiz => {
          if (!courseMap.has(quiz.course_id!)) {
            courseMap.set(quiz.course_id!, { quizIds: [], courseTitle: quiz.courses?.title || 'Curso desconhecido', attempts: [] });
          }
          const entry = courseMap.get(quiz.course_id!)!;
          entry.quizIds.push(quiz.id);
          const quizTitle = quiz.title;
          const quizAttempts = attempts.filter(a => a.quiz_id === quiz.id).map(a => ({ ...a, quizTitle }));
          entry.attempts.push(...quizAttempts);
        });

        const courseStats: CourseQuizStat[] = Array.from(courseMap.entries()).map(([courseId, entry]) => {
          const allAttempts = entry.attempts;
          const passedAttempts = allAttempts.filter((a: typeof attempts[0]) => a.passed).length;
          const uniqueUsers = new Set(allAttempts.map((a: typeof attempts[0]) => a.user_id)).size;
          const averageScore = allAttempts.length > 0
            ? Math.round(allAttempts.reduce((sum: number, a: typeof attempts[0]) => sum + a.score, 0) / allAttempts.length) : 0;
          const passingRate = allAttempts.length > 0
            ? Math.round((passedAttempts / allAttempts.length) * 100) : 0;
          return {
            courseId,
            courseTitle: entry.courseTitle,
            quizTitle: entry.quizIds.length > 1 ? `${entry.quizIds.length} quizzes` : (allAttempts[0] as typeof attempts[0] & { quizTitle: string }).quizTitle || '',
            quizId: entry.quizIds[0] || '',
            totalAttempts: allAttempts.length,
            passedAttempts,
            uniqueUsers,
            averageScore,
            passingRate
          };
        }).sort((a, b) => b.totalAttempts - a.totalAttempts);

        const quizRankings: QuizRanking[] = filteredQuizzes.map(quiz => {
          const quizAttempts = attempts.filter(a => a.quiz_id === quiz.id);
          const userBestScores = new Map<string, { bestScore: number; attemptCount: number }>();
          quizAttempts.forEach(attempt => {
            const existing = userBestScores.get(attempt.user_id);
            if (!existing || attempt.score > existing.bestScore) {
              userBestScores.set(attempt.user_id, { bestScore: attempt.score, attemptCount: (existing?.attemptCount || 0) + 1 });
            } else {
              userBestScores.set(attempt.user_id, { ...existing, attemptCount: existing.attemptCount + 1 });
            }
          });
          return {
            quizId: quiz.id,
            quizTitle: quiz.title,
            courseTitle: quiz.courses?.title || 'Curso desconhecido',
            topUsers: Array.from(userBestScores.entries()).map(([userId, data]) => {
              const profile = profileMap.get(userId);
              return { userId, userName: profile?.name || 'Usuário Anônimo', avatarUrl: profile?.avatar || null, ...data };
            }).sort((a, b) => b.bestScore - a.bestScore).slice(0, 5)
          };
        }).filter(r => r.topUsers.length > 0);

        setStats(courseStats);
        setRankings(quizRankings);

        const totalAttempts = filteredAttempts.length;
        const totalPassed = filteredAttempts.filter(a => a.passed).length;
        setOverallStats({
          totalAttempts,
          totalPassed,
          averageScore: totalAttempts > 0 ? Math.round(filteredAttempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts) : 0,
          overallPassingRate: totalAttempts > 0 ? Math.round((totalPassed / totalAttempts) * 100) : 0
        });
      } catch { /* Silent fail */ } finally { setLoading(false); }
    };
    fetchQuizStats();
  }, [periodFilter, selectedQuizId, selectedCategoryId]);

  useEffect(() => {
    const fetchAlertHistory = async () => {
      try {
        const { data: alerts } = await supabase
          .from('quiz_performance_alerts')
          .select(`*, quizzes (title, courses (title))`)
          .order('created_at', { ascending: false })
          .limit(50);
        if (alerts) {
          const mapped: PerformanceAlert[] = alerts.map((alert: unknown) => {
            const a = alert as Record<string, unknown>;
            const quizzes = a.quizzes as Record<string, unknown> | null;
            const courses = quizzes?.courses as Record<string, unknown> | null;
            return {
              id: a.id as string, quiz_id: a.quiz_id as string, alert_type: a.alert_type as string,
              passing_rate: a.passing_rate as number, total_attempts: a.total_attempts as number,
              passed_attempts: a.passed_attempts as number, threshold: a.threshold as number,
              is_resolved: a.is_resolved as boolean, resolved_at: a.resolved_at as string | null,
              notes: a.notes as string | null, created_at: a.created_at as string,
              quizTitle: (quizzes?.title as string) || 'Quiz desconhecido',
              courseTitle: (courses?.title as string) || 'Curso desconhecido',
            };
          });
          setAlertHistory(mapped);
        }
      } catch { /* Silent fail */ }
    };
    fetchAlertHistory();
  }, []);

  const registerAlert = async (quiz: CourseQuizStat) => {
    try {
      const { data: existingAlert } = await supabase
        .from('quiz_performance_alerts').select('id').eq('quiz_id', quiz.quizId).eq('is_resolved', false).maybeSingle();
      if (existingAlert) { toast.info('Já existe um alerta ativo para este quiz'); return; }
      const { error } = await supabase.from('quiz_performance_alerts').insert({
        quiz_id: quiz.quizId, alert_type: 'low_passing_rate',
        passing_rate: quiz.passingRate, total_attempts: quiz.totalAttempts,
        passed_attempts: quiz.passedAttempts, threshold: 50
      });
      if (error) throw error;
      toast.success('Alerta registrado no histórico');
      // Refresh alerts
      const { data: alerts } = await supabase.from('quiz_performance_alerts')
        .select(`*, quizzes (title, courses (title))`).order('created_at', { ascending: false }).limit(50);
      if (alerts) {
        const mapped: PerformanceAlert[] = alerts.map((al: unknown) => {
          const a = al as Record<string, unknown>;
          const q = a.quizzes as Record<string, unknown> | null;
          const c = q?.courses as Record<string, unknown> | null;
          return {
            id: a.id as string, quiz_id: a.quiz_id as string, alert_type: a.alert_type as string,
            passing_rate: a.passing_rate as number, total_attempts: a.total_attempts as number,
            passed_attempts: a.passed_attempts as number, threshold: a.threshold as number,
            is_resolved: a.is_resolved as boolean, resolved_at: a.resolved_at as string | null,
            notes: a.notes as string | null, created_at: a.created_at as string,
            quizTitle: (q?.title as string) || 'Quiz desconhecido',
            courseTitle: (c?.title as string) || 'Curso desconhecido',
          };
        });
        setAlertHistory(mapped);
      }
    } catch { toast.error('Erro ao registrar alerta'); }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase.from('quiz_performance_alerts')
        .update({ is_resolved: true, resolved_at: new Date().toISOString() }).eq('id', alertId);
      if (error) throw error;
      toast.success('Alerta marcado como resolvido');
      setAlertHistory(prev => prev.map(a => a.id === alertId ? { ...a, is_resolved: true, resolved_at: new Date().toISOString() } : a));
    } catch { toast.error('Erro ao resolver alerta'); }
  };

  return {
    stats, dailyStats, rankings, alertHistory, loading,
    periodFilter, setPeriodFilter, selectedQuizId, setSelectedQuizId,
    selectedCategoryId, setSelectedCategoryId, quizOptions, categoryOptions,
    overallStats, registerAlert, resolveAlert
  };
};

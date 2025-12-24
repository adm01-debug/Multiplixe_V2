import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Target, CheckCircle, XCircle, TrendingUp, Users } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface CourseQuizStat {
  courseId: string;
  courseTitle: string;
  quizTitle: string;
  totalAttempts: number;
  passedAttempts: number;
  uniqueUsers: number;
  averageScore: number;
  passingRate: number;
}

export const QuizStats = () => {
  const [stats, setStats] = useState<CourseQuizStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [overallStats, setOverallStats] = useState({
    totalAttempts: 0,
    totalPassed: 0,
    averageScore: 0,
    overallPassingRate: 0
  });

  useEffect(() => {
    const fetchQuizStats = async () => {
      setLoading(true);
      try {
        // Fetch all quizzes with course info
        const { data: quizzes } = await supabase
          .from('quizzes')
          .select(`
            id,
            title,
            course_id,
            courses (
              id,
              title
            )
          `)
          .not('course_id', 'is', null);

        if (!quizzes) {
          setLoading(false);
          return;
        }

        // Fetch all quiz attempts
        const { data: attempts } = await supabase
          .from('user_quiz_attempts')
          .select('quiz_id, user_id, score, passed');

        if (!attempts) {
          setLoading(false);
          return;
        }

        // Calculate stats per course quiz
        const courseStats: CourseQuizStat[] = quizzes
          .filter(q => q.courses)
          .map(quiz => {
            const quizAttempts = attempts.filter(a => a.quiz_id === quiz.id);
            const passedAttempts = quizAttempts.filter(a => a.passed).length;
            const uniqueUsers = new Set(quizAttempts.map(a => a.user_id)).size;
            const averageScore = quizAttempts.length > 0
              ? Math.round(quizAttempts.reduce((sum, a) => sum + a.score, 0) / quizAttempts.length)
              : 0;
            const passingRate = quizAttempts.length > 0
              ? Math.round((passedAttempts / quizAttempts.length) * 100)
              : 0;

            return {
              courseId: quiz.course_id!,
              courseTitle: (quiz.courses as any)?.title || 'Curso desconhecido',
              quizTitle: quiz.title,
              totalAttempts: quizAttempts.length,
              passedAttempts,
              uniqueUsers,
              averageScore,
              passingRate
            };
          })
          .sort((a, b) => b.totalAttempts - a.totalAttempts);

        setStats(courseStats);

        // Calculate overall stats
        const totalAttempts = attempts.length;
        const totalPassed = attempts.filter(a => a.passed).length;
        const averageScore = totalAttempts > 0
          ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts)
          : 0;
        const overallPassingRate = totalAttempts > 0
          ? Math.round((totalPassed / totalAttempts) * 100)
          : 0;

        setOverallStats({
          totalAttempts,
          totalPassed,
          averageScore,
          overallPassingRate
        });
      } catch (error) {
        console.error('Error fetching quiz stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card/80 border border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-5 w-5 text-blue-500" />
            <span className="text-sm text-muted-foreground">Total de Tentativas</span>
          </div>
          <p className="text-2xl font-bold">{overallStats.totalAttempts}</p>
        </div>

        <div className="p-4 rounded-xl bg-card/80 border border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="text-sm text-muted-foreground">Aprovações</span>
          </div>
          <p className="text-2xl font-bold text-green-500">{overallStats.totalPassed}</p>
        </div>

        <div className="p-4 rounded-xl bg-card/80 border border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-amber-500" />
            <span className="text-sm text-muted-foreground">Média Geral</span>
          </div>
          <p className="text-2xl font-bold">{overallStats.averageScore}%</p>
        </div>

        <div className="p-4 rounded-xl bg-card/80 border border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5 text-purple-500" />
            <span className="text-sm text-muted-foreground">Taxa de Aprovação</span>
          </div>
          <p className="text-2xl font-bold">{overallStats.overallPassingRate}%</p>
        </div>
      </div>

      {/* Per Course Stats */}
      <div className="p-6 rounded-2xl bg-card/80 border border-border/50">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Estatísticas por Curso
        </h3>

        {stats.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Nenhuma tentativa de quiz registrada ainda.
          </p>
        ) : (
          <div className="space-y-4">
            {stats.map((stat) => (
              <div
                key={stat.courseId}
                className="p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{stat.courseTitle}</h4>
                    <p className="text-sm text-muted-foreground">{stat.quizTitle}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-bold ${
                      stat.passingRate >= 70 ? 'text-green-500' : 
                      stat.passingRate >= 50 ? 'text-amber-500' : 'text-red-500'
                    }`}>
                      {stat.passingRate}%
                    </span>
                    <p className="text-xs text-muted-foreground">taxa de aprovação</p>
                  </div>
                </div>

                <Progress 
                  value={stat.passingRate} 
                  className="h-2 mb-3"
                />

                <div className="grid grid-cols-4 gap-2 text-sm">
                  <div className="text-center">
                    <p className="font-semibold">{stat.totalAttempts}</p>
                    <p className="text-xs text-muted-foreground">Tentativas</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-green-500">{stat.passedAttempts}</p>
                    <p className="text-xs text-muted-foreground">Aprovados</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-red-500">{stat.totalAttempts - stat.passedAttempts}</p>
                    <p className="text-xs text-muted-foreground">Reprovados</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">{stat.averageScore}%</p>
                    <p className="text-xs text-muted-foreground">Média</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

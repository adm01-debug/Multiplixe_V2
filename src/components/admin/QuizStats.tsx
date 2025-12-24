import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Target, CheckCircle, TrendingUp, Users, Calendar, Trophy, Medal } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type PeriodFilter = 7 | 30 | 90;

interface CourseQuizStat {
  courseId: string;
  courseTitle: string;
  quizTitle: string;
  quizId: string;
  totalAttempts: number;
  passedAttempts: number;
  uniqueUsers: number;
  averageScore: number;
  passingRate: number;
}

interface DailyStats {
  date: string;
  displayDate: string;
  attempts: number;
  passed: number;
  passingRate: number;
  averageScore: number;
}

interface QuizRanking {
  quizId: string;
  quizTitle: string;
  courseTitle: string;
  topUsers: {
    userId: string;
    userName: string;
    avatarUrl: string | null;
    bestScore: number;
    attemptCount: number;
  }[];
}

export const QuizStats = () => {
  const [stats, setStats] = useState<CourseQuizStat[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [rankings, setRankings] = useState<QuizRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>(30);
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

        // Fetch all quiz attempts with date
        const { data: attempts } = await supabase
          .from('user_quiz_attempts')
          .select('quiz_id, user_id, score, passed, completed_at')
          .order('completed_at', { ascending: true });

        if (!attempts) {
          setLoading(false);
          return;
        }

        // Calculate daily stats for the chart based on period filter
        const periodDays = periodFilter;
        const periodAgo = new Date();
        periodAgo.setDate(periodAgo.getDate() - periodDays);
        
        const dailyMap = new Map<string, { attempts: number; passed: number; totalScore: number }>();
        
        // Initialize days based on period
        for (let i = 0; i < periodDays; i++) {
          const date = new Date();
          date.setDate(date.getDate() - (periodDays - 1 - i));
          const dateStr = date.toISOString().split('T')[0];
          dailyMap.set(dateStr, { attempts: 0, passed: 0, totalScore: 0 });
        }
        
        // Aggregate attempts by day
        attempts.forEach(attempt => {
          const dateStr = attempt.completed_at.split('T')[0];
          if (dailyMap.has(dateStr)) {
            const current = dailyMap.get(dateStr)!;
            current.attempts++;
            if (attempt.passed) current.passed++;
            current.totalScore += attempt.score;
          }
        });
        
        // Convert to array for chart
        const dailyStatsArray: DailyStats[] = Array.from(dailyMap.entries()).map(([date, data]) => {
          const dateObj = new Date(date);
          return {
            date,
            displayDate: dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            attempts: data.attempts,
            passed: data.passed,
            passingRate: data.attempts > 0 ? Math.round((data.passed / data.attempts) * 100) : 0,
            averageScore: data.attempts > 0 ? Math.round(data.totalScore / data.attempts) : 0
          };
        });
        
        setDailyStats(dailyStatsArray);

        // Fetch user profiles for rankings
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url');

        const profileMap = new Map(
          (profiles || []).map(p => [p.user_id, { name: p.full_name, avatar: p.avatar_url }])
        );

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
              quizId: quiz.id,
              totalAttempts: quizAttempts.length,
              passedAttempts,
              uniqueUsers,
              averageScore,
              passingRate
            };
          })
          .sort((a, b) => b.totalAttempts - a.totalAttempts);

        // Calculate rankings per quiz
        const quizRankings: QuizRanking[] = quizzes
          .filter(q => q.courses)
          .map(quiz => {
            const quizAttempts = attempts.filter(a => a.quiz_id === quiz.id);
            
            // Group by user and get best score
            const userBestScores = new Map<string, { bestScore: number; attemptCount: number }>();
            quizAttempts.forEach(attempt => {
              const existing = userBestScores.get(attempt.user_id);
              if (!existing || attempt.score > existing.bestScore) {
                userBestScores.set(attempt.user_id, {
                  bestScore: attempt.score,
                  attemptCount: (existing?.attemptCount || 0) + 1
                });
              } else {
                userBestScores.set(attempt.user_id, {
                  ...existing,
                  attemptCount: existing.attemptCount + 1
                });
              }
            });

            // Convert to array and sort by best score
            const topUsers = Array.from(userBestScores.entries())
              .map(([userId, data]) => {
                const profile = profileMap.get(userId);
                return {
                  userId,
                  userName: profile?.name || 'Usuário Anônimo',
                  avatarUrl: profile?.avatar || null,
                  bestScore: data.bestScore,
                  attemptCount: data.attemptCount
                };
              })
              .sort((a, b) => b.bestScore - a.bestScore)
              .slice(0, 5); // Top 5

            return {
              quizId: quiz.id,
              quizTitle: quiz.title,
              courseTitle: (quiz.courses as any)?.title || 'Curso desconhecido',
              topUsers
            };
          })
          .filter(r => r.topUsers.length > 0);

        setStats(courseStats);
        setRankings(quizRankings);

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
  }, [periodFilter]);

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

      {/* Evolution Chart */}
      <div className="p-6 rounded-2xl bg-card/80 border border-border/50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Evolução dos Últimos {periodFilter} Dias
          </h3>
          <Tabs 
            value={periodFilter.toString()} 
            onValueChange={(value) => setPeriodFilter(Number(value) as PeriodFilter)}
            className="w-auto"
          >
            <TabsList className="grid grid-cols-3 w-fit">
              <TabsTrigger value="7" className="px-4">7 dias</TabsTrigger>
              <TabsTrigger value="30" className="px-4">30 dias</TabsTrigger>
              <TabsTrigger value="90" className="px-4">90 dias</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {dailyStats.length === 0 || dailyStats.every(d => d.attempts === 0) ? (
          <p className="text-muted-foreground text-center py-8">
            Nenhum dado disponível para o período.
          </p>
        ) : (
          <div className="space-y-6">
            {/* Passing Rate Chart */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">Taxa de Aprovação (%)</p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyStats}>
                    <defs>
                      <linearGradient id="passingRateGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="displayDate" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={10}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={10}
                      tickLine={false}
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                      formatter={(value: number) => [`${value}%`, 'Taxa de Aprovação']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="passingRate" 
                      stroke="hsl(var(--primary))" 
                      fill="url(#passingRateGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Attempts Chart */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">Tentativas por Dia</p>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="displayDate" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={10}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={10}
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="attempts" 
                      stroke="hsl(217 91% 60%)" 
                      strokeWidth={2}
                      dot={false}
                      name="Tentativas"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="passed" 
                      stroke="hsl(142 76% 36%)" 
                      strokeWidth={2}
                      dot={false}
                      name="Aprovados"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-6 mt-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(217 91% 60%)' }} />
                  <span className="text-muted-foreground">Tentativas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(142 76% 36%)' }} />
                  <span className="text-muted-foreground">Aprovados</span>
                </div>
              </div>
            </div>
          </div>
        )}
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

      {/* Rankings per Quiz */}
      <div className="p-6 rounded-2xl bg-card/80 border border-border/50">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          Ranking por Quiz
        </h3>

        {rankings.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Nenhuma tentativa de quiz registrada ainda.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {rankings.map((ranking) => (
              <div
                key={ranking.quizId}
                className="p-4 rounded-xl bg-muted/30"
              >
                <div className="mb-3">
                  <h4 className="font-medium">{ranking.courseTitle}</h4>
                  <p className="text-sm text-muted-foreground">{ranking.quizTitle}</p>
                </div>

                <div className="space-y-2">
                  {ranking.topUsers.map((user, index) => (
                    <div
                      key={user.userId}
                      className={`flex items-center gap-3 p-2 rounded-lg ${
                        index === 0 ? 'bg-amber-500/10 border border-amber-500/20' :
                        index === 1 ? 'bg-slate-400/10 border border-slate-400/20' :
                        index === 2 ? 'bg-orange-600/10 border border-orange-600/20' :
                        'bg-background/50'
                      }`}
                    >
                      <div className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold">
                        {index === 0 ? (
                          <Medal className="h-5 w-5 text-amber-500" />
                        ) : index === 1 ? (
                          <Medal className="h-5 w-5 text-slate-400" />
                        ) : index === 2 ? (
                          <Medal className="h-5 w-5 text-orange-600" />
                        ) : (
                          <span className="text-muted-foreground">{index + 1}</span>
                        )}
                      </div>

                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatarUrl || undefined} />
                        <AvatarFallback className="text-xs">
                          {user.userName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.userName}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.attemptCount} tentativa{user.attemptCount !== 1 ? 's' : ''}
                        </p>
                      </div>

                      <div className={`text-lg font-bold ${
                        user.bestScore >= 90 ? 'text-green-500' :
                        user.bestScore >= 70 ? 'text-amber-500' : 'text-red-500'
                      }`}>
                        {user.bestScore}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

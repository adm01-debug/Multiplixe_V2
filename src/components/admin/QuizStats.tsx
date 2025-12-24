import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Target, CheckCircle, TrendingUp, Users, Calendar, Trophy, Medal, Download, FileText, FileSpreadsheet, BarChart3, AlertTriangle, XCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Legend, Cell } from 'recharts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type PeriodFilter = 7 | 30 | 90;

interface QuizOption {
  id: string;
  title: string;
  courseTitle: string;
}

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
  const [selectedQuizId, setSelectedQuizId] = useState<string>('all');
  const [quizOptions, setQuizOptions] = useState<QuizOption[]>([]);
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

        // Build quiz options for filter
        const options: QuizOption[] = quizzes
          .filter(q => q.courses)
          .map(q => ({
            id: q.id,
            title: q.title,
            courseTitle: (q.courses as any)?.title || 'Curso desconhecido'
          }));
        setQuizOptions(options);

        // Fetch all quiz attempts with date
        const { data: attempts } = await supabase
          .from('user_quiz_attempts')
          .select('quiz_id, user_id, score, passed, completed_at')
          .order('completed_at', { ascending: true });

        if (!attempts) {
          setLoading(false);
          return;
        }

        // Filter attempts based on selected quiz
        const filteredAttempts = selectedQuizId === 'all' 
          ? attempts 
          : attempts.filter(a => a.quiz_id === selectedQuizId);

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
        
        // Aggregate attempts by day (using filtered attempts)
        filteredAttempts.forEach(attempt => {
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

        // Filter quizzes based on selection
        const filteredQuizzes = selectedQuizId === 'all' 
          ? quizzes.filter(q => q.courses)
          : quizzes.filter(q => q.id === selectedQuizId && q.courses);

        // Calculate stats per course quiz
        const courseStats: CourseQuizStat[] = filteredQuizzes
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
        const quizRankings: QuizRanking[] = filteredQuizzes
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

        // Calculate overall stats (based on filtered attempts)
        const totalAttempts = filteredAttempts.length;
        const totalPassed = filteredAttempts.filter(a => a.passed).length;
        const averageScore = totalAttempts > 0
          ? Math.round(filteredAttempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts)
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
  }, [periodFilter, selectedQuizId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const exportToCSV = () => {
    try {
      // Header
      const headers = ['Curso', 'Quiz', 'Tentativas', 'Aprovações', 'Reprovações', 'Usuários Únicos', 'Média (%)', 'Taxa Aprovação (%)'];
      
      // Data rows
      const rows = stats.map(stat => [
        stat.courseTitle,
        stat.quizTitle,
        stat.totalAttempts,
        stat.passedAttempts,
        stat.totalAttempts - stat.passedAttempts,
        stat.uniqueUsers,
        stat.averageScore,
        stat.passingRate
      ]);
      
      // Add overall stats at the end
      rows.push([]);
      rows.push(['RESUMO GERAL', '', overallStats.totalAttempts, overallStats.totalPassed, overallStats.totalAttempts - overallStats.totalPassed, '', overallStats.averageScore, overallStats.overallPassingRate]);
      
      // Convert to CSV string
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      // Create and download file
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `estatisticas-quizzes-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('CSV exportado com sucesso!');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Erro ao exportar CSV');
    }
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Title
      doc.setFontSize(18);
      doc.text('Estatísticas de Quizzes', pageWidth / 2, 20, { align: 'center' });
      
      // Date
      doc.setFontSize(10);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, 28, { align: 'center' });
      
      // Overall stats
      doc.setFontSize(14);
      doc.text('Resumo Geral', 14, 40);
      
      doc.setFontSize(10);
      doc.text(`Total de Tentativas: ${overallStats.totalAttempts}`, 14, 50);
      doc.text(`Aprovações: ${overallStats.totalPassed}`, 14, 56);
      doc.text(`Média Geral: ${overallStats.averageScore}%`, 14, 62);
      doc.text(`Taxa de Aprovação: ${overallStats.overallPassingRate}%`, 14, 68);
      
      // Table with course stats
      doc.setFontSize(14);
      doc.text('Estatísticas por Curso', 14, 82);
      
      const tableData = stats.map(stat => [
        stat.courseTitle.length > 25 ? stat.courseTitle.substring(0, 25) + '...' : stat.courseTitle,
        stat.quizTitle.length > 20 ? stat.quizTitle.substring(0, 20) + '...' : stat.quizTitle,
        stat.totalAttempts.toString(),
        stat.passedAttempts.toString(),
        `${stat.averageScore}%`,
        `${stat.passingRate}%`
      ]);
      
      autoTable(doc, {
        startY: 88,
        head: [['Curso', 'Quiz', 'Tentativas', 'Aprovações', 'Média', 'Taxa Aprov.']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 45 },
          1: { cellWidth: 40 },
          2: { cellWidth: 22 },
          3: { cellWidth: 25 },
          4: { cellWidth: 20 },
          5: { cellWidth: 28 }
        }
      });
      
      // Rankings section (new page if needed)
      if (rankings.length > 0) {
        doc.addPage();
        doc.setFontSize(14);
        doc.text('Rankings por Quiz', 14, 20);
        
        let yPos = 30;
        rankings.slice(0, 5).forEach((ranking, idx) => {
          if (yPos > 250) {
            doc.addPage();
            yPos = 20;
          }
          
          doc.setFontSize(11);
          doc.text(`${ranking.quizTitle} - ${ranking.courseTitle}`, 14, yPos);
          yPos += 6;
          
          ranking.topUsers.slice(0, 3).forEach((user, userIdx) => {
            doc.setFontSize(9);
            doc.text(`${userIdx + 1}º ${user.userName}: ${user.bestScore}%`, 20, yPos);
            yPos += 5;
          });
          
          yPos += 6;
        });
      }
      
      // Save PDF
      doc.save(`estatisticas-quizzes-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF exportado com sucesso!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Erro ao exportar PDF');
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters and Export */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtrar por Quiz:</span>
          <Select value={selectedQuizId} onValueChange={setSelectedQuizId}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Todos os quizzes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os quizzes</SelectItem>
              {quizOptions.map((quiz) => (
                <SelectItem key={quiz.id} value={quiz.id}>
                  {quiz.title} - {quiz.courseTitle}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={exportToCSV} className="gap-2 cursor-pointer">
              <FileSpreadsheet className="h-4 w-4" />
              Exportar CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportToPDF} className="gap-2 cursor-pointer">
              <FileText className="h-4 w-4" />
              Exportar PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Low Performance Alerts */}
      {stats.filter(s => s.totalAttempts >= 5 && s.passingRate < 50).length > 0 && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-semibold text-destructive mb-2">
                Quizzes com Taxa de Aprovação Baixa (&lt;50%)
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                Os seguintes quizzes precisam de atenção - considere revisar o conteúdo ou as perguntas:
              </p>
              <div className="space-y-2">
                {stats
                  .filter(s => s.totalAttempts >= 5 && s.passingRate < 50)
                  .sort((a, b) => a.passingRate - b.passingRate)
                  .map((quiz) => (
                    <div 
                      key={quiz.quizId} 
                      className="flex items-center justify-between p-3 rounded-lg bg-background/60 border border-border/50"
                    >
                      <div className="flex items-center gap-3">
                        <XCircle className="h-4 w-4 text-destructive" />
                        <div>
                          <p className="font-medium text-sm">{quiz.quizTitle}</p>
                          <p className="text-xs text-muted-foreground">{quiz.courseTitle}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-destructive">{quiz.passingRate}%</p>
                        <p className="text-xs text-muted-foreground">
                          {quiz.passedAttempts}/{quiz.totalAttempts} aprovados
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
              <div className="mt-3 p-3 rounded-lg bg-muted/30 text-sm text-muted-foreground">
                <p className="font-medium mb-1">💡 Sugestões:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Revise as perguntas para garantir que estão claras</li>
                  <li>Verifique se o conteúdo das aulas cobre os tópicos do quiz</li>
                  <li>Considere adicionar explicações mais detalhadas nas respostas</li>
                  <li>Avalie se a nota de aprovação está adequada</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Quiz Comparison Chart */}
      {stats.length > 1 && selectedQuizId === 'all' && (
        <div className="p-6 rounded-2xl bg-card/80 border border-border/50">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Comparativo entre Quizzes
          </h3>
          
          <div className="space-y-6">
            {/* Passing Rate Comparison */}
            <div>
              <p className="text-sm text-muted-foreground mb-3">Taxa de Aprovação por Quiz (%)</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={stats.slice(0, 10)} 
                    layout="vertical"
                    margin={{ left: 20, right: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={true} vertical={false} />
                    <XAxis 
                      type="number" 
                      domain={[0, 100]} 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={10}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="quizTitle" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={10}
                      width={120}
                      tickFormatter={(value) => value.length > 18 ? value.substring(0, 18) + '...' : value}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                      formatter={(value: number, name: string) => {
                        const labels: Record<string, string> = {
                          passingRate: 'Taxa de Aprovação',
                          averageScore: 'Média'
                        };
                        return [`${value}%`, labels[name] || name];
                      }}
                    />
                    <Bar 
                      dataKey="passingRate" 
                      radius={[0, 4, 4, 0]}
                    >
                      {stats.slice(0, 10).map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.passingRate >= 70 ? 'hsl(142 76% 36%)' : entry.passingRate >= 50 ? 'hsl(45 93% 47%)' : 'hsl(0 84% 60%)'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-6 mt-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(142 76% 36%)' }} />
                  <span className="text-muted-foreground">≥70% (Bom)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(45 93% 47%)' }} />
                  <span className="text-muted-foreground">50-69% (Regular)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(0 84% 60%)' }} />
                  <span className="text-muted-foreground">&lt;50% (Baixo)</span>
                </div>
              </div>
            </div>

            {/* Attempts Comparison */}
            <div>
              <p className="text-sm text-muted-foreground mb-3">Tentativas e Aprovações por Quiz</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={stats.slice(0, 10)} 
                    layout="vertical"
                    margin={{ left: 20, right: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={true} vertical={false} />
                    <XAxis 
                      type="number" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={10}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="quizTitle" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={10}
                      width={120}
                      tickFormatter={(value) => value.length > 18 ? value.substring(0, 18) + '...' : value}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="totalAttempts" 
                      name="Tentativas"
                      fill="hsl(217 91% 60%)" 
                      radius={[0, 4, 4, 0]}
                    />
                    <Bar 
                      dataKey="passedAttempts" 
                      name="Aprovações"
                      fill="hsl(142 76% 36%)" 
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Average Score Comparison */}
            <div>
              <p className="text-sm text-muted-foreground mb-3">Média de Pontuação por Quiz (%)</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={stats.slice(0, 10)} 
                    layout="vertical"
                    margin={{ left: 20, right: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={true} vertical={false} />
                    <XAxis 
                      type="number" 
                      domain={[0, 100]} 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={10}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="quizTitle" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={10}
                      width={120}
                      tickFormatter={(value) => value.length > 18 ? value.substring(0, 18) + '...' : value}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                      formatter={(value: number) => [`${value}%`, 'Média']}
                    />
                    <Bar 
                      dataKey="averageScore" 
                      fill="hsl(var(--primary))" 
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

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

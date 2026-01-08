import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, BookOpen, Trophy, TrendingUp, Clock, Target, 
  BarChart3, Activity, Mail, Shield, RefreshCw, Download
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';

interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  totalCourses: number;
  completedCourses: number;
  totalLessonsCompleted: number;
  totalXPEarned: number;
  averageProgress: number;
  newsletterSubscribers: number;
  securityAlerts: number;
  quizAttempts: number;
  quizPassRate: number;
}

interface AuditLogEntry {
  id: string;
  action: string;
  resource_type: string | null;
  created_at: string | null;
  metadata: unknown;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--warning))', 'hsl(var(--destructive))'];

const PlatformAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [activityData, setActivityData] = useState<{ date: string; lessons: number; xp: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch multiple analytics in parallel
      const [
        usersResult,
        coursesResult,
        lessonsResult,
        xpResult,
        newsletterResult,
        alertsResult,
        quizResult,
        progressResult,
        auditResult,
        activityResult
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('courses').select('id', { count: 'exact', head: true }).eq('is_published', true),
        supabase.from('user_lesson_progress').select('id', { count: 'exact', head: true }).eq('is_completed', true),
        supabase.from('user_xp').select('total_xp'),
        supabase.from('newsletter_subscriptions').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('security_alerts').select('id', { count: 'exact', head: true }).eq('is_resolved', false),
        supabase.from('user_quiz_attempts').select('passed'),
        supabase.from('user_course_progress').select('progress_percentage'),
        supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('user_lesson_progress')
          .select('completed_at')
          .eq('is_completed', true)
          .gte('completed_at', subDays(new Date(), 7).toISOString())
      ]);

      // Calculate quiz pass rate
      const quizPassed = quizResult.data?.filter(q => q.passed).length || 0;
      const quizTotal = quizResult.data?.length || 1;
      
      // Calculate average progress
      const progressValues = progressResult.data?.map(p => p.progress_percentage || 0) || [];
      const avgProgress = progressValues.length > 0 
        ? Math.round(progressValues.reduce((a, b) => a + b, 0) / progressValues.length)
        : 0;

      // Calculate total XP
      const totalXP = xpResult.data?.reduce((sum, u) => sum + (u.total_xp || 0), 0) || 0;

      // Process activity data for chart
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i);
        return { 
          date: format(date, 'dd/MM', { locale: ptBR }), 
          lessons: 0, 
          xp: 0 
        };
      });
      
      activityResult.data?.forEach(item => {
        if (item.completed_at) {
          const dateStr = format(new Date(item.completed_at), 'dd/MM', { locale: ptBR });
          const dayData = last7Days.find(d => d.date === dateStr);
          if (dayData) {
            dayData.lessons += 1;
            dayData.xp += 20; // Approximate XP per lesson
          }
        }
      });

      setAnalytics({
        totalUsers: usersResult.count || 0,
        activeUsers: usersResult.count || 0,
        totalCourses: coursesResult.count || 0,
        completedCourses: lessonsResult.count || 0,
        totalLessonsCompleted: lessonsResult.count || 0,
        totalXPEarned: totalXP,
        averageProgress: avgProgress,
        newsletterSubscribers: newsletterResult.count || 0,
        securityAlerts: alertsResult.count || 0,
        quizAttempts: quizTotal,
        quizPassRate: Math.round((quizPassed / quizTotal) * 100)
      });

      setAuditLogs(auditResult.data || []);
      setActivityData(last7Days);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const statCards = analytics ? [
    { label: 'Usuários', value: analytics.totalUsers, icon: Users, color: 'primary' },
    { label: 'Cursos Publicados', value: analytics.totalCourses, icon: BookOpen, color: 'accent' },
    { label: 'Aulas Concluídas', value: analytics.totalLessonsCompleted, icon: Trophy, color: 'warning' },
    { label: 'XP Total', value: analytics.totalXPEarned.toLocaleString(), icon: TrendingUp, color: 'success' },
    { label: 'Progresso Médio', value: `${analytics.averageProgress}%`, icon: Target, color: 'primary' },
    { label: 'Newsletter', value: analytics.newsletterSubscribers, icon: Mail, color: 'accent' },
    { label: 'Taxa de Aprovação', value: `${analytics.quizPassRate}%`, icon: BarChart3, color: 'warning' },
    { label: 'Alertas Abertos', value: analytics.securityAlerts, icon: Shield, color: analytics.securityAlerts > 0 ? 'destructive' : 'success' },
  ] : [];

  const pieData = analytics ? [
    { name: 'Concluído', value: analytics.averageProgress },
    { name: 'Pendente', value: 100 - analytics.averageProgress }
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics da Plataforma</h2>
          <p className="text-muted-foreground">Métricas e insights em tempo real</p>
        </div>
        <Button onClick={fetchAnalytics} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="relative overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl bg-${stat.color}/10 flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 text-${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity">
            <Activity className="w-4 h-4 mr-2" />
            Atividade
          </TabsTrigger>
          <TabsTrigger value="progress">
            <Target className="w-4 h-4 mr-2" />
            Progresso
          </TabsTrigger>
          <TabsTrigger value="audit">
            <Shield className="w-4 h-4 mr-2" />
            Auditoria
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Atividade dos Últimos 7 Dias</CardTitle>
              <CardDescription>Aulas concluídas e XP ganho por dia</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="lessons" name="Aulas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Progresso Geral</CardTitle>
                <CardDescription>Média de conclusão dos cursos</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-4">
                  {pieData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index] }} 
                      />
                      <span className="text-sm text-muted-foreground">
                        {entry.name}: {entry.value}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tendências</CardTitle>
                <CardDescription>Evolução do engajamento</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="xp" 
                      name="XP" 
                      stroke="hsl(var(--accent))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--accent))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Logs de Auditoria</CardTitle>
                <CardDescription>Últimas 50 ações registradas</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {auditLogs.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum log de auditoria encontrado
                    </p>
                  ) : (
                    auditLogs.map((log) => (
                      <div 
                        key={log.id} 
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Activity className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{log.action}</p>
                            <p className="text-xs text-muted-foreground">
                              {log.resource_type || 'Sistema'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="text-xs">
                            {format(new Date(log.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PlatformAnalytics;

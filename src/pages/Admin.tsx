import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  GraduationCap, ArrowLeft, Loader2, BookOpen, Users, BarChart3,
  ShieldAlert, TrendingUp, Zap, Trophy, Route, Shield, Target,
  FileText, Video, Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import type { AdminCourse } from '@/components/admin/AdminCoursesTab';
import type { UserStat } from '@/components/admin/AdminUsersTab';

// Lazy load tab contents
const AdminCoursesTab = lazy(() => import('@/components/admin/AdminCoursesTab'));
const AdminUsersTab = lazy(() => import('@/components/admin/AdminUsersTab'));
const AdminStatsTab = lazy(() => import('@/components/admin/AdminStatsTab'));
const QuizStats = lazy(() => import('@/components/admin/QuizStats').then(m => ({ default: m.QuizStats })));
const PermissionsManager = lazy(() => import('@/components/admin/PermissionsManager'));
const LearningPathsManager = lazy(() => import('@/components/admin/LearningPathsManager').then(m => ({ default: m.LearningPathsManager })));
const PlatformAnalytics = lazy(() => import('@/components/admin/PlatformAnalytics'));
const AdminPlaybooksTab = lazy(() => import('@/components/admin/AdminPlaybooksTab'));
const AdminVideosTab = lazy(() => import('@/components/admin/AdminVideosTab'));
const AdminWorkflowsTab = lazy(() => import('@/components/admin/AdminWorkflowsTab'));
const AdminAssessmentsTab = lazy(() => import('@/components/admin/AdminAssessmentsTab'));
const AdminEngagementHeatmap = lazy(() => import('@/components/admin/AdminEngagementHeatmap'));
const AdminCohortRetention = lazy(() => import('@/components/admin/AdminCohortRetention'));

interface PlatformStats {
  totalUsers: number;
  totalCourses: number;
  totalLessons: number;
  totalXPEarned: number;
  totalLessonsCompleted: number;
  totalCoursesCompleted: number;
}

const TabFallback = () => (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminRole();
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [users, setUsers] = useState<UserStat[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!adminLoading && !isAdmin && user) {
      toast.error('Acesso negado. Apenas administradores podem acessar esta página.');
      navigate('/dashboard');
    }
  }, [isAdmin, adminLoading, user, navigate]);

  const fetchData = async () => {
    if (!isAdmin) return;
    setLoadingData(true);

    try {
      const { data: coursesData } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (coursesData) setCourses(coursesData);

      const { data: xpData } = await supabase.from('user_xp').select('user_id, total_xp, current_level, created_at');
      const { data: profilesData } = await supabase.from('profiles').select('user_id, full_name');
      const { data: lessonProgressData } = await supabase.from('user_lesson_progress').select('user_id, is_completed');
      const { data: courseProgressData } = await supabase.from('user_course_progress').select('user_id, progress_percentage');

      const userStats: UserStat[] = (xpData || []).map(xp => {
        const profile = profilesData?.find(p => p.user_id === xp.user_id);
        return {
          user_id: xp.user_id,
          email: '',
          full_name: profile?.full_name || 'Usuário',
          total_xp: xp.total_xp,
          current_level: xp.current_level,
          lessons_completed: lessonProgressData?.filter(l => l.user_id === xp.user_id && l.is_completed).length || 0,
          courses_completed: courseProgressData?.filter(c => c.user_id === xp.user_id && c.progress_percentage === 100).length || 0,
          created_at: xp.created_at,
        };
      });

      setUsers(userStats.sort((a, b) => b.total_xp - a.total_xp));

      const { count: totalLessons } = await supabase.from('lessons').select('*', { count: 'exact', head: true });

      setStats({
        totalUsers: xpData?.length || 0,
        totalCourses: coursesData?.length || 0,
        totalLessons: totalLessons || 0,
        totalXPEarned: xpData?.reduce((sum, u) => sum + u.total_xp, 0) || 0,
        totalLessonsCompleted: lessonProgressData?.filter(l => l.is_completed).length || 0,
        totalCoursesCompleted: courseProgressData?.filter(c => c.progress_percentage === 100).length || 0,
      });
    } catch {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAdmin]);

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <ShieldAlert className="h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-bold">Acesso Negado</h1>
        <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
        <Button onClick={() => navigate('/dashboard')}>Voltar ao Dashboard</Button>
      </div>
    );
  }

  const statCards = [
    { label: 'Usuários', value: stats?.totalUsers || 0, icon: Users, gradient: 'from-blue-500 to-cyan-500' },
    { label: 'Cursos', value: stats?.totalCourses || 0, icon: BookOpen, gradient: 'from-purple-500 to-pink-500' },
    { label: 'Aulas', value: stats?.totalLessons || 0, icon: GraduationCap, gradient: 'from-amber-500 to-orange-500' },
    { label: 'XP Total', value: stats?.totalXPEarned?.toLocaleString() || 0, icon: Zap, gradient: 'from-emerald-500 to-teal-500' },
    { label: 'Aulas Concluídas', value: stats?.totalLessonsCompleted || 0, icon: Trophy, gradient: 'from-rose-500 to-pink-500' },
    { label: 'Cursos Concluídos', value: stats?.totalCoursesCompleted || 0, icon: TrendingUp, gradient: 'from-indigo-500 to-purple-500' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="rounded-xl hover:bg-muted">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-red-500 to-orange-500">
                  <ShieldAlert className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Administração</h1>
                  <p className="text-sm text-muted-foreground">Gerencie a plataforma</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {statCards.map((stat) => {
            const IconComponent = stat.icon;
            return (
              <div key={stat.label} className="p-4 rounded-2xl bg-card/80 border border-border/50 neon-card">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-3`}>
                  <IconComponent className="h-5 w-5 text-white" />
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            );
          })}
        </div>

        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList className="flex flex-wrap w-full h-auto gap-1">
            <TabsTrigger value="courses" className="flex items-center gap-2"><BookOpen className="h-4 w-4" /> Cursos</TabsTrigger>
            <TabsTrigger value="paths" className="flex items-center gap-2"><Route className="h-4 w-4" /> Trilhas</TabsTrigger>
            <TabsTrigger value="playbooks" className="flex items-center gap-2"><FileText className="h-4 w-4" /> Playbooks</TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center gap-2"><Video className="h-4 w-4" /> Vídeos</TabsTrigger>
            <TabsTrigger value="workflows" className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Workflows</TabsTrigger>
            <TabsTrigger value="assessments" className="flex items-center gap-2"><Target className="h-4 w-4" /> Avaliações</TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2"><Users className="h-4 w-4" /> Usuários</TabsTrigger>
            <TabsTrigger value="quizzes" className="flex items-center gap-2"><Target className="h-4 w-4" /> Quizzes</TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-2"><Shield className="h-4 w-4" /> Permissões</TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Analytics</TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Stats</TabsTrigger>
          </TabsList>

          <Suspense fallback={<TabFallback />}>
            <TabsContent value="courses">
              <AdminCoursesTab courses={courses} setCourses={setCourses} loadingData={loadingData} onRefresh={fetchData} />
            </TabsContent>
            <TabsContent value="paths"><LearningPathsManager /></TabsContent>
            <TabsContent value="playbooks"><AdminPlaybooksTab /></TabsContent>
            <TabsContent value="videos"><AdminVideosTab /></TabsContent>
            <TabsContent value="workflows"><AdminWorkflowsTab /></TabsContent>
            <TabsContent value="assessments"><AdminAssessmentsTab /></TabsContent>
            <TabsContent value="users"><AdminUsersTab users={users} loadingData={loadingData} /></TabsContent>
            <TabsContent value="quizzes"><QuizStats /></TabsContent>
            <TabsContent value="permissions"><PermissionsManager /></TabsContent>
            <TabsContent value="analytics">
              <div className="space-y-6">
                <PlatformAnalytics />
                <div className="grid lg:grid-cols-2 gap-4">
                  <AdminEngagementHeatmap />
                  <AdminCohortRetention />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="stats"><AdminStatsTab stats={stats} courses={courses} users={users} /></TabsContent>
          </Suspense>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;

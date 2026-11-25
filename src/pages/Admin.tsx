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
import type { UserStat } from '@/components/admin/admin-users/types';

// Lazy load tab contents
const AdminCoursesTab = lazy(() => import('@/components/admin/AdminCoursesTab').catch((e) => { console.error('[Admin] Failed to load AdminCoursesTab', e); throw e; }));
const AdminUsersTab = lazy(() => import('@/components/admin/AdminUsersTab').catch((e) => { console.error('[Admin] Failed to load AdminUsersTab', e); throw e; }));
const AdminStatsTab = lazy(() => import('@/components/admin/AdminStatsTab').catch((e) => { console.error('[Admin] Failed to load AdminStatsTab', e); throw e; }));
const QuizStats = lazy(() => import('@/components/admin/QuizStats').then(m => ({ default: m.QuizStats })).catch((e) => { console.error('[Admin] Failed to load QuizStats', e); throw e; }));
const PermissionsManager = lazy(() => import('@/components/admin/PermissionsManager').catch((e) => { console.error('[Admin] Failed to load PermissionsManager', e); throw e; }));
const LearningPathsManager = lazy(() => import('@/components/admin/LearningPathsManager').then(m => ({ default: m.LearningPathsManager })).catch((e) => { console.error('[Admin] Failed to load LearningPathsManager', e); throw e; }));
const PlatformAnalytics = lazy(() => import('@/components/admin/PlatformAnalytics').catch((e) => { console.error('[Admin] Failed to load PlatformAnalytics', e); throw e; }));
const AdminPlaybooksTab = lazy(() => import('@/components/admin/AdminPlaybooksTab').catch((e) => { console.error('[Admin] Failed to load AdminPlaybooksTab', e); throw e; }));
const AdminVideosTab = lazy(() => import('@/components/admin/AdminVideosTab').catch((e) => { console.error('[Admin] Failed to load AdminVideosTab', e); throw e; }));
const AdminWorkflowsTab = lazy(() => import('@/components/admin/AdminWorkflowsTab').catch((e) => { console.error('[Admin] Failed to load AdminWorkflowsTab', e); throw e; }));
const AdminAssessmentsTab = lazy(() => import('@/components/admin/AdminAssessmentsTab').catch((e) => { console.error('[Admin] Failed to load AdminAssessmentsTab', e); throw e; }));
const AdminEngagementHeatmap = lazy(() => import('@/components/admin/AdminEngagementHeatmap').catch((e) => { console.error('[Admin] Failed to load AdminEngagementHeatmap', e); throw e; }));
const AdminCohortRetention = lazy(() => import('@/components/admin/AdminCohortRetention').catch((e) => { console.error('[Admin] Failed to load AdminCohortRetention', e); throw e; }));
const AdminTelemetryWidget = lazy(() => import('@/components/admin/AdminTelemetryWidget').catch((e) => { console.error('[Admin] Failed to load AdminTelemetryWidget', e); throw e; }));

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

      const { data: xpData } = await supabase
              .from('user_xp')
              .select('user_id, total_xp, current_level, xp_from_lessons, xp_from_courses, xp_from_streaks, xp_from_achievements, last_xp_earned_at, created_at');
            const { data: profilesData } = await supabase
              .from('profiles')
              .select('user_id, full_name, email, is_active, deactivated_at, created_at');
            const { data: rolesData } = await supabase.from('user_roles').select('user_id, role');
      const { data: lessonProgressData } = await supabase.from('user_lesson_progress').select('user_id, is_completed');
      const { data: courseProgressData } = await supabase.from('user_course_progress').select('user_id, progress_percentage');

            const userStats: UserStat[] = (profilesData || []).map(profile => {
              const xp = xpData?.find(x => x.user_id === profile.user_id);
        return {
                user_id: profile.user_id,
                email: profile.email || '',
                full_name: profile.full_name || 'Usuário',
                total_xp: xp?.total_xp || 0,
                current_level: xp?.current_level || 1,
                lessons_completed: lessonProgressData?.filter(l => l.user_id === profile.user_id && l.is_completed).length || 0,
                courses_completed: courseProgressData?.filter(c => c.user_id === profile.user_id && c.progress_percentage === 100).length || 0,
                created_at: profile.created_at || xp?.created_at || new Date().toISOString(),
                is_active: profile.is_active ?? true,
                deactivated_at: profile.deactivated_at ?? null,
                roles: (rolesData || []).filter(r => r.user_id === profile.user_id).map(r => r.role),
                xp_from_lessons: xp?.xp_from_lessons || 0,
                xp_from_courses: xp?.xp_from_courses || 0,
                xp_from_streaks: xp?.xp_from_streaks || 0,
                xp_from_achievements: xp?.xp_from_achievements || 0,
                last_xp_earned_at: xp?.last_xp_earned_at ?? null,
        };
      });

      setUsers(userStats.sort((a, b) => b.total_xp - a.total_xp));

      const { count: totalLessons } = await supabase.from('lessons').select('*', { count: 'exact', head: true });

      setStats({
              totalUsers: profilesData?.length || 0,
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
          <div className="relative z-0 overflow-x-auto pb-1">
            <TabsList className="flex w-max gap-1 bg-muted/50 p-1 rounded-lg">
              <TabsTrigger value="courses"><BookOpen className="h-4 w-4 mr-1.5 inline-block align-middle" />Cursos</TabsTrigger>
              <TabsTrigger value="paths"><Route className="h-4 w-4 mr-1.5 inline-block align-middle" />Trilhas</TabsTrigger>
              <TabsTrigger value="playbooks"><FileText className="h-4 w-4 mr-1.5 inline-block align-middle" />Playbooks</TabsTrigger>
              <TabsTrigger value="videos"><Video className="h-4 w-4 mr-1.5 inline-block align-middle" />Vídeos</TabsTrigger>
              <TabsTrigger value="workflows"><Sparkles className="h-4 w-4 mr-1.5 inline-block align-middle" />Workflows</TabsTrigger>
              <TabsTrigger value="assessments"><Target className="h-4 w-4 mr-1.5 inline-block align-middle" />Avaliações</TabsTrigger>
              <TabsTrigger value="users"><Users className="h-4 w-4 mr-1.5 inline-block align-middle" />Usuários</TabsTrigger>
              <TabsTrigger value="quizzes"><Target className="h-4 w-4 mr-1.5 inline-block align-middle" />Quizzes</TabsTrigger>
              <TabsTrigger value="permissions"><Shield className="h-4 w-4 mr-1.5 inline-block align-middle" />Permissões</TabsTrigger>
              <TabsTrigger value="analytics"><TrendingUp className="h-4 w-4 mr-1.5 inline-block align-middle" />Analytics</TabsTrigger>
              <TabsTrigger value="stats"><BarChart3 className="h-4 w-4 mr-1.5 inline-block align-middle" />Stats</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="courses">
            <Suspense fallback={<TabFallback />}>
              <AdminCoursesTab courses={courses} setCourses={setCourses} loadingData={loadingData} onRefresh={fetchData} />
            </Suspense>
          </TabsContent>
          <TabsContent value="paths">
            <Suspense fallback={<TabFallback />}>
              <LearningPathsManager />
            </Suspense>
          </TabsContent>
          <TabsContent value="playbooks">
            <Suspense fallback={<TabFallback />}>
              <AdminPlaybooksTab />
            </Suspense>
          </TabsContent>
          <TabsContent value="videos">
            <Suspense fallback={<TabFallback />}>
              <AdminVideosTab />
            </Suspense>
          </TabsContent>
          <TabsContent value="workflows">
            <Suspense fallback={<TabFallback />}>
              <AdminWorkflowsTab />
            </Suspense>
          </TabsContent>
          <TabsContent value="assessments">
            <Suspense fallback={<TabFallback />}>
              <AdminAssessmentsTab />
            </Suspense>
          </TabsContent>
          <TabsContent value="users">
            <Suspense fallback={<TabFallback />}>
              <AdminUsersTab users={users} loadingData={loadingData} onRefresh={fetchData} />
            </Suspense>
          </TabsContent>
          <TabsContent value="quizzes">
            <Suspense fallback={<TabFallback />}>
              <QuizStats />
            </Suspense>
          </TabsContent>
          <TabsContent value="permissions">
            <Suspense fallback={<TabFallback />}>
              <PermissionsManager />
            </Suspense>
          </TabsContent>
          <TabsContent value="analytics">
            <div className="space-y-6">
              <Suspense fallback={<TabFallback />}>
                <PlatformAnalytics />
                <AdminTelemetryWidget />
                <div className="grid lg:grid-cols-2 gap-4">
                  <AdminEngagementHeatmap />
                  <AdminCohortRetention />
                </div>
              </Suspense>
            </div>
          </TabsContent>
          <TabsContent value="stats">
            <Suspense fallback={<TabFallback />}>
              <AdminStatsTab stats={stats} courses={courses} users={users} />
            </Suspense>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;

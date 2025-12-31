import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { CourseForm } from '@/components/admin/CourseForm';
import { LessonsManager } from '@/components/admin/LessonsManager';
import { QuizStats } from '@/components/admin/QuizStats';
import PermissionsManager from '@/components/admin/PermissionsManager';
import { LearningPathsManager } from '@/components/admin/LearningPathsManager';
import {
  GraduationCap,
  ArrowLeft,
  Loader2,
  BookOpen,
  Users,
  BarChart3,
  Search,
  ShieldAlert,
  TrendingUp,
  Zap,
  Trophy,
  Clock,
  Eye,
  Edit,
  Trash2,
  Plus,
  Play,
  Route,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import { Target } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  is_published: boolean;
  is_featured: boolean;
  level: string;
  total_lessons: number;
  duration_minutes: number;
  created_at: string;
  instructor_name: string | null;
  category_id: string | null;
}

interface UserStat {
  user_id: string;
  email: string;
  full_name: string;
  total_xp: number;
  current_level: number;
  lessons_completed: number;
  courses_completed: number;
  created_at: string;
}

interface PlatformStats {
  totalUsers: number;
  totalCourses: number;
  totalLessons: number;
  totalXPEarned: number;
  totalLessonsCompleted: number;
  totalCoursesCompleted: number;
}

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminRole();
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<UserStat[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [searchCourses, setSearchCourses] = useState('');
  const [searchUsers, setSearchUsers] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  
  // CRUD states
  const [courseFormOpen, setCourseFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);
  const [lessonsManagerOpen, setLessonsManagerOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

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
      // Fetch courses
      const { data: coursesData } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (coursesData) setCourses(coursesData);

      // Fetch user stats
      const { data: xpData } = await supabase
        .from('user_xp')
        .select('user_id, total_xp, current_level, created_at');

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name');

      const { data: lessonProgressData } = await supabase
        .from('user_lesson_progress')
        .select('user_id, is_completed');

      const { data: courseProgressData } = await supabase
        .from('user_course_progress')
        .select('user_id, progress_percentage');

      // Combine user data
      const userStats: UserStat[] = (xpData || []).map(xp => {
        const profile = profilesData?.find(p => p.user_id === xp.user_id);
        const lessonsCompleted = lessonProgressData?.filter(
          l => l.user_id === xp.user_id && l.is_completed
        ).length || 0;
        const coursesCompleted = courseProgressData?.filter(
          c => c.user_id === xp.user_id && c.progress_percentage === 100
        ).length || 0;

        return {
          user_id: xp.user_id,
          email: '',
          full_name: profile?.full_name || 'Usuário',
          total_xp: xp.total_xp,
          current_level: xp.current_level,
          lessons_completed: lessonsCompleted,
          courses_completed: coursesCompleted,
          created_at: xp.created_at,
        };
      });

      setUsers(userStats.sort((a, b) => b.total_xp - a.total_xp));

      // Calculate platform stats
      const { count: totalLessons } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalUsers: xpData?.length || 0,
        totalCourses: coursesData?.length || 0,
        totalLessons: totalLessons || 0,
        totalXPEarned: xpData?.reduce((sum, u) => sum + u.total_xp, 0) || 0,
        totalLessonsCompleted: lessonProgressData?.filter(l => l.is_completed).length || 0,
        totalCoursesCompleted: courseProgressData?.filter(c => c.progress_percentage === 100).length || 0,
      });
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAdmin]);

  const toggleCoursePublished = async (courseId: string, currentValue: boolean) => {
    const { error } = await supabase
      .from('courses')
      .update({ is_published: !currentValue })
      .eq('id', courseId);

    if (error) {
      toast.error('Erro ao atualizar curso');
    } else {
      setCourses(prev =>
        prev.map(c => c.id === courseId ? { ...c, is_published: !currentValue } : c)
      );
      toast.success(`Curso ${!currentValue ? 'publicado' : 'despublicado'}`);
    }
  };

  const toggleCourseFeatured = async (courseId: string, currentValue: boolean) => {
    const { error } = await supabase
      .from('courses')
      .update({ is_featured: !currentValue })
      .eq('id', courseId);

    if (error) {
      toast.error('Erro ao atualizar curso');
    } else {
      setCourses(prev =>
        prev.map(c => c.id === courseId ? { ...c, is_featured: !currentValue } : c)
      );
      toast.success(`Curso ${!currentValue ? 'destacado' : 'removido dos destaques'}`);
    }
  };

  const handleDeleteCourse = async () => {
    if (!deletingCourse) return;

    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', deletingCourse.id);

    if (error) {
      toast.error('Erro ao excluir curso');
    } else {
      toast.success('Curso excluído com sucesso!');
      setCourses(prev => prev.filter(c => c.id !== deletingCourse.id));
    }

    setDeletingCourse(null);
  };

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

  const filteredCourses = courses.filter(c =>
    c.title.toLowerCase().includes(searchCourses.toLowerCase())
  );

  const filteredUsers = users.filter(u =>
    u.full_name.toLowerCase().includes(searchUsers.toLowerCase())
  );

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
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard')}
                className="rounded-xl hover:bg-muted"
              >
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
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {statCards.map((stat) => {
            const IconComponent = stat.icon;
            return (
              <div
                key={stat.label}
                className="p-4 rounded-2xl bg-card/80 border border-border/50 neon-card"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-3`}>
                  <IconComponent className="h-5 w-5 text-white" />
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList className="grid w-full max-w-3xl grid-cols-6">
            <TabsTrigger value="courses" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Cursos
            </TabsTrigger>
            <TabsTrigger value="paths" className="flex items-center gap-2">
              <Route className="h-4 w-4" />
              Trilhas
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="quizzes" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Quizzes
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Permissões
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Estatísticas
            </TabsTrigger>
          </TabsList>

          {/* Courses Tab */}
          <TabsContent value="courses" className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cursos..."
                  value={searchCourses}
                  onChange={(e) => setSearchCourses(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                onClick={() => {
                  setEditingCourse(null);
                  setCourseFormOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Curso
              </Button>
            </div>

            <div className="rounded-xl border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Curso</TableHead>
                    <TableHead>Nível</TableHead>
                    <TableHead className="text-center">Aulas</TableHead>
                    <TableHead className="text-center">Duração</TableHead>
                    <TableHead className="text-center">Publicado</TableHead>
                    <TableHead className="text-center">Destaque</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingData ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : filteredCourses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Nenhum curso encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCourses.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell className="font-medium">{course.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{course.level}</Badge>
                        </TableCell>
                        <TableCell className="text-center">{course.total_lessons}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {course.duration_minutes}min
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={course.is_published}
                            onCheckedChange={() => toggleCoursePublished(course.id, course.is_published)}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={course.is_featured}
                            onCheckedChange={() => toggleCourseFeatured(course.id, course.is_featured)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => navigate(`/curso/${course.slug}`)}
                              title="Visualizar"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setSelectedCourse(course);
                                setLessonsManagerOpen(true);
                              }}
                              title="Gerenciar aulas"
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setEditingCourse(course);
                                setCourseFormOpen(true);
                              }}
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => setDeletingCourse(course)}
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Learning Paths Tab */}
          <TabsContent value="paths">
            <LearningPathsManager />
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuários..."
                  value={searchUsers}
                  onChange={(e) => setSearchUsers(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="rounded-xl border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead className="text-center">Nível</TableHead>
                    <TableHead className="text-center">XP Total</TableHead>
                    <TableHead className="text-center">Aulas</TableHead>
                    <TableHead className="text-center">Cursos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingData ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhum usuário encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((userStat, index) => (
                      <TableRow key={userStat.user_id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-bold">
                              {userStat.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{userStat.full_name}</p>
                              <p className="text-xs text-muted-foreground">#{index + 1} no ranking</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-gradient-to-r from-primary to-accent text-white">
                            Nível {userStat.current_level}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Zap className="h-4 w-4 text-emerald-500" />
                            <span className="font-bold text-emerald-500">{userStat.total_xp.toLocaleString()}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{userStat.lessons_completed}</TableCell>
                        <TableCell className="text-center">{userStat.courses_completed}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Quizzes Tab */}
          <TabsContent value="quizzes">
            <QuizStats />
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Engagement Card */}
              <div className="p-6 rounded-2xl bg-card/80 border border-border/50 neon-card">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Engajamento
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Taxa de conclusão de aulas</span>
                    <span className="font-bold">
                      {stats && stats.totalLessons > 0
                        ? Math.round((stats.totalLessonsCompleted / (stats.totalUsers * stats.totalLessons)) * 100) || 0
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Média de XP por usuário</span>
                    <span className="font-bold text-emerald-500">
                      {stats && stats.totalUsers > 0
                        ? Math.round(stats.totalXPEarned / stats.totalUsers).toLocaleString()
                        : 0} XP
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Aulas por usuário</span>
                    <span className="font-bold">
                      {stats && stats.totalUsers > 0
                        ? (stats.totalLessonsCompleted / stats.totalUsers).toFixed(1)
                        : 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Content Card */}
              <div className="p-6 rounded-2xl bg-card/80 border border-border/50 neon-card">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-purple-500" />
                  Conteúdo
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Cursos publicados</span>
                    <span className="font-bold">
                      {courses.filter(c => c.is_published).length} / {courses.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Cursos em destaque</span>
                    <span className="font-bold text-amber-500">
                      {courses.filter(c => c.is_featured).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Média de aulas por curso</span>
                    <span className="font-bold">
                      {courses.length > 0
                        ? (courses.reduce((sum, c) => sum + c.total_lessons, 0) / courses.length).toFixed(1)
                        : 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Users */}
            <div className="p-6 rounded-2xl bg-card/80 border border-border/50 neon-card">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                Top 5 Usuários
              </h3>
              <div className="space-y-3">
                {users.slice(0, 5).map((userStat, index) => (
                  <div key={userStat.user_id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-center font-bold text-muted-foreground">#{index + 1}</span>
                      <span className="font-medium">{userStat.full_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-emerald-500" />
                      <span className="font-bold text-emerald-500">{userStat.total_xp.toLocaleString()} XP</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions">
            <PermissionsManager />
          </TabsContent>
        </Tabs>
      </main>

      {/* Course Form Modal */}
      <CourseForm
        open={courseFormOpen}
        onOpenChange={setCourseFormOpen}
        course={editingCourse}
        onSuccess={fetchData}
      />

      {/* Lessons Manager Modal */}
      <LessonsManager
        open={lessonsManagerOpen}
        onOpenChange={setLessonsManagerOpen}
        course={selectedCourse}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingCourse} onOpenChange={() => setDeletingCourse(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Curso</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o curso "{deletingCourse?.title}"? 
              Esta ação não pode ser desfeita e todas as aulas associadas também serão excluídas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCourse}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Admin;

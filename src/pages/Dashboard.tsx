import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import CourseCard from '@/components/catalog/CourseCard';
import { GraduationCap, BookOpen, Trophy, Clock, LogOut, User, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  duration_minutes: number;
  level: string;
  instructor_name: string | null;
  total_lessons: number;
  is_featured: boolean;
  categories: {
    name: string;
    color: string | null;
  } | null;
}

interface UserProgress {
  course_id: string;
  progress_percentage: number;
  courses: Course;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      setLoadingCourses(true);

      const [coursesRes, progressRes] = await Promise.all([
        supabase
          .from('courses')
          .select('*, categories(*)')
          .eq('is_published', true)
          .eq('is_featured', true)
          .limit(4),
        supabase
          .from('user_course_progress')
          .select('course_id, progress_percentage, courses(*, categories(*))')
          .eq('user_id', user.id)
          .order('last_accessed_at', { ascending: false })
          .limit(4),
      ]);

      if (coursesRes.data) {
        setFeaturedCourses(coursesRes.data as Course[]);
      }
      if (progressRes.data) {
        setUserProgress(progressRes.data as unknown as UserProgress[]);
      }

      setLoadingCourses(false);
    };

    fetchData();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Até logo!');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Colaborador';
  const inProgressCount = userProgress.filter(p => p.progress_percentage > 0 && p.progress_percentage < 100).length;
  const completedCount = userProgress.filter(p => p.progress_percentage === 100).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">MULTIPLIXE</h1>
              <p className="text-xs text-muted-foreground">by Promo Brindes</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link to="/dashboard" className="text-foreground font-medium">
              Dashboard
            </Link>
            <Link to="/catalogo" className="text-muted-foreground hover:text-foreground transition-colors">
              Catálogo
            </Link>
          </nav>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{userName}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Olá, {userName}! 👋
          </h2>
          <p className="text-muted-foreground">
            Continue sua jornada de aprendizado na MULTIPLIXE
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Cursos em Andamento
              </CardTitle>
              <BookOpen className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{inProgressCount}</div>
              <p className="text-xs text-muted-foreground">cursos ativos</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Cursos Concluídos
              </CardTitle>
              <Trophy className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{completedCount}</div>
              <p className="text-xs text-muted-foreground">certificados</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Horas de Estudo
              </CardTitle>
              <Clock className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">0h</div>
              <p className="text-xs text-muted-foreground">este mês</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Sequência
              </CardTitle>
              <span className="text-lg">🔥</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">0</div>
              <p className="text-xs text-muted-foreground">dias seguidos</p>
            </CardContent>
          </Card>
        </div>

        {/* Continue Learning Section */}
        {userProgress.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Continue Aprendendo</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {userProgress.map((progress) => (
                <CourseCard
                  key={progress.course_id}
                  id={progress.courses.id}
                  slug={progress.courses.slug}
                  title={progress.courses.title}
                  description={progress.courses.description}
                  thumbnailUrl={progress.courses.thumbnail_url}
                  durationMinutes={progress.courses.duration_minutes}
                  level={progress.courses.level}
                  instructorName={progress.courses.instructor_name}
                  totalLessons={progress.courses.total_lessons}
                  categoryName={progress.courses.categories?.name}
                  categoryColor={progress.courses.categories?.color || undefined}
                  progress={progress.progress_percentage}
                />
              ))}
            </div>
          </section>
        )}

        {/* Featured Courses */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-foreground">Cursos em Destaque</h3>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/catalogo">
                Ver todos
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>

          {loadingCourses ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : featuredCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  id={course.id}
                  slug={course.slug}
                  title={course.title}
                  description={course.description}
                  thumbnailUrl={course.thumbnail_url}
                  durationMinutes={course.duration_minutes}
                  level={course.level}
                  instructorName={course.instructor_name}
                  totalLessons={course.total_lessons}
                  categoryName={course.categories?.name}
                  categoryColor={course.categories?.color || undefined}
                  isFeatured={course.is_featured}
                />
              ))}
            </div>
          ) : (
            <Card className="border-border/50 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="p-4 bg-primary/10 rounded-full mb-4">
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl mb-2">Explore o catálogo</CardTitle>
                <CardDescription className="text-center max-w-md mb-4">
                  Descubra cursos incríveis para desenvolver suas habilidades
                </CardDescription>
                <Button asChild>
                  <Link to="/catalogo">
                    Ver Catálogo
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;

import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import CourseCard from '@/components/catalog/CourseCard';
import AchievementCelebration from '@/components/AchievementCelebration';
import { 
  GraduationCap, 
  BookOpen, 
  Trophy, 
  Clock, 
  LogOut, 
  User, 
  ArrowRight, 
  Loader2,
  Sparkles,
  Flame,
  Target,
  Zap,
  TrendingUp,
  Star
} from 'lucide-react';
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

interface Achievement {
  id: string;
  type: 'xp' | 'badge' | 'streak' | 'course';
  title: string;
  description: string;
  value?: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading, signOut } = useAuth();
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);

  // Check for achievement celebrations from URL params
  useEffect(() => {
    const celebrationType = searchParams.get('celebrate');
    const xpAmount = searchParams.get('xp');
    const badgeName = searchParams.get('badge');
    
    if (celebrationType) {
      let achievement: Achievement | null = null;
      
      switch (celebrationType) {
        case 'xp':
          achievement = {
            id: 'xp-gain',
            type: 'xp',
            title: 'XP Conquistado!',
            description: 'Continue aprendendo para ganhar mais pontos de experiência!',
            value: xpAmount ? parseInt(xpAmount) : 50,
          };
          break;
        case 'badge':
          achievement = {
            id: 'badge-earned',
            type: 'badge',
            title: badgeName || 'Nova Conquista!',
            description: 'Você desbloqueou uma nova conquista! Confira seu perfil.',
          };
          break;
        case 'course':
          achievement = {
            id: 'course-complete',
            type: 'course',
            title: 'Curso Concluído!',
            description: 'Parabéns! Você completou mais um curso e ganhou um certificado!',
          };
          break;
        case 'streak':
          achievement = {
            id: 'streak',
            type: 'streak',
            title: 'Sequência Mantida!',
            description: 'Você está em uma sequência de estudos. Continue assim!',
          };
          break;
      }
      
      if (achievement) {
        setCurrentAchievement(achievement);
        // Clear the search params after showing
        setSearchParams({});
      }
    }
  }, [searchParams, setSearchParams]);

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-secondary animate-spin-slow" />
            <div className="absolute inset-2 bg-background rounded-full" />
            <Loader2 className="absolute inset-0 m-auto h-6 w-6 animate-spin text-primary" />
          </div>
          <p className="text-muted-foreground font-medium animate-pulse">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Colaborador';
  const inProgressCount = userProgress.filter(p => p.progress_percentage > 0 && p.progress_percentage < 100).length;
  const completedCount = userProgress.filter(p => p.progress_percentage === 100).length;

  const stats = [
    {
      label: "Cursos em Andamento",
      value: inProgressCount,
      subtitle: "cursos ativos",
      icon: BookOpen,
      gradient: "from-primary to-secondary",
      bgGradient: "from-primary/10 to-secondary/10"
    },
    {
      label: "Cursos Concluídos",
      value: completedCount,
      subtitle: "certificados",
      icon: Trophy,
      gradient: "from-amber-500 to-orange-500",
      bgGradient: "from-amber-500/10 to-orange-500/10"
    },
    {
      label: "Horas de Estudo",
      value: "0h",
      subtitle: "este mês",
      icon: Clock,
      gradient: "from-emerald-500 to-teal-500",
      bgGradient: "from-emerald-500/10 to-teal-500/10"
    },
    {
      label: "Sequência",
      value: 0,
      subtitle: "dias seguidos",
      icon: Flame,
      gradient: "from-rose-500 to-pink-500",
      bgGradient: "from-rose-500/10 to-pink-500/10"
    }
  ];

  // Demo function to trigger achievements (can be called from buttons or events)
  const triggerAchievement = (type: 'xp' | 'badge' | 'streak' | 'course', value?: number) => {
    const achievements: Record<string, Achievement> = {
      xp: {
        id: 'xp-gain',
        type: 'xp',
        title: 'XP Conquistado!',
        description: 'Continue aprendendo para ganhar mais pontos de experiência!',
        value: value || 50,
      },
      badge: {
        id: 'badge-earned',
        type: 'badge',
        title: 'Primeira Aula!',
        description: 'Você completou sua primeira aula. Continue assim!',
      },
      course: {
        id: 'course-complete',
        type: 'course',
        title: 'Curso Concluído!',
        description: 'Parabéns! Você completou mais um curso!',
      },
      streak: {
        id: 'streak',
        type: 'streak',
        title: 'Sequência de 7 dias!',
        description: 'Você estudou por 7 dias seguidos. Incrível!',
      },
    };
    setCurrentAchievement(achievements[type]);
  };

  return (
    <div className="min-h-screen">
      {/* Achievement Celebration Modal */}
      <AchievementCelebration 
        achievement={currentAchievement} 
        onClose={() => setCurrentAchievement(null)} 
      />
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-2xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative p-2.5 bg-gradient-to-r from-primary to-secondary rounded-xl">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="font-display font-bold text-xl text-foreground">MULTIPLIXE</h1>
                <p className="text-xs text-muted-foreground">by Promo Brindes</p>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link 
                to="/dashboard" 
                className="px-4 py-2 text-foreground font-medium bg-primary/10 text-primary rounded-xl"
              >
                Dashboard
              </Link>
              <Link 
                to="/catalogo" 
                className="px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-all"
              >
                Catálogo
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">{userName}</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSignOut}
                className="rounded-xl border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Hero Welcome Section */}
        <div className="relative mb-10 p-8 md:p-12 rounded-3xl overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/5" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-br from-accent/20 to-primary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          {/* Floating elements */}
          <div className="absolute top-8 right-8 w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg float animate-bounce-subtle">
            <Star className="h-6 w-6 text-white" />
          </div>
          <div className="absolute bottom-8 right-24 w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg float" style={{ animationDelay: '0.5s' }}>
            <Zap className="h-5 w-5 text-white" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="px-3 py-1.5 bg-primary/10 rounded-full">
                <div className="flex items-center gap-2 text-primary">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-sm font-semibold">Bem-vindo de volta!</span>
                </div>
              </div>
            </div>
            
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
              Olá, <span className="text-gradient">{userName}</span>! 👋
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Continue sua jornada de aprendizado na MULTIPLIXE. Cada curso te aproxima mais dos seus objetivos! 🚀
            </p>

            {/* Quick action */}
            <div className="mt-8 flex flex-wrap gap-3">
              <Button 
                asChild 
                className="btn-gradient rounded-2xl h-12 px-6 text-base font-semibold gap-2"
              >
                <Link to="/catalogo">
                  <Target className="h-5 w-5" />
                  Explorar Cursos
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              
              {/* Demo buttons for testing confetti */}
              <Button 
                variant="outline"
                onClick={() => triggerAchievement('xp', 150)}
                className="rounded-2xl h-12 px-4 gap-2 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 hover:border-emerald-500/50"
              >
                <Zap className="h-5 w-5" />
                Testar XP
              </Button>
              <Button 
                variant="outline"
                onClick={() => triggerAchievement('badge')}
                className="rounded-2xl h-12 px-4 gap-2 border-amber-500/30 text-amber-600 hover:bg-amber-500/10 hover:border-amber-500/50"
              >
                <Star className="h-5 w-5" />
                Testar Badge
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="group relative rounded-2xl bg-card border border-border/50 p-5 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-card animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Gradient background on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
                  <div className={`p-2 rounded-xl bg-gradient-to-br ${stat.gradient}`}>
                    <stat.icon className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="text-3xl font-display font-bold text-foreground mb-1">
                  {stat.value}
                </div>
                <p className="text-sm text-muted-foreground">{stat.subtitle}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Continue Learning Section */}
        {userProgress.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold text-foreground">Continue Aprendendo</h3>
                  <p className="text-sm text-muted-foreground">Retome de onde parou</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {userProgress.map((progress, index) => (
                <div 
                  key={progress.course_id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CourseCard
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
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Featured Courses */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10">
                <Sparkles className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-xl font-display font-bold text-foreground">Cursos em Destaque</h3>
                <p className="text-sm text-muted-foreground">Os mais populares da plataforma</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              asChild
              className="rounded-xl border-border/50 gap-2 hover:bg-primary/5 hover:border-primary/50 hover:text-primary"
            >
              <Link to="/catalogo">
                Ver todos
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {loadingCourses ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-3xl bg-card/50 border border-border/50 overflow-hidden animate-pulse">
                  <div className="aspect-[16/10] bg-muted" />
                  <div className="p-5 space-y-4">
                    <div className="h-5 bg-muted rounded-lg w-3/4" />
                    <div className="h-4 bg-muted rounded-lg w-full" />
                    <div className="h-4 bg-muted rounded-lg w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredCourses.map((course, index) => (
                <div 
                  key={course.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CourseCard
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
                </div>
              ))}
            </div>
          ) : (
            <div className="relative rounded-3xl border border-dashed border-border/50 bg-card/30 overflow-hidden">
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
              
              <div className="relative flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-2xl" />
                  <div className="relative p-6 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full border border-border/50">
                    <BookOpen className="h-12 w-12 text-primary" />
                  </div>
                </div>
                <h4 className="text-2xl font-display font-bold text-foreground mb-2">
                  Explore o catálogo
                </h4>
                <p className="text-muted-foreground max-w-md mb-6">
                  Descubra cursos incríveis para desenvolver suas habilidades e impulsionar sua carreira
                </p>
                <Button 
                  asChild
                  className="btn-gradient rounded-xl h-11 px-6 gap-2"
                >
                  <Link to="/catalogo">
                    Ver Catálogo
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;

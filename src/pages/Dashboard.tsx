import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserXP } from '@/hooks/useUserXP';
import { useLevelUp } from '@/hooks/useLevelUp';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import CourseCard from '@/components/catalog/CourseCard';
import AchievementCelebration from '@/components/AchievementCelebration';
import LevelUpCelebration from '@/components/LevelUpCelebration';
import LevelProgress from '@/components/LevelProgress';
import {
  GraduationCap, 
  BookOpen, 
  Trophy, 
  LogOut, 
  ArrowRight, 
  Loader2,
  Sparkles,
  Flame,
  Target,
  Zap,
  TrendingUp,
  Star,
  Play,
  ChevronRight,
  Rocket,
  Crown,
  Medal
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
  const { totalXP, loading: loadingXP } = useUserXP();
  const { levelUpData, clearLevelUp } = useLevelUp(totalXP);
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full blur-xl opacity-50 animate-pulse" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-r from-primary to-accent p-1">
              <div className="w-full h-full bg-background rounded-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            </div>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-foreground animate-pulse">Carregando...</p>
            <p className="text-sm text-muted-foreground">Preparando seu dashboard</p>
          </div>
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
      subtitle: "Continue de onde parou",
      icon: Play,
      gradient: "from-primary to-accent",
      glowColor: "shadow-primary/25"
    },
    {
      label: "Cursos Concluídos",
      value: completedCount,
      subtitle: "Certificados conquistados",
      icon: Trophy,
      gradient: "from-amber-500 to-orange-500",
      glowColor: "shadow-amber-500/25"
    },
    {
      label: "XP Total",
      value: totalXP,
      subtitle: "Pontos de experiência",
      icon: Zap,
      gradient: "from-emerald-500 to-teal-500",
      glowColor: "shadow-emerald-500/25"
    },
    {
      label: "Sequência",
      value: `${Math.min(completedCount + inProgressCount, 7)} dias`,
      subtitle: "Mantenha o ritmo!",
      icon: Flame,
      gradient: "from-rose-500 to-pink-500",
      glowColor: "shadow-rose-500/25"
    }
  ];

  const achievements = [
    { icon: Medal, name: "Primeira Aula", unlocked: completedCount > 0 || inProgressCount > 0, gradient: "from-amber-500 to-yellow-500" },
    { icon: Target, name: "Focado", unlocked: inProgressCount >= 2, gradient: "from-blue-500 to-cyan-500" },
    { icon: Crown, name: "Mestre", unlocked: completedCount >= 3, gradient: "from-purple-500 to-pink-500" },
    { icon: Rocket, name: "Veloz", unlocked: completedCount >= 5, gradient: "from-orange-500 to-red-500" },
  ];


  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Achievement Celebration Modal */}
      <AchievementCelebration 
        achievement={currentAchievement} 
        onClose={() => setCurrentAchievement(null)} 
      />

      {/* Level Up Celebration Modal */}
      <LevelUpCelebration 
        levelUpData={levelUpData} 
        onClose={clearLevelUp} 
      />

      {/* Header */}
      <header className="sticky top-0 z-50 glass neon-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity dark:opacity-70 dark:group-hover:opacity-100" />
                <div className="relative p-2.5 bg-gradient-to-r from-primary to-accent rounded-2xl shadow-lg neon-button">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent flex items-center justify-center pulse-glow">
                  <Sparkles className="w-2.5 h-2.5 text-accent-foreground" />
                </div>
              </div>
              <div>
                <h1 className="font-display font-bold text-xl text-foreground tracking-tight">
                  MULTIPLI<span className="text-gradient neon-text">XE</span>
                </h1>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">by Promo Brindes</p>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1 p-1 bg-muted/50 rounded-2xl neon-border">
              <Link 
                to="/dashboard" 
                className="px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-primary to-accent text-white rounded-xl shadow-lg neon-button"
              >
                Dashboard
              </Link>
              <Link 
                to="/catalogo" 
                className="px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-xl transition-colors"
              >
                Catálogo
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              {/* XP Badge */}
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl dark:border-emerald-500/40 dark:shadow-[0_0_20px_hsl(150_100%_45%/0.2)]">
                <Zap className="h-4 w-4 text-emerald-500 neon-icon" />
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{totalXP} XP</span>
              </div>

              <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-2xl neon-border">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm neon-button">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-foreground">{userName}</span>
              </div>
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleSignOut}
                className="rounded-xl border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 h-11 w-11 neon-border"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Hero Welcome Section */}
        <div className="relative mb-12 rounded-[2rem] overflow-hidden neon-card">
          {/* Background with mesh */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-background dark:from-primary/30 dark:via-accent/20 dark:to-background" />
          <div className="absolute inset-0 opacity-30 dark:opacity-50" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--primary) / 0.2) 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }} />
          
          {/* Glowing orbs - more intense in dark mode */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-primary/30 to-accent/20 dark:from-primary/50 dark:to-accent/40 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-br from-accent/20 to-warning/10 dark:from-accent/40 dark:to-secondary/30 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4" />
          
          {/* Floating elements with neon glow */}
          <div className="absolute top-8 right-8 animate-float">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-xl shadow-orange-500/30 rotate-12 dark:shadow-[0_0_30px_hsl(25_100%_55%/0.5)]">
              <Crown className="h-7 w-7 text-white" />
            </div>
          </div>
          <div className="absolute top-24 right-32 animate-float" style={{ animationDelay: '0.5s' }}>
            <div className="w-11 h-11 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 -rotate-6 dark:shadow-[0_0_25px_hsl(150_100%_45%/0.5)]">
              <Zap className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="absolute bottom-12 right-16 animate-float" style={{ animationDelay: '1s' }}>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30 rotate-6 dark:shadow-[0_0_25px_hsl(320_100%_65%/0.5)]">
              <Star className="h-5 w-5 text-white" />
            </div>
          </div>

          <div className="relative z-10 p-8 md:p-12 lg:p-16">
            <div className="max-w-3xl">
              {/* Welcome Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6 dark:bg-primary/10 dark:border-primary/30 dark:shadow-[0_0_20px_hsl(270_100%_70%/0.2)]">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse dark:shadow-[0_0_10px_hsl(150_100%_45%/0.8)]" />
                <span className="text-sm font-semibold text-foreground">Bem-vindo de volta!</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-4 leading-tight">
                Olá, <span className="text-gradient neon-text">{userName}</span>! 
                <span className="inline-block animate-bounce ml-2">👋</span>
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-8">
                Continue sua jornada de aprendizado. Cada aula te aproxima mais dos seus objetivos profissionais!
              </p>

              {/* Quick actions */}
              <Button 
                asChild 
                size="lg"
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white rounded-2xl h-14 px-8 text-base font-semibold shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5 group neon-button"
              >
                <Link to="/catalogo">
                  <Rocket className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
                  Explorar Cursos
                  <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div
                key={stat.label}
                className={`group relative rounded-3xl bg-card/80 backdrop-blur-sm border border-border/50 p-6 overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ${stat.glowColor} animate-fade-in neon-card`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Gradient glow on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity duration-500`} />
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-2xl bg-gradient-to-br ${stat.gradient} shadow-lg ${stat.glowColor} group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 dark:shadow-[0_0_25px_currentColor]`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity neon-icon" />
                  </div>
                  <div className="text-4xl font-display font-bold text-foreground mb-1 dark:drop-shadow-[0_0_10px_currentColor]">
                    {stat.value}
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-xs text-muted-foreground/70">{stat.subtitle}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Level Progress Section */}
        <section className="mb-12 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <LevelProgress totalXP={totalXP} />
        </section>

        {/* Achievements Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 dark:border-amber-500/40 dark:shadow-[0_0_20px_hsl(25_100%_55%/0.3)]">
                <Trophy className="h-6 w-6 text-amber-500 neon-icon" />
              </div>
              <div>
                <h3 className="text-2xl font-display font-bold text-foreground">Conquistas</h3>
                <p className="text-sm text-muted-foreground">Seus badges e troféus</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {achievements.map((achievement, index) => {
              const IconComponent = achievement.icon;
              return (
                <div
                  key={achievement.name}
                  className={`group relative p-6 rounded-2xl border transition-all duration-300 neon-card ${
                    achievement.unlocked 
                      ? 'bg-card/80 border-border/50 hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-[0_0_30px_hsl(270_100%_70%/0.3)]' 
                      : 'bg-muted/30 border-border/30 opacity-50'
                  }`}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
                      achievement.unlocked 
                        ? `bg-gradient-to-br ${achievement.gradient} shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 dark:shadow-[0_0_25px_currentColor]` 
                        : 'bg-muted'
                    }`}>
                      <IconComponent className={`h-8 w-8 ${achievement.unlocked ? 'text-white' : 'text-muted-foreground'}`} />
                      {achievement.unlocked && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center dark:shadow-[0_0_15px_hsl(150_100%_45%/0.8)]">
                          <Sparkles className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <p className={`font-semibold ${achievement.unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {achievement.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {achievement.unlocked ? 'Desbloqueado!' : 'Bloqueado'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Continue Learning Section */}
        {userProgress.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 dark:border-primary/40 dark:shadow-[0_0_20px_hsl(270_100%_70%/0.3)]">
                  <TrendingUp className="h-6 w-6 text-primary neon-icon" />
                </div>
                <div>
                  <h3 className="text-2xl font-display font-bold text-foreground">Continue Aprendendo</h3>
                  <p className="text-sm text-muted-foreground">Retome seus cursos em andamento</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                asChild
                className="rounded-xl gap-2 text-primary hover:text-primary hover:bg-primary/10 neon-button"
              >
                <Link to="/catalogo">
                  Ver todos
                  <ArrowRight className="h-4 w-4 neon-icon" />
                </Link>
              </Button>
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
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-warning/10 to-orange-500/10 border border-warning/20 dark:border-warning/40 dark:shadow-[0_0_20px_hsl(45_100%_55%/0.3)]">
                  <Sparkles className="h-6 w-6 text-warning neon-icon" />
                </div>
                <div>
                  <h3 className="text-2xl font-display font-bold text-foreground">Cursos em Destaque</h3>
                  <p className="text-sm text-muted-foreground">Os mais populares da plataforma</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                asChild
                className="rounded-xl border-2 border-border/50 gap-2 hover:bg-primary/5 hover:border-primary/50 hover:text-primary font-semibold neon-border"
              >
                <Link to="/catalogo">
                  Ver catálogo
                  <ArrowRight className="h-4 w-4 neon-icon" />
                </Link>
              </Button>
          </div>

          {loadingCourses ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-3xl bg-card/50 border border-border/50 overflow-hidden">
                  <div className="aspect-[16/10] bg-gradient-to-br from-muted to-muted/50 animate-pulse" />
                  <div className="p-5 space-y-4">
                    <div className="h-5 bg-muted rounded-lg w-3/4 animate-pulse" />
                    <div className="h-4 bg-muted rounded-lg w-full animate-pulse" />
                    <div className="h-4 bg-muted rounded-lg w-1/2 animate-pulse" />
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
            <div className="relative rounded-3xl border-2 border-dashed border-border/50 bg-gradient-to-br from-card/50 to-muted/30 overflow-hidden neon-card">
              {/* Background decoration */}
              <div className="absolute inset-0">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-transparent dark:from-primary/30 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-br from-accent/10 to-transparent dark:from-accent/30 rounded-full blur-3xl" />
              </div>
              
              <div className="relative flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-accent/30 dark:from-primary/50 dark:to-accent/50 rounded-full blur-2xl animate-pulse" />
                  <div className="relative p-8 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full border border-primary/20 dark:border-primary/40 dark:shadow-[0_0_30px_hsl(270_100%_70%/0.3)]">
                    <BookOpen className="h-16 w-16 text-primary neon-icon" />
                  </div>
                </div>
                <h4 className="text-3xl font-display font-bold text-foreground mb-3">
                  Explore o catálogo
                </h4>
                <p className="text-lg text-muted-foreground max-w-md mb-8">
                  Descubra cursos incríveis para desenvolver suas habilidades e impulsionar sua carreira
                </p>
                <Button 
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white rounded-2xl h-14 px-8 font-semibold shadow-xl shadow-primary/25 gap-2 neon-button"
                >
                  <Link to="/catalogo">
                    <Sparkles className="h-5 w-5" />
                    Ver Catálogo
                    <ArrowRight className="h-5 w-5" />
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

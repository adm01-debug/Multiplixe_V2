import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserXP } from '@/hooks/useUserXP';
import { useAchievements } from '@/hooks/useAchievements';
import { useCertificates } from '@/hooks/useCertificates';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import LevelProgress from '@/components/LevelProgress';
import AchievementsGrid from '@/components/AchievementsGrid';
import XPEvolutionChart from '@/components/XPEvolutionChart';
import { CertificateCard } from '@/components/CertificateCard';
import { calculateUserLevel } from '@/lib/levelSystem';
import EmptyState from '@/components/EmptyState';
import { ProfileSkeleton, DashboardStatsSkeleton, AchievementsGridSkeleton, CertificateCardSkeleton, ChartSkeleton } from '@/components/skeletons/PageSkeletons';
import {
  GraduationCap,
  LogOut,
  ArrowLeft,
  Sparkles,
  Trophy,
  Zap,
  BookOpen,
  Target,
  Flame,
  Calendar,
  TrendingUp,
  Award,
  Star,
  CheckCircle,
  Clock,
  BarChart3,
  User,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

interface UserStats {
  totalLessonsCompleted: number;
  totalCoursesCompleted: number;
  totalCoursesInProgress: number;
  totalWatchedMinutes: number;
  memberSince: string;
}

interface Certificate {
  id: string;
  user_id: string;
  course_id: string;
  verification_code: string;
  issued_at: string;
  user_name: string;
  course_title: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { userXP, totalXP, loading: loadingXP } = useUserXP();
  const { achievements, isUnlocked, unlockedCount, totalCount } = useAchievements();
  const { getUserCertificates } = useCertificates();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      setLoadingStats(true);

      try {
        const [lessonsRes, coursesRes, profileRes, userCertificates] = await Promise.all([
          supabase
            .from('user_lesson_progress')
            .select('is_completed, watched_seconds')
            .eq('user_id', user.id),
          supabase
            .from('user_course_progress')
            .select('progress_percentage')
            .eq('user_id', user.id),
          supabase
            .from('profiles')
            .select('created_at')
            .eq('user_id', user.id)
            .maybeSingle(),
          getUserCertificates(user.id),
        ]);

        const lessonsCompleted = lessonsRes.data?.filter(l => l.is_completed).length || 0;
        const totalWatchedSeconds = lessonsRes.data?.reduce((acc, l) => acc + (l.watched_seconds || 0), 0) || 0;
        const coursesCompleted = coursesRes.data?.filter(c => c.progress_percentage === 100).length || 0;
        const coursesInProgress = coursesRes.data?.filter(c => c.progress_percentage > 0 && c.progress_percentage < 100).length || 0;

        setStats({
          totalLessonsCompleted: lessonsCompleted,
          totalCoursesCompleted: coursesCompleted,
          totalCoursesInProgress: coursesInProgress,
          totalWatchedMinutes: Math.round(totalWatchedSeconds / 60),
          memberSince: profileRes.data?.created_at || user.created_at,
        });
        
        setCertificates(userCertificates);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [user, getUserCertificates]);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Até logo!');
    navigate('/');
  };

  if (loading || loadingXP) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        {/* Header Skeleton */}
        <header className="sticky top-0 z-50 glass neon-border">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-muted animate-pulse" />
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-muted animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-5 w-32 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-20 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-muted animate-pulse" />
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 space-y-12">
          {/* Profile Header Skeleton */}
          <div className="rounded-[2rem] bg-card/50 border border-border/50 p-8 md:p-12">
            <ProfileSkeleton />
          </div>

          {/* Stats Skeleton */}
          <DashboardStatsSkeleton />

          {/* Chart Skeleton */}
          <div className="space-y-4">
            <div className="h-8 w-48 bg-muted rounded animate-pulse" />
            <ChartSkeleton height={300} />
          </div>

          {/* Achievements Skeleton */}
          <div className="space-y-4">
            <div className="h-8 w-32 bg-muted rounded animate-pulse" />
            <AchievementsGridSkeleton count={8} />
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Colaborador';
  const userEmail = user.email || '';
  const userLevel = calculateUserLevel(totalXP);
  const memberSinceDate = stats?.memberSince ? new Date(stats.memberSince).toLocaleDateString('pt-BR', { 
    year: 'numeric', 
    month: 'long' 
  }) : '';

  const xpBreakdown = [
    { 
      label: 'Aulas', 
      value: userXP?.xp_from_lessons || 0, 
      icon: BookOpen, 
      gradient: 'from-blue-500 to-cyan-500',
      color: 'text-blue-500'
    },
    { 
      label: 'Cursos', 
      value: userXP?.xp_from_courses || 0, 
      icon: Trophy, 
      gradient: 'from-amber-500 to-orange-500',
      color: 'text-amber-500'
    },
    { 
      label: 'Conquistas', 
      value: userXP?.xp_from_achievements || 0, 
      icon: Award, 
      gradient: 'from-purple-500 to-pink-500',
      color: 'text-purple-500'
    },
    { 
      label: 'Sequências', 
      value: userXP?.xp_from_streaks || 0, 
      icon: Flame, 
      gradient: 'from-rose-500 to-red-500',
      color: 'text-rose-500'
    },
  ];

  const statCards = [
    { 
      label: 'Aulas Concluídas', 
      value: stats?.totalLessonsCompleted || 0, 
      icon: CheckCircle,
      gradient: 'from-emerald-500 to-teal-500'
    },
    { 
      label: 'Cursos Concluídos', 
      value: stats?.totalCoursesCompleted || 0, 
      icon: Trophy,
      gradient: 'from-amber-500 to-orange-500'
    },
    { 
      label: 'Em Progresso', 
      value: stats?.totalCoursesInProgress || 0, 
      icon: TrendingUp,
      gradient: 'from-blue-500 to-cyan-500'
    },
    { 
      label: 'Minutos Assistidos', 
      value: stats?.totalWatchedMinutes || 0, 
      icon: Clock,
      gradient: 'from-purple-500 to-pink-500'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 glass neon-border">
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
              <Link to="/dashboard" className="flex items-center gap-3 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                  <div className="relative p-2.5 bg-gradient-to-r from-primary to-accent rounded-2xl shadow-lg neon-button">
                    <GraduationCap className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="font-display font-bold text-xl text-foreground tracking-tight">
                    MULTIPLI<span className="text-gradient neon-text">XE</span>
                  </h1>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">by Promo Brindes</p>
                </div>
              </Link>
            </div>

            <Button 
              variant="outline" 
              size="icon"
              onClick={handleSignOut}
              className="rounded-xl border-border/50 hover:bg-destructive/10 hover:text-destructive h-11 w-11"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="relative mb-12 rounded-[2rem] overflow-hidden neon-card">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-background" />
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-primary/30 to-accent/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4" />
          
          <div className="relative z-10 p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full blur-xl opacity-50" />
                <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-xl">
                  <span className="text-4xl md:text-5xl font-bold">{userName.charAt(0).toUpperCase()}</span>
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                  <span className="text-lg">{userLevel.currentLevel.icon}</span>
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                    {userName}
                  </h2>
                  <div className="px-3 py-1 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                    <span className="text-sm font-semibold text-primary">Nível {userLevel.currentLevel.level}</span>
                  </div>
                </div>
                <p className="text-muted-foreground mb-1">{userEmail}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Membro desde {memberSinceDate}</span>
                </div>
              </div>

              {/* XP Badge */}
              <div className="flex flex-col items-center p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                <Zap className="h-8 w-8 text-emerald-500 mb-2" />
                <span className="text-3xl font-display font-bold text-emerald-500">{totalXP}</span>
                <span className="text-sm text-muted-foreground">XP Total</span>
              </div>
            </div>
          </div>
        </div>

        {/* Level Progress */}
        <section className="mb-12">
          <LevelProgress totalXP={totalXP} />
        </section>

        {/* XP Breakdown */}
        <section className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
              <BarChart3 className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-2xl font-display font-bold text-foreground">Distribuição de XP</h3>
              <p className="text-sm text-muted-foreground">Como você ganhou seus pontos</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {xpBreakdown.map((item) => {
              const IconComponent = item.icon;
              const percentage = totalXP > 0 ? Math.round((item.value / totalXP) * 100) : 0;
              
              return (
                <div
                  key={item.label}
                  className="group relative p-6 rounded-2xl bg-card/80 border border-border/50 neon-card hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-xl bg-gradient-to-br ${item.gradient}`}>
                      <IconComponent className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">{item.label}</span>
                  </div>
                  
                  <div className="mb-3">
                    <span className={`text-2xl font-display font-bold ${item.color}`}>{item.value}</span>
                    <span className="text-muted-foreground ml-1">XP</span>
                  </div>
                  
                  <div className="space-y-1">
                    <Progress value={percentage} className="h-2" />
                    <span className="text-xs text-muted-foreground">{percentage}% do total</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* XP Evolution Chart */}
        <section className="mb-12">
          <XPEvolutionChart />
        </section>

        {/* Statistics */}
        <section className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
              <Target className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h3 className="text-2xl font-display font-bold text-foreground">Estatísticas</h3>
              <p className="text-sm text-muted-foreground">Seu progresso de aprendizado</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map((stat) => {
              const IconComponent = stat.icon;
              
              return (
                <div
                  key={stat.label}
                  className="group relative p-6 rounded-2xl bg-card/80 border border-border/50 neon-card hover:-translate-y-1 transition-all duration-300"
                >
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-3xl font-display font-bold text-foreground mb-1">
                    {stat.value}
                  </div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Certificates */}
        <section className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/20">
              <FileText className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <h3 className="text-2xl font-display font-bold text-foreground">Certificados</h3>
              <p className="text-sm text-muted-foreground">
                {certificates.length > 0 
                  ? `${certificates.length} certificado${certificates.length !== 1 ? 's' : ''} emitido${certificates.length !== 1 ? 's' : ''}`
                  : 'Complete cursos para receber certificados'
                }
              </p>
            </div>
          </div>

          {certificates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {certificates.map((cert) => (
                <CertificateCard key={cert.id} certificate={cert} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-border/50 bg-card/50 neon-card">
              <EmptyState
                type="certificates"
                actionLabel="Explorar cursos"
                onAction={() => navigate('/catalogo')}
              />
            </div>
          )}
        </section>

        {/* Achievements */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                <Trophy className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <h3 className="text-2xl font-display font-bold text-foreground">Conquistas</h3>
                <p className="text-sm text-muted-foreground">{unlockedCount} de {totalCount} desbloqueadas</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20">
              <Star className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-semibold text-amber-500">
                {Math.round((unlockedCount / totalCount) * 100) || 0}%
              </span>
            </div>
          </div>

          <AchievementsGrid achievements={achievements} isUnlocked={isUnlocked} />
        </section>
      </main>
    </div>
  );
};

export default Profile;

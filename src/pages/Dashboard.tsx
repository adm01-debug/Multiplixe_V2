import { useEffect, useState, lazy, Suspense } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useUserXP } from '@/hooks/useUserXP';
import { useLevelUp } from '@/hooks/useLevelUp';
import { useAchievements } from '@/hooks/useAchievements';
import { useStreaks } from '@/hooks/useStreaks';
import { useAdminRole } from '@/hooks/useAdminRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import CourseCard from '@/components/catalog/CourseCard';
import AchievementCelebration from '@/components/AchievementCelebration';
import LevelUpCelebration from '@/components/LevelUpCelebration';
import AchievementUnlocked from '@/components/AchievementUnlocked';
import LevelProgress from '@/components/LevelProgress';
import AchievementsGrid from '@/components/AchievementsGrid';
import StreakDisplay from '@/components/StreakDisplay';
import WelcomeWizard from '@/components/onboarding/WelcomeWizard';
import OnboardingTutorial, { useOnboardingTutorial } from '@/components/onboarding/OnboardingTutorial';
import ProfileCompletionBar from '@/components/onboarding/ProfileCompletionBar';
import GoalsWidget from '@/components/goals/GoalsWidget';
import ContinueLearningWidget from '@/components/dashboard/ContinueLearningWidget';
import FavoritesSection from '@/components/favorites/FavoritesSection';
import OnboardingWidget from '@/components/dashboard/OnboardingWidget';
import DueAssessmentsWidget from '@/components/dashboard/DueAssessmentsWidget';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StudyCalendar from '@/components/calendar/StudyCalendar';
import StudySchedulePanel from '@/components/calendar/StudySchedulePanel';
import { useStudyCalendar } from '@/hooks/useStudyCalendar';

// Lazy load heavy widgets (recharts/framer)
import SeasonalEventBanner from '@/components/gamification/SeasonalEventBanner';

const SmartRecommendations = lazy(() => import('@/components/dashboard/SmartRecommendations'));
const DailyChallenges = lazy(() => import('@/components/gamification/DailyChallenges'));
const SkillRadarChart = lazy(() => import('@/components/analytics/SkillRadarChart'));
const WidgetFallback = () => <Skeleton className="h-48 w-full rounded-2xl" />;
import DashboardHero from '@/components/dashboard/DashboardHero';
import DashboardStatsGrid, { StatItem } from '@/components/dashboard/DashboardStatsGrid';
import { DashboardStatsSkeleton, HeroSkeleton, CourseGridSkeleton } from '@/components/skeletons/PageSkeletons';
import { useCourses } from '@/hooks/useCachedQuery';
import { useFavorites } from '@/hooks/useFavorites';
import type { ContinueCourseData, PathSuggestion } from '@/lib/continueLearning';
import {
  Trophy, Loader2, Sparkles, Flame, Zap, TrendingUp, Play, ArrowRight, CalendarDays,
} from 'lucide-react';
import { toast } from 'sonner';

const sectionVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 80, damping: 20 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 12 } }
};
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
} as const;

interface Course {
  id: string; title: string; slug: string; description: string | null; thumbnail_url: string | null;
  duration_minutes: number; level: string; instructor_name: string | null; total_lessons: number;
  is_featured: boolean; categories: { name: string; color: string | null } | null;
}
interface UserProgress { course_id: string; progress_percentage: number; last_accessed_at?: string | null; courses: Course; }
interface Achievement { id: string; type: 'xp' | 'badge' | 'streak' | 'course'; title: string; description: string; value?: number; }

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading, signOut } = useAuth();
  const { totalXP, loading: loadingXP, refetch: refetchXP } = useUserXP();
  const { levelUpData, clearLevelUp } = useLevelUp(totalXP);
  const { achievements: allAchievements, newAchievements, dismissAchievement, checkAchievements, isUnlocked, unlockedCount, totalCount } = useAchievements();
  const { currentStreak, longestStreak, isStreakAtRisk, hasStudiedToday } = useStreaks();
  const { currentMonth, setCurrentMonth, goToToday, scheduleItems, isLoading: calendarLoading } = useStudyCalendar();
  const { isAdmin } = useAdminRole();
  const { isStale: coursesStale, isFetching: coursesFetching, refetch: refetchCourses } = useCourses();
  const { favorites } = useFavorites();

  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [pathSuggestion, setPathSuggestion] = useState<PathSuggestion | null>(null);
  const [favoriteSuggestion, setFavoriteSuggestion] = useState<ContinueCourseData | null>(null);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);
  const [currentNewAchievement, setCurrentNewAchievement] = useState<typeof newAchievements[0] | null>(null);
  const [showWelcomeWizard, setShowWelcomeWizard] = useState(false);
  const { shouldShow: showTutorial, startTutorial, completeTutorial } = useOnboardingTutorial();

  useEffect(() => { if (user) { const done = localStorage.getItem(`onboarding_completed_${user.id}`); if (!done) setShowWelcomeWizard(true); } }, [user]);
  const handleOnboardingComplete = () => { setShowWelcomeWizard(false); startTutorial(); };
  const handleTutorialComplete = () => { completeTutorial(); };

  useEffect(() => { if (totalXP > 0) checkAchievements(); }, [totalXP, checkAchievements]);
  useEffect(() => { if (newAchievements.length > 0 && !currentNewAchievement) setCurrentNewAchievement(newAchievements[0]); }, [newAchievements, currentNewAchievement]);
  const handleDismissNewAchievement = () => { if (currentNewAchievement) { dismissAchievement(currentNewAchievement.id); setCurrentNewAchievement(null); refetchXP(); } };

  useEffect(() => {
    const celebrationType = searchParams.get('celebrate');
    const xpAmount = searchParams.get('xp');
    const badgeName = searchParams.get('badge');
    if (celebrationType) {
      const achievementMap: Record<string, Achievement> = {
        xp: { id: 'xp-gain', type: 'xp', title: 'XP Conquistado!', description: 'Continue aprendendo!', value: xpAmount ? parseInt(xpAmount) : 50 },
        badge: { id: 'badge-earned', type: 'badge', title: badgeName || 'Nova Conquista!', description: 'Você desbloqueou uma nova conquista!' },
        course: { id: 'course-complete', type: 'course', title: 'Curso Concluído!', description: 'Parabéns! Você completou mais um curso!' },
        streak: { id: 'streak', type: 'streak', title: 'Sequência Mantida!', description: 'Você está em uma sequência de estudos!' },
      };
      const achievement = achievementMap[celebrationType];
      if (achievement) { setCurrentAchievement(achievement); setSearchParams({}); }
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => { if (!loading && !user) navigate('/auth'); }, [user, loading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoadingCourses(true);
      const [coursesRes, progressRes] = await Promise.all([
        supabase.from('courses').select('*, categories(*)').eq('is_published', true).eq('is_featured', true).limit(4),
        supabase.from('user_course_progress').select('course_id, progress_percentage, last_accessed_at, courses(*, categories(*))').eq('user_id', user.id).order('last_accessed_at', { ascending: false }).limit(4),
      ]);
      if (coursesRes.data) setFeaturedCourses(coursesRes.data as Course[]);
      if (progressRes.data) setUserProgress(progressRes.data as unknown as UserProgress[]);
      setLoadingCourses(false);
    };
    fetchData();
  }, [user]);

  // P2: next course from active learning path (only when no in-progress course)
  useEffect(() => {
    const fetchPathSuggestion = async () => {
      if (!user) return;
      const hasInProgress = userProgress.some(p => p.progress_percentage > 0 && p.progress_percentage < 100);
      if (hasInProgress) { setPathSuggestion(null); return; }

      const { data: activePath } = await supabase
        .from('user_learning_path_progress')
        .select('learning_path_id, learning_paths(title)')
        .eq('user_id', user.id)
        .is('completed_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!activePath?.learning_path_id) { setPathSuggestion(null); return; }

      const { data: pathCourses } = await supabase
        .from('learning_path_courses')
        .select('course_id, order_index, courses(id, title, slug, thumbnail_url, duration_minutes, total_lessons, instructor_name, description, level)')
        .eq('learning_path_id', activePath.learning_path_id)
        .order('order_index', { ascending: true });

      if (!pathCourses?.length) { setPathSuggestion(null); return; }

      const completedIds = new Set(userProgress.filter(p => p.progress_percentage === 100).map(p => p.course_id));
      const next = pathCourses.find(pc => !completedIds.has(pc.course_id));
      if (!next?.courses) { setPathSuggestion(null); return; }

      const pathTitle = (activePath as unknown as { learning_paths?: { title?: string } }).learning_paths?.title ?? '';
      setPathSuggestion({ course: next.courses as ContinueCourseData, pathName: pathTitle });
    };
    fetchPathSuggestion();
  }, [user, userProgress]);

  // P3: favorite course without progress
  useEffect(() => {
    const fetchFavoriteSuggestion = async () => {
      if (!user || favorites.length === 0) { setFavoriteSuggestion(null); return; }
      const progressedIds = new Set(userProgress.map(p => p.course_id));
      const candidate = favorites.find(f => !progressedIds.has(f.course_id));
      if (!candidate) { setFavoriteSuggestion(null); return; }

      const { data } = await supabase
        .from('courses')
        .select('id, title, slug, thumbnail_url, duration_minutes, total_lessons, instructor_name, description, level')
        .eq('id', candidate.course_id)
        .maybeSingle();
      setFavoriteSuggestion((data as ContinueCourseData) ?? null);
    };
    fetchFavoriteSuggestion();
  }, [user, favorites, userProgress]);

  const handleSignOut = async () => { await signOut(); toast.success('Até logo!'); navigate('/'); };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20" aria-busy="true" aria-label="Carregando dashboard">
        <div className="container mx-auto px-4 py-8 space-y-8">
          <HeroSkeleton />
          <DashboardStatsSkeleton />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
          <Skeleton className="h-48 rounded-2xl" />
          <CourseGridSkeleton count={4} />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Colaborador';
  const inProgressCount = userProgress.filter(p => p.progress_percentage > 0 && p.progress_percentage < 100).length;
  const completedCount = userProgress.filter(p => p.progress_percentage === 100).length;

  const stats: StatItem[] = [
    { label: "Cursos em Andamento", value: inProgressCount, subtitle: "Continue de onde parou", icon: Play, gradient: "from-primary to-accent", glowColor: "shadow-primary/25", tooltip: "Cursos em que voc\u00ea come\u00e7ou mas ainda n\u00e3o concluiu" },
    { label: "Cursos Concluídos", value: completedCount, subtitle: "Certificados conquistados", icon: Trophy, gradient: "from-amber-500 to-orange-500", glowColor: "shadow-amber-500/25", tooltip: "Cursos com 100% das aulas conclu\u00eddas" },
    { label: "XP Total", value: totalXP, subtitle: "Pontos de experiência", icon: Zap, gradient: "from-emerald-500 to-teal-500", glowColor: "shadow-emerald-500/25", tooltip: "Soma de XP por aulas, cursos, conquistas e sequ\u00eancias" },
    { label: "Sequência", value: `${currentStreak} ${currentStreak === 1 ? 'dia' : 'dias'}`, subtitle: isStreakAtRisk ? "⚠️ Em risco!" : "Mantenha o ritmo!", icon: Flame, gradient: "from-rose-500 to-pink-500", glowColor: "shadow-rose-500/25", tooltip: "Dias seguidos com pelo menos uma aula conclu\u00edda" }
  ];

  if (showWelcomeWizard) return <WelcomeWizard onComplete={handleOnboardingComplete} />;
  if (showTutorial) return <OnboardingTutorial onComplete={handleTutorialComplete} onSkip={handleTutorialComplete} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 relative">
      <AchievementCelebration achievement={currentAchievement} onClose={() => setCurrentAchievement(null)} />
      <LevelUpCelebration levelUpData={levelUpData} onClose={clearLevelUp} />
      <AchievementUnlocked achievement={currentNewAchievement} onClose={handleDismissNewAchievement} />

      <DashboardHeader userName={userName} totalXP={totalXP} isAdmin={isAdmin} coursesStale={coursesStale} coursesFetching={coursesFetching} onRefreshCourses={refetchCourses} onSignOut={handleSignOut} />

      <main className="container mx-auto px-4 py-8">
        <ProfileCompletionBar />
        <DashboardHero userName={userName} />
        <DashboardStatsGrid stats={stats} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <OnboardingWidget />
          <DueAssessmentsWidget />
        </div>

        <motion.section className="mb-12" variants={sectionVariants} initial="hidden" animate="visible" viewport={{ once: true }}>
          <ContinueLearningWidget
            userProgress={userProgress}
            learningPathSuggestion={pathSuggestion}
            favoriteSuggestion={favoriteSuggestion}
          />
        </motion.section>

        <motion.section className="mb-12" variants={sectionVariants} initial="hidden" animate="visible" viewport={{ once: true }}>
          <Suspense fallback={<WidgetFallback />}><SmartRecommendations /></Suspense>
        </motion.section>

                <motion.section className="mb-12" variants={sectionVariants} initial="hidden" animate="visible" viewport={{ once: true }}>
                  <FavoritesSection />
                </motion.section>

        <SeasonalEventBanner className="mb-12" />
        <motion.section className="mb-12" variants={sectionVariants} initial="hidden" animate="visible" viewport={{ once: true }}><Suspense fallback={<WidgetFallback />}><DailyChallenges /></Suspense></motion.section>
        <motion.section className="mb-12" variants={sectionVariants} initial="hidden" animate="visible" viewport={{ once: true }}><GoalsWidget /></motion.section>
        <motion.section className="mb-12" variants={sectionVariants} initial="hidden" animate="visible" viewport={{ once: true }}><LevelProgress totalXP={totalXP} /></motion.section>
        <motion.section className="mb-12" variants={sectionVariants} initial="hidden" animate="visible" viewport={{ once: true }}>
          <StreakDisplay currentStreak={currentStreak} longestStreak={longestStreak} isAtRisk={isStreakAtRisk} hasStudiedToday={hasStudiedToday} />
        </motion.section>

        <motion.section className="mb-12" variants={sectionVariants} initial="hidden" animate="visible" viewport={{ once: true }}>
          <motion.div className="flex items-center justify-between mb-6" variants={itemVariants}>
            <div className="flex items-center gap-4">
              <motion.div className="p-3 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20" whileHover={{ scale: 1.1, rotate: 5 }}>
                <CalendarDays className="h-6 w-6 text-primary neon-icon" />
              </motion.div>
              <div>
                <h3 className="text-2xl font-display font-bold text-foreground">Agenda de Estudos</h3>
                <p className="text-sm text-muted-foreground">Suas aulas, quizzes e conquistas do mês</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" aria-label="Voltar para o mês atual" onClick={goToToday} className="rounded-xl gap-2 text-primary hover:text-primary hover:bg-primary/10 neon-button">
              Hoje
            </Button>
          </motion.div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {calendarLoading ? <WidgetFallback /> : (
              <StudyCalendar currentMonth={currentMonth} onMonthChange={setCurrentMonth} scheduleItems={scheduleItems} />
            )}
            <StudySchedulePanel />
          </div>
        </motion.section>

        <motion.section className="mb-12" variants={sectionVariants} initial="hidden" animate="visible" viewport={{ once: true }}>
          <motion.div className="flex items-center justify-between mb-6" variants={itemVariants}>
            <div className="flex items-center gap-4">
              <motion.div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 dark:border-amber-500/40" whileHover={{ scale: 1.1, rotate: 5 }}>
                <Trophy className="h-6 w-6 text-amber-500 neon-icon" />
              </motion.div>
              <div>
                <h3 className="text-2xl font-display font-bold text-foreground">Conquistas</h3>
                <p className="text-sm text-muted-foreground">{unlockedCount} de {totalCount} desbloqueadas</p>
              </div>
            </div>
          </motion.div>
          <AchievementsGrid achievements={allAchievements} isUnlocked={isUnlocked} />
        </motion.section>

        <motion.section className="mb-12" variants={sectionVariants} initial="hidden" animate="visible" viewport={{ once: true }}><Suspense fallback={<WidgetFallback />}><SkillRadarChart /></Suspense></motion.section>

        {userProgress.length > 0 && (
          <motion.section className="mb-12" variants={sectionVariants} initial="hidden" animate="visible" viewport={{ once: true }}>
            <motion.div className="flex items-center justify-between mb-6" variants={itemVariants}>
              <div className="flex items-center gap-4">
                <motion.div className="p-3 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20" whileHover={{ scale: 1.1, rotate: 5 }}>
                  <TrendingUp className="h-6 w-6 text-primary neon-icon" />
                </motion.div>
                <div>
                  <h3 className="text-2xl font-display font-bold text-foreground">Continue Aprendendo</h3>
                  <p className="text-sm text-muted-foreground">Retome seus cursos em andamento</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" asChild className="rounded-xl gap-2 text-primary hover:text-primary hover:bg-primary/10 neon-button">
                <Link to="/catalogo">Ver todos<ArrowRight className="h-4 w-4 neon-icon" /></Link>
              </Button>
            </motion.div>
            <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" variants={containerVariants} initial="hidden" animate="visible" viewport={{ once: true }}>
              {userProgress.map((progress) => (
                <motion.div key={progress.course_id} variants={itemVariants}>
                  <CourseCard id={progress.courses.id} slug={progress.courses.slug} title={progress.courses.title} description={progress.courses.description}
                    thumbnailUrl={progress.courses.thumbnail_url} durationMinutes={progress.courses.duration_minutes} level={progress.courses.level}
                    instructorName={progress.courses.instructor_name} totalLessons={progress.courses.total_lessons}
                    categoryName={progress.courses.categories?.name} categoryColor={progress.courses.categories?.color || undefined} progress={progress.progress_percentage} />
                </motion.div>
              ))}
            </motion.div>
          </motion.section>
        )}

        <motion.section variants={sectionVariants} initial="hidden" animate="visible" viewport={{ once: true }}>
          <motion.div className="flex items-center justify-between mb-6" variants={itemVariants}>
            <div className="flex items-center gap-4">
              <motion.div className="p-3 rounded-2xl bg-gradient-to-br from-warning/10 to-orange-500/10 border border-warning/20" whileHover={{ scale: 1.1, rotate: 5 }}>
                <Sparkles className="h-6 w-6 text-warning neon-icon" />
              </motion.div>
              <div>
                <h3 className="text-2xl font-display font-bold text-foreground">Cursos em Destaque</h3>
                <p className="text-sm text-muted-foreground">Os mais populares da plataforma</p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild className="rounded-xl border-2 border-border/50 gap-2 hover:bg-primary/5 hover:border-primary/50 hover:text-primary font-semibold neon-border">
              <Link to="/catalogo">Ver catálogo<ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </motion.div>
          {loadingCourses ? <DashboardStatsSkeleton /> : (
            <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" variants={containerVariants} initial="hidden" animate="visible" viewport={{ once: true }}>
              {featuredCourses.map((course) => (
                <motion.div key={course.id} variants={itemVariants}>
                  <CourseCard id={course.id} slug={course.slug} title={course.title} description={course.description}
                    thumbnailUrl={course.thumbnail_url} durationMinutes={course.duration_minutes} level={course.level}
                    instructorName={course.instructor_name} totalLessons={course.total_lessons}
                    categoryName={course.categories?.name} categoryColor={course.categories?.color || undefined} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.section>
      </main>
    </div>
  );
};

export default Dashboard;

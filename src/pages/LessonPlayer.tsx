import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useConfetti } from "@/hooks/useConfetti";
import { useUserXP } from "@/hooks/useUserXP";
import { useAchievements } from "@/hooks/useAchievements";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import VideoPlayer from "@/components/player/VideoPlayer";
import LessonList from "@/components/player/LessonList";
import AchievementUnlocked from "@/components/AchievementUnlocked";
import { toast } from "sonner";
import {
  GraduationCap,
  LogOut,
  User,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Loader2,
  CheckCircle,
  Sparkles,
  TrendingUp,
  Trophy,
  Zap,
  Play,
} from "lucide-react";

interface Course {
  id: string;
  title: string;
  slug: string;
}

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  duration_seconds: number;
  order_index: number;
  is_free: boolean;
  course_id: string;
}

interface LessonProgress {
  lesson_id: string;
  is_completed: boolean;
  last_position_seconds: number;
}

const LessonPlayer = () => {
  const { slug, lessonId } = useParams<{ slug: string; lessonId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { fireLessonComplete, fireCourseComplete } = useConfetti();
  const { addXP, refetch: refetchXP } = useUserXP();
  const { checkAchievements, newAchievements, dismissAchievement } = useAchievements();
  const celebratedLessons = useRef<Set<string>>(new Set());

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [lessonsProgress, setLessonsProgress] = useState<LessonProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [currentNewAchievement, setCurrentNewAchievement] = useState<typeof newAchievements[0] | null>(null);

  // Show new achievements one by one
  useEffect(() => {
    if (newAchievements.length > 0 && !currentNewAchievement) {
      setCurrentNewAchievement(newAchievements[0]);
    }
  }, [newAchievements, currentNewAchievement]);

  const handleDismissNewAchievement = () => {
    if (currentNewAchievement) {
      dismissAchievement(currentNewAchievement.id);
      setCurrentNewAchievement(null);
      refetchXP();
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !slug) return;

      setLoading(true);

      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select("id, title, slug")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();

      if (courseError || !courseData) {
        toast.error("Curso não encontrado");
        navigate("/catalogo");
        return;
      }

      setCourse(courseData);

      const { data: lessonsData } = await supabase
        .from("lessons")
        .select("*")
        .eq("course_id", courseData.id)
        .order("order_index");

      if (lessonsData) {
        setLessons(lessonsData);

        if (lessonId) {
          const lesson = lessonsData.find((l) => l.id === lessonId);
          if (lesson) {
            setCurrentLesson(lesson);
          } else {
            if (lessonsData.length > 0) {
              navigate(`/curso/${slug}/aula/${lessonsData[0].id}`, { replace: true });
            }
          }
        } else if (lessonsData.length > 0) {
          navigate(`/curso/${slug}/aula/${lessonsData[0].id}`, { replace: true });
        }
      }

      const { data: progressData } = await supabase
        .from("user_lesson_progress")
        .select("lesson_id, is_completed, last_position_seconds")
        .eq("user_id", user.id)
        .eq("course_id", courseData.id);

      if (progressData) {
        setLessonsProgress(progressData);
      }

      setLoading(false);
    };

    fetchData();
  }, [user, slug, lessonId, navigate]);

  useEffect(() => {
    if (lessonId && lessons.length > 0) {
      const lesson = lessons.find((l) => l.id === lessonId);
      if (lesson) {
        setCurrentLesson(lesson);
      }
    }
  }, [lessonId, lessons]);

  const handleProgress = useCallback(
    async (currentTime: number, duration: number) => {
      if (!user || !currentLesson || !course) return;

      const isCompleted = currentTime / duration >= 0.9;

      try {
        const { error } = await supabase.from("user_lesson_progress").upsert(
          {
            user_id: user.id,
            lesson_id: currentLesson.id,
            course_id: course.id,
            last_position_seconds: Math.floor(currentTime),
            watched_seconds: Math.floor(currentTime),
            is_completed: isCompleted,
            completed_at: isCompleted ? new Date().toISOString() : null,
          },
          { onConflict: "user_id,lesson_id" }
        );

        if (!error && isCompleted) {
          const wasAlreadyCompleted = lessonsProgress.find((p) => p.lesson_id === currentLesson.id)?.is_completed;
          
          setLessonsProgress((prev) => {
            const existing = prev.find((p) => p.lesson_id === currentLesson.id);
            if (existing) {
              return prev.map((p) =>
                p.lesson_id === currentLesson.id ? { ...p, is_completed: true } : p
              );
            }
            return [
              ...prev,
              { lesson_id: currentLesson.id, is_completed: true, last_position_seconds: Math.floor(currentTime) },
            ];
          });

          // Fire confetti and add XP only once per lesson
          if (!wasAlreadyCompleted && !celebratedLessons.current.has(currentLesson.id)) {
            celebratedLessons.current.add(currentLesson.id);
            
            // Check if this completes the course
            const newCompletedCount = lessonsProgress.filter((p) => p.is_completed).length + 1;
            if (newCompletedCount >= lessons.length) {
              fireCourseComplete();
              // Award XP for completing the course (100 XP)
              await addXP(100, 'course');
              toast.success("🏆 Parabéns! Você concluiu o curso! +100 XP", { duration: 5000 });
            } else {
              fireLessonComplete();
              // Award XP for completing a lesson (25 XP)
              await addXP(25, 'lesson');
              toast.success("🎉 Aula concluída! +25 XP Continue assim!");
            }

            // Check for new achievements after XP is awarded
            await checkAchievements();
          }

          await updateCourseProgress();
        }
      } catch (error) {
        console.error("Error saving progress:", error);
      }
    },
    [user, currentLesson, course]
  );

  const updateCourseProgress = async () => {
    if (!user || !course || lessons.length === 0) return;

    const completedCount = lessonsProgress.filter((p) => p.is_completed).length + 1;
    const progressPercentage = Math.round((completedCount / lessons.length) * 100);

    await supabase.from("user_course_progress").upsert(
      {
        user_id: user.id,
        course_id: course.id,
        progress_percentage: progressPercentage,
        last_accessed_at: new Date().toISOString(),
        completed_at: progressPercentage === 100 ? new Date().toISOString() : null,
      },
      { onConflict: "user_id,course_id" }
    );
  };

  const handleComplete = async () => {
    if (!currentLesson) return;

    const currentIndex = lessons.findIndex((l) => l.id === currentLesson.id);
    if (currentIndex < lessons.length - 1) {
      const nextLesson = lessons[currentIndex + 1];
      navigate(`/curso/${slug}/aula/${nextLesson.id}`);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const goToPreviousLesson = () => {
    if (!currentLesson) return;
    const currentIndex = lessons.findIndex((l) => l.id === currentLesson.id);
    if (currentIndex > 0) {
      navigate(`/curso/${slug}/aula/${lessons[currentIndex - 1].id}`);
    }
  };

  const goToNextLesson = () => {
    if (!currentLesson) return;
    const currentIndex = lessons.findIndex((l) => l.id === currentLesson.id);
    if (currentIndex < lessons.length - 1) {
      navigate(`/curso/${slug}/aula/${lessons[currentIndex + 1].id}`);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-secondary animate-spin-slow" />
            <div className="absolute inset-2 bg-background rounded-full" />
            <Loader2 className="absolute inset-0 m-auto h-6 w-6 animate-spin text-primary" />
          </div>
          <p className="text-muted-foreground font-medium animate-pulse">Carregando aula...</p>
        </div>
      </div>
    );
  }

  if (!user || !course || !currentLesson) {
    return null;
  }

  const userName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Colaborador";
  const currentIndex = lessons.findIndex((l) => l.id === currentLesson.id);
  const completedCount = lessonsProgress.filter((p) => p.is_completed).length;
  const courseProgress = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;
  const currentProgress = lessonsProgress.find((p) => p.lesson_id === currentLesson.id);
  const isFirstLesson = currentIndex === 0;
  const isLastLesson = currentIndex === lessons.length - 1;

  return (
    <>
      {/* Achievement Unlocked Modal */}
      <AchievementUnlocked 
        achievement={currentNewAchievement} 
        onClose={handleDismissNewAchievement} 
      />
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-2xl">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="flex items-center gap-2 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-xl blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
                  <div className="relative p-2 bg-gradient-to-r from-primary to-secondary rounded-xl">
                    <GraduationCap className="h-5 w-5 text-white" />
                  </div>
                </div>
                <span className="font-display font-bold text-foreground hidden sm:block">MULTIPLIXE</span>
              </Link>
              <div className="h-6 w-px bg-border/50" />
              <Link
                to={`/curso/${slug}`}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm px-3 py-1.5 rounded-lg hover:bg-muted/50"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline max-w-[200px] truncate">{course.title}</span>
                <span className="sm:hidden">Voltar</span>
              </Link>
            </div>

            <div className="flex items-center gap-3">
              {/* Progress indicator */}
              <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-xl">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">{courseProgress}%</span>
                </div>
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
                    style={{ width: `${courseProgress}%` }}
                  />
                </div>
              </div>
              
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-xl">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <User className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">{userName}</span>
              </div>
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleSignOut}
                className="rounded-xl border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Video Area */}
        <main className={`flex-1 flex flex-col transition-all duration-300 ${showSidebar ? 'lg:mr-80 xl:mr-96' : ''}`}>
          <div className="flex-1 p-4 lg:p-6">
            {/* Video Player */}
            <div className="rounded-2xl overflow-hidden shadow-2xl mb-6">
              {currentLesson.video_url ? (
                <VideoPlayer
                  src={currentLesson.video_url}
                  title={currentLesson.title}
                  onProgress={handleProgress}
                  onComplete={handleComplete}
                  initialPosition={currentProgress?.last_position_seconds || 0}
                />
              ) : (
                <div className="aspect-video bg-gradient-to-br from-primary/20 via-secondary/15 to-accent/10 flex flex-col items-center justify-center gap-4">
                  <div className="p-6 bg-card/50 backdrop-blur-sm rounded-full">
                    <Play className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground font-medium">Vídeo não disponível</p>
                </div>
              )}
            </div>

            {/* Lesson Info */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">
                    Aula {currentIndex + 1} de {lessons.length}
                  </span>
                </div>
                {currentProgress?.is_completed && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm font-semibold text-emerald-600">Concluída</span>
                  </div>
                )}
              </div>
              
              <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
                {currentLesson.title}
              </h1>
              
              {currentLesson.description && (
                <p className="text-muted-foreground leading-relaxed max-w-3xl">
                  {currentLesson.description}
                </p>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-8 mt-8 border-t border-border/50">
              <Button
                variant="outline"
                onClick={goToPreviousLesson}
                disabled={isFirstLesson}
                className="h-12 px-6 rounded-xl border-border/50 gap-2 hover:bg-muted/50 disabled:opacity-50"
              >
                <ChevronLeft className="h-5 w-5" />
                <span>Aula Anterior</span>
              </Button>
              
              {isLastLesson ? (
                <Button
                  onClick={() => navigate(`/curso/${slug}`)}
                  className="h-12 px-6 btn-gradient rounded-xl gap-2"
                >
                  <Trophy className="h-5 w-5" />
                  <span>Concluir Curso</span>
                </Button>
              ) : (
                <Button
                  onClick={goToNextLesson}
                  className="h-12 px-6 btn-gradient rounded-xl gap-2"
                >
                  <span>Próxima Aula</span>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>

          {/* Mobile toggle for sidebar */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSidebar(!showSidebar)}
            className="lg:hidden fixed bottom-4 right-4 z-40 rounded-full shadow-lg h-14 w-14 bg-card"
          >
            <BookOpen className="h-5 w-5" />
          </Button>
        </main>

        {/* Sidebar */}
        <aside className={`
          fixed lg:fixed right-0 top-0 bottom-0 w-80 xl:w-96 
          bg-card/95 backdrop-blur-xl border-l border-border/50 
          transform transition-transform duration-300 z-40 pt-[65px]
          ${showSidebar ? 'translate-x-0' : 'translate-x-full'}
        `}>
          {/* Course Progress Card */}
          <div className="p-4 border-b border-border/50 bg-gradient-to-r from-primary/5 to-secondary/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-foreground">Progresso do Curso</h3>
                <p className="text-sm text-muted-foreground">
                  {completedCount} de {lessons.length} aulas
                </p>
              </div>
              <span className="text-2xl font-display font-bold text-primary">{courseProgress}%</span>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-secondary rounded-full progress-animated transition-all duration-500"
                style={{ width: `${courseProgress}%` }}
              />
            </div>
          </div>

          {/* Lessons List */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">Conteúdo do Curso</span>
              </div>
              <LessonList
                lessons={lessons}
                progress={lessonsProgress}
                currentLessonId={currentLesson.id}
                courseSlug={slug!}
              />
            </div>
          </div>

          {/* Close button on mobile */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSidebar(false)}
            className="lg:hidden absolute top-20 left-4 rounded-xl"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </aside>
      </div>
    </div>
    </>
  );
};

export default LessonPlayer;

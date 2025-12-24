import { useState, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import VideoPlayer from "@/components/player/VideoPlayer";
import LessonList from "@/components/player/LessonList";
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

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [lessonsProgress, setLessonsProgress] = useState<LessonProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !slug) return;

      setLoading(true);

      // Fetch course
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

      // Fetch lessons
      const { data: lessonsData } = await supabase
        .from("lessons")
        .select("*")
        .eq("course_id", courseData.id)
        .order("order_index");

      if (lessonsData) {
        setLessons(lessonsData);

        // Set current lesson
        if (lessonId) {
          const lesson = lessonsData.find((l) => l.id === lessonId);
          if (lesson) {
            setCurrentLesson(lesson);
          } else {
            // Redirect to first lesson if lessonId not found
            if (lessonsData.length > 0) {
              navigate(`/curso/${slug}/aula/${lessonsData[0].id}`, { replace: true });
            }
          }
        } else if (lessonsData.length > 0) {
          // No lessonId, redirect to first lesson
          navigate(`/curso/${slug}/aula/${lessonsData[0].id}`, { replace: true });
        }
      }

      // Fetch user progress for all lessons
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

  // Update current lesson when lessonId changes
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
          // Update local progress state
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

          // Update course progress
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

    toast.success("Aula concluída!");

    // Go to next lesson
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <span className="font-bold text-foreground hidden sm:block">MULTIPLIXE</span>
            </Link>
            <div className="h-4 w-px bg-border" />
            <Link
              to={`/curso/${slug}`}
              className="text-muted-foreground hover:text-foreground transition-colors text-sm flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{course.title}</span>
              <span className="sm:hidden">Voltar</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{userName}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Video Player Column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Video Player */}
            {currentLesson.video_url ? (
              <VideoPlayer
                src={currentLesson.video_url}
                title={currentLesson.title}
                onProgress={handleProgress}
                onComplete={handleComplete}
                initialPosition={currentProgress?.last_position_seconds || 0}
              />
            ) : (
              <div className="aspect-video bg-muted rounded-xl flex items-center justify-center">
                <p className="text-muted-foreground">Vídeo não disponível</p>
              </div>
            )}

            {/* Lesson Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Aula {currentIndex + 1} de {lessons.length}</span>
                {currentProgress?.is_completed && (
                  <span className="flex items-center gap-1 text-green-500">
                    <CheckCircle className="h-4 w-4" />
                    Concluída
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-foreground">{currentLesson.title}</h1>
              {currentLesson.description && (
                <p className="text-muted-foreground">{currentLesson.description}</p>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-border/50">
              <Button
                variant="outline"
                onClick={goToPreviousLesson}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Aula Anterior
              </Button>
              <Button
                onClick={goToNextLesson}
                disabled={currentIndex === lessons.length - 1}
              >
                Próxima Aula
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Course Progress Card */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  Progresso do Curso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {completedCount} de {lessons.length} aulas
                  </span>
                  <span className="font-medium text-primary">{courseProgress}%</span>
                </div>
                <Progress value={courseProgress} className="h-2" />
              </CardContent>
            </Card>

            {/* Lessons List */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Conteúdo do Curso</CardTitle>
              </CardHeader>
              <CardContent className="max-h-[500px] overflow-y-auto">
                <LessonList
                  lessons={lessons}
                  progress={lessonsProgress}
                  currentLessonId={currentLesson.id}
                  courseSlug={slug!}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LessonPlayer;

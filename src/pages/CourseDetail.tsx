import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LessonList from "@/components/player/LessonList";
import { toast } from "sonner";
import {
  GraduationCap,
  LogOut,
  User,
  Clock,
  BookOpen,
  ArrowLeft,
  Play,
  CheckCircle,
  Loader2,
  Award,
  Sparkles,
  Target,
  TrendingUp,
  Star,
  Zap,
  FileQuestion,
} from "lucide-react";
import { CourseQuizModal } from "@/components/quiz/CourseQuizModal";
import { useQuizzes } from "@/hooks/useQuizzes";

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  duration_minutes: number;
  level: string;
  instructor_name: string | null;
  instructor_avatar: string | null;
  total_lessons: number;
  is_featured: boolean;
  categories: {
    id: string;
    name: string;
    slug: string;
    color: string | null;
  } | null;
}

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  duration_seconds: number;
  order_index: number;
  is_free: boolean;
}

interface UserProgress {
  progress_percentage: number;
  started_at: string;
  completed_at: string | null;
}

interface LessonProgress {
  lesson_id: string;
  is_completed: boolean;
}

const levelConfig: Record<string, { label: string; emoji: string; gradient: string }> = {
  iniciante: { label: "Iniciante", emoji: "🌱", gradient: "from-emerald-500 to-teal-500" },
  intermediario: { label: "Intermediário", emoji: "🚀", gradient: "from-amber-500 to-orange-500" },
  avancado: { label: "Avançado", emoji: "⚡", gradient: "from-rose-500 to-pink-500" },
};

const CourseDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [lessonsProgress, setLessonsProgress] = useState<LessonProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  
  const { fetchQuizForCourse } = useQuizzes();
  const [hasQuiz, setHasQuiz] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchCourse = async () => {
      if (!user || !slug) return;

      setLoading(true);

      const { data: courseData, error } = await supabase
        .from("courses")
        .select(`
          *,
          categories (*)
        `)
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();

      if (error || !courseData) {
        toast.error("Curso não encontrado");
        navigate("/catalogo");
        return;
      }

      setCourse(courseData as Course);

      // Fetch lessons
      const { data: lessonsData } = await supabase
        .from("lessons")
        .select("id, title, description, duration_seconds, order_index, is_free")
        .eq("course_id", courseData.id)
        .order("order_index");

      if (lessonsData) {
        setLessons(lessonsData);
      }

      // Fetch user progress
      const { data: progressData } = await supabase
        .from("user_course_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("course_id", courseData.id)
        .maybeSingle();

      if (progressData) {
        setProgress(progressData);
      }

      // Fetch lessons progress
      const { data: lessonsProgressData } = await supabase
        .from("user_lesson_progress")
        .select("lesson_id, is_completed")
        .eq("user_id", user.id)
        .eq("course_id", courseData.id);

      if (lessonsProgressData) {
        setLessonsProgress(lessonsProgressData);
      }

      // Check if course has a final quiz
      const quiz = await fetchQuizForCourse(courseData.id);
      setHasQuiz(!!quiz);

      setLoading(false);
    };

    fetchCourse();
  }, [user, slug, navigate, fetchQuizForCourse]);

  const handleStartCourse = async () => {
    if (!user || !course || lessons.length === 0) return;

    setStarting(true);

    const { error } = await supabase.from("user_course_progress").insert({
      user_id: user.id,
      course_id: course.id,
      progress_percentage: 0,
    });

    if (error && error.code !== "23505") {
      toast.error("Erro ao iniciar curso");
      setStarting(false);
      return;
    }

    navigate(`/curso/${slug}/aula/${lessons[0].id}`);
    setStarting(false);
  };

  const handleContinueCourse = () => {
    if (!course || lessons.length === 0) return;

    const incompleteLesson = lessons.find(
      (lesson) => !lessonsProgress.find((p) => p.lesson_id === lesson.id && p.is_completed)
    );

    if (incompleteLesson) {
      navigate(`/curso/${slug}/aula/${incompleteLesson.id}`);
    } else {
      navigate(`/curso/${slug}/aula/${lessons[0].id}`);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
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
          <p className="text-muted-foreground font-medium animate-pulse">Carregando curso...</p>
        </div>
      </div>
    );
  }

  if (!user || !course) {
    return null;
  }

  const userName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Colaborador";
  const hours = Math.floor(course.duration_minutes / 60);
  const minutes = course.duration_minutes % 60;
  const durationText = hours > 0
    ? `${hours}h ${minutes > 0 ? `${minutes}min` : ""}`
    : `${minutes}min`;
  const levelStyle = levelConfig[course.level] || levelConfig.iniciante;
  const completedLessons = lessonsProgress.filter(p => p.is_completed).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
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

            <div className="flex items-center gap-3">
              <Link 
                to="/perfil" 
                className="hidden sm:flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-2xl neon-border hover:bg-muted transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm neon-button">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-foreground">{userName}</span>
              </Link>
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
        {/* Back Button */}
        <Button 
          variant="ghost" 
          size="sm" 
          asChild 
          className="mb-6 rounded-xl hover:bg-muted/50 neon-border"
        >
          <Link to="/catalogo">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao catálogo
          </Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Course Hero */}
            <div className="relative rounded-[2rem] overflow-hidden p-8 md:p-10 neon-card">
              {/* Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-background dark:from-primary/30 dark:via-accent/20" />
              <div className="absolute inset-0 opacity-30 dark:opacity-50" style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--primary) / 0.2) 1px, transparent 0)`,
                backgroundSize: '32px 32px'
              }} />
              <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-primary/30 to-accent/30 dark:from-primary/50 dark:to-accent/40 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4" />
              <div className="absolute bottom-0 left-0 w-60 h-60 bg-gradient-to-br from-accent/25 to-primary/15 dark:from-accent/40 dark:to-primary/30 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4" />
              
              {/* Floating decorations */}
              <div className="absolute top-6 right-6 w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg animate-float dark:shadow-[0_0_25px_hsl(25_100%_55%/0.5)]">
                <Star className="h-6 w-6 text-white" />
              </div>

              <div className="relative z-10">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-5">
                  {course.categories && (
                    <Badge
                      className="rounded-full px-3 py-1 font-medium border-0"
                      style={{
                        backgroundColor: course.categories.color
                          ? `${course.categories.color}25`
                          : "hsl(var(--muted))",
                        color: course.categories.color || "hsl(var(--muted-foreground))",
                      }}
                    >
                      {course.categories.name}
                    </Badge>
                  )}
                  <Badge className={`rounded-full px-3 py-1 font-medium border-0 bg-gradient-to-r ${levelStyle.gradient} text-white`}>
                    {levelStyle.emoji} {levelStyle.label}
                  </Badge>
                  {course.is_featured && (
                    <Badge className="rounded-full px-3 py-1 font-medium border-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      Destaque
                    </Badge>
                  )}
                </div>

                <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
                  {course.title}
                </h1>

                <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
                  {course.description}
                </p>

                {/* Quick stats */}
                <div className="flex flex-wrap items-center gap-4 mt-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background/50 backdrop-blur-sm px-3 py-2 rounded-xl">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="font-medium">{durationText}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background/50 backdrop-blur-sm px-3 py-2 rounded-xl">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span className="font-medium">{lessons.length} aulas</span>
                  </div>
                  {course.instructor_name && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background/50 backdrop-blur-sm px-3 py-2 rounded-xl">
                      <User className="h-4 w-4 text-primary" />
                      <span className="font-medium">{course.instructor_name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Course Preview Video */}
            <div 
              className="group relative aspect-video rounded-[2rem] overflow-hidden cursor-pointer neon-card"
              onClick={progress ? handleContinueCourse : handleStartCourse}
            >
              {/* Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/15 to-secondary/10 dark:from-primary/30 dark:via-accent/25" />
              
              {/* Decorative grid */}
              <div className="absolute inset-0 opacity-30 dark:opacity-50">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <defs>
                    <pattern id="course-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                      <circle cx="1" cy="1" r="0.5" fill="currentColor" className="text-primary/30" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#course-grid)" />
                </svg>
              </div>

              {/* Floating elements */}
              <div className="absolute top-8 left-8 w-16 h-16 bg-gradient-to-br from-primary/40 to-accent/40 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700" />
              <div className="absolute bottom-8 right-8 w-20 h-20 bg-gradient-to-br from-accent/40 to-primary/30 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700" />

              {/* Play button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity dark:shadow-[0_0_40px_hsl(270_100%_70%/0.5)]" />
                  <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300 neon-button">
                    <Play className="w-8 h-8 md:w-10 md:h-10 text-white ml-1" fill="currentColor" />
                  </div>
                </div>
              </div>

              {/* Overlay text */}
              <div className="absolute bottom-6 left-6 right-6">
                <p className="text-white/80 text-sm font-medium">
                  {progress ? "Continuar de onde parou" : "Clique para iniciar o curso"}
                </p>
              </div>
            </div>

            {/* What you'll learn */}
            <div className="rounded-[2rem] bg-card border border-border/50 overflow-hidden neon-card">
              <div className="p-6 border-b border-border/50 bg-gradient-to-r from-primary/5 to-secondary/5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-display font-bold text-foreground">O que você vai aprender</h3>
                    <p className="text-sm text-muted-foreground">Habilidades que você vai desenvolver</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <ul className="grid md:grid-cols-2 gap-4">
                  {[
                    "Fundamentos e conceitos essenciais",
                    "Técnicas práticas aplicáveis no dia a dia",
                    "Melhores práticas do mercado",
                    "Casos de uso e exemplos reais",
                  ].map((item, index) => (
                    <li key={index} className="flex items-start gap-3 group">
                      <div className="mt-0.5 p-1 rounded-lg bg-gradient-to-br from-emerald-500/10 to-teal-500/10 group-hover:from-emerald-500/20 group-hover:to-teal-500/20 transition-colors">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      </div>
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Lessons List */}
            {lessons.length > 0 && (
              <div className="rounded-[2rem] bg-card border border-border/50 overflow-hidden neon-card">
                <div className="p-6 border-b border-border/50 bg-gradient-to-r from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg dark:shadow-[0_0_20px_hsl(270_100%_70%/0.4)]">
                        <BookOpen className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-display font-bold text-foreground">Conteúdo do Curso</h3>
                        <p className="text-sm text-muted-foreground">{lessons.length} aulas • {durationText} de conteúdo</p>
                      </div>
                    </div>
                    {progress && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full dark:shadow-[0_0_15px_hsl(270_100%_70%/0.3)]">
                        <TrendingUp className="h-4 w-4 text-primary neon-icon" />
                        <span className="text-sm font-semibold text-primary">{completedLessons}/{lessons.length}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-6">
                  <LessonList
                    lessons={lessons}
                    progress={lessonsProgress}
                    courseSlug={slug!}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Course Info Card */}
            <div className="sticky top-24 rounded-[2rem] bg-card border border-border/50 overflow-hidden neon-card">
              {/* Header gradient */}
              <div className="h-2 bg-gradient-to-r from-primary via-accent to-secondary" />
              
              <div className="p-6 space-y-6">
                {/* Progress */}
                {progress && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Seu progresso</span>
                      <span className="text-lg font-bold text-primary neon-text">
                        {progress.progress_percentage}%
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-accent progress-animated transition-all duration-500 dark:shadow-[0_0_10px_hsl(270_100%_70%/0.5)]"
                        style={{ width: `${progress.progress_percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {completedLessons} de {lessons.length} aulas concluídas
                    </p>
                  </div>
                )}

                {/* Quiz Final Button - Show when progress is 100% and has quiz */}
                {progress && progress.progress_percentage >= 100 && hasQuiz && (
                  <Button 
                    className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl text-base font-semibold gap-2 shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 transition-all" 
                    onClick={() => setShowQuizModal(true)}
                  >
                    <FileQuestion className="h-5 w-5" />
                    Fazer Quiz Final
                  </Button>
                )}

                {/* CTA Button */}
                {progress ? (
                  <Button 
                    className="w-full h-12 bg-gradient-to-r from-primary to-accent text-white rounded-2xl text-base font-semibold gap-2 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all neon-button" 
                    onClick={handleContinueCourse}
                  >
                    <Play className="h-5 w-5" />
                    Continuar Curso
                  </Button>
                ) : (
                  <Button
                    className="w-full h-12 bg-gradient-to-r from-primary to-accent text-white rounded-2xl text-base font-semibold gap-2 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all neon-button"
                    onClick={handleStartCourse}
                    disabled={starting || lessons.length === 0}
                  >
                    {starting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Iniciando...
                      </>
                    ) : (
                      <>
                        <Zap className="h-5 w-5" />
                        Começar Agora
                      </>
                    )}
                  </Button>
                )}

                {/* Course Stats */}
                <div className="space-y-4 pt-4 border-t border-border/50">
                  {[
                    { icon: Clock, label: durationText, sublabel: "Duração total", gradient: "from-blue-500 to-cyan-500" },
                    { icon: BookOpen, label: `${lessons.length} aulas`, sublabel: "Conteúdo do curso", gradient: "from-primary to-accent" },
                    { icon: Award, label: "Certificado", sublabel: "Ao concluir o curso", gradient: "from-amber-500 to-orange-500" },
                  ].map((stat, index) => (
                    <div key={index} className="flex items-center gap-3 group">
                      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.gradient}/10 group-hover:${stat.gradient}/20 transition-colors`}>
                        <stat.icon className="h-5 w-5 text-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{stat.label}</p>
                        <p className="text-xs text-muted-foreground">{stat.sublabel}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Instructor */}
                {course.instructor_name && (
                  <div className="pt-4 border-t border-border/50">
                    <p className="text-xs text-muted-foreground mb-3">Instrutor(a)</p>
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/30">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{course.instructor_name}</p>
                        <p className="text-xs text-muted-foreground">Instrutor MULTIPLIXE</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Quiz Modal */}
      {course && (
        <CourseQuizModal
          courseId={course.id}
          courseTitle={course.title}
          isOpen={showQuizModal}
          onClose={() => setShowQuizModal(false)}
        />
      )}
    </div>
  );
};

export default CourseDetail;

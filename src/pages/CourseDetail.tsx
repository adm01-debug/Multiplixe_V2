import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import LessonList from "@/components/player/LessonList";
import CourseDetailHero from "@/components/course/CourseDetailHero";
import CourseDetailSidebar from "@/components/course/CourseDetailSidebar";
import { toast } from "sonner";
import { GraduationCap, LogOut, ArrowLeft, Play, CheckCircle, Loader2, Sparkles, Target, TrendingUp, BookOpen, Brain } from "lucide-react";
import { CourseQuizModal } from "@/components/quiz/CourseQuizModal";
import { useQuizzes } from "@/hooks/useQuizzes";
import CourseDiscussions from "@/components/discussions/CourseDiscussions";

interface Course { id: string; title: string; slug: string; description: string | null; thumbnail_url: string | null; duration_minutes: number; level: string; instructor_name: string | null; instructor_avatar: string | null; total_lessons: number; is_featured: boolean; categories: { id: string; name: string; slug: string; color: string | null } | null; }
interface Lesson { id: string; title: string; description: string | null; duration_seconds: number; order_index: number; is_free: boolean; }
interface UserProgress { progress_percentage: number; started_at: string; completed_at: string | null; }
interface LessonProgress { lesson_id: string; is_completed: boolean; }

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
  const { fetchQuizForCourse, fetchUserAttempts } = useQuizzes();
  const [hasQuiz, setHasQuiz] = useState(false);
  const [quizPassed, setQuizPassed] = useState<{ passed: boolean; score: number } | null>(null);

  useEffect(() => { if (!authLoading && !user) navigate("/auth"); }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchCourse = async () => {
      if (!user || !slug) return;
      setLoading(true);
      const { data: courseData, error } = await supabase.from("courses").select(`*, categories (*)`).eq("slug", slug).eq("is_published", true).maybeSingle();
      if (error || !courseData) { toast.error("Curso não encontrado"); navigate("/catalogo"); return; }
      setCourse(courseData as Course);
      const { data: lessonsData } = await supabase.from("lessons").select("id, title, description, duration_seconds, order_index, is_free").eq("course_id", courseData.id).order("order_index");
      if (lessonsData) setLessons(lessonsData);
      const { data: progressData } = await supabase.from("user_course_progress").select("*").eq("user_id", user.id).eq("course_id", courseData.id).maybeSingle();
      if (progressData) setProgress(progressData);
      const { data: lessonsProgressData } = await supabase.from("user_lesson_progress").select("lesson_id, is_completed").eq("user_id", user.id).eq("course_id", courseData.id);
      if (lessonsProgressData) setLessonsProgress(lessonsProgressData);
      const quiz = await fetchQuizForCourse(courseData.id);
      setHasQuiz(!!quiz);
      if (quiz) {
        const attempts = await fetchUserAttempts(quiz.id);
        const passedAttempt = attempts.find(a => a.passed);
        if (passedAttempt) setQuizPassed({ passed: true, score: passedAttempt.score });
        else if (attempts.length > 0) setQuizPassed({ passed: false, score: Math.max(...attempts.map(a => a.score)) });
      }
      setLoading(false);
    };
    fetchCourse();
  }, [user, slug, navigate, fetchQuizForCourse, fetchUserAttempts]);

  const handleStartCourse = async () => {
    if (!user || !course || lessons.length === 0) return;
    setStarting(true);
    const { error } = await supabase.from("user_course_progress").upsert({ user_id: user.id, course_id: course.id, progress_percentage: 0 }, { onConflict: "user_id,course_id" });
    if (error) { toast.error("Erro ao iniciar curso"); setStarting(false); return; }
    navigate(`/curso/${slug}/aula/${lessons[0].id}`);
    setStarting(false);
  };

  const handleContinueCourse = () => {
    if (!course || lessons.length === 0) return;
    const incompleteLesson = lessons.find((lesson) => !lessonsProgress.find((p) => p.lesson_id === lesson.id && p.is_completed));
    navigate(`/curso/${slug}/aula/${incompleteLesson ? incompleteLesson.id : lessons[0].id}`);
  };

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  if (authLoading || loading) {
    return (<div className="min-h-screen flex items-center justify-center"><div className="flex flex-col items-center gap-4"><div className="relative"><div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-secondary animate-spin-slow" /><div className="absolute inset-2 bg-background rounded-full" /><Loader2 className="absolute inset-0 m-auto h-6 w-6 animate-spin text-primary" /></div><p className="text-muted-foreground font-medium animate-pulse">Carregando curso...</p></div></div>);
  }
  if (!user || !course) return null;

  const userName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Colaborador";
  const hours = Math.floor(course.duration_minutes / 60);
  const minutes = course.duration_minutes % 60;
  const durationText = hours > 0 ? `${hours}h ${minutes > 0 ? `${minutes}min` : ""}` : `${minutes}min`;
  const completedLessons = lessonsProgress.filter(p => p.is_completed).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 relative">
      <header className="sticky top-0 z-50 glass neon-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity dark:opacity-70 dark:group-hover:opacity-100" />
                <div className="relative p-2.5 bg-gradient-to-r from-primary to-accent rounded-2xl shadow-lg neon-button"><GraduationCap className="h-6 w-6 text-white" /></div>
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent flex items-center justify-center pulse-glow"><Sparkles className="w-2.5 h-2.5 text-accent-foreground" /></div>
              </div>
              <div><h1 className="font-display font-bold text-xl text-foreground tracking-tight">MULTIPLI<span className="text-gradient neon-text">XE</span></h1><p className="text-[10px] text-muted-foreground uppercase tracking-wide">by Promo Brindes</p></div>
            </Link>
            <div className="flex items-center gap-3">
              <Link to="/perfil" className="hidden sm:flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-2xl neon-border hover:bg-muted transition-colors">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm neon-button">{userName.charAt(0).toUpperCase()}</div>
                <span className="text-sm font-medium text-foreground">{userName}</span>
              </Link>
              <Button variant="outline" size="icon" aria-label="Sair da conta" onClick={handleSignOut} className="rounded-xl border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 h-11 w-11 neon-border"><LogOut className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="rounded-xl hover:bg-muted/50 neon-border">
            <Link to="/catalogo"><ArrowLeft className="h-4 w-4 mr-2" />Voltar ao catálogo</Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="rounded-xl neon-border">
            <Link to={`/flashcards?curso=${course.id}`}><Brain className="h-4 w-4 mr-2" />Revisar com flashcards</Link>
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <CourseDetailHero title={course.title} description={course.description} category={course.categories} level={course.level} isFeatured={course.is_featured} durationText={durationText} lessonsCount={lessons.length} instructorName={course.instructor_name} />

            <div className="group relative aspect-video rounded-[2rem] overflow-hidden cursor-pointer neon-card" onClick={progress ? handleContinueCourse : handleStartCourse}>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/15 to-secondary/10 dark:from-primary/30 dark:via-accent/25" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                  <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300 neon-button">
                    <Play className="w-8 h-8 md:w-10 md:h-10 text-white ml-1" fill="currentColor" />
                  </div>
                </div>
              </div>
              <div className="absolute bottom-6 left-6 right-6"><p className="text-white/80 text-sm font-medium">{progress ? "Continuar de onde parou" : "Clique para iniciar o curso"}</p></div>
            </div>

            <div className="rounded-[2rem] bg-card border border-border/50 overflow-hidden neon-card">
              <div className="p-6 border-b border-border/50 bg-gradient-to-r from-primary/5 to-secondary/5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10"><Target className="h-5 w-5 text-primary" /></div>
                  <div><h3 className="text-lg font-display font-bold text-foreground">O que você vai aprender</h3><p className="text-sm text-muted-foreground">Habilidades que você vai desenvolver</p></div>
                </div>
              </div>
              <div className="p-6">
                <ul className="grid md:grid-cols-2 gap-4">
                  {["Fundamentos e conceitos essenciais", "Técnicas práticas aplicáveis no dia a dia", "Melhores práticas do mercado", "Casos de uso e exemplos reais"].map((item, index) => (
                    <li key={index} className="flex items-start gap-3 group"><div className="mt-0.5 p-1 rounded-lg bg-gradient-to-br from-emerald-500/10 to-teal-500/10"><CheckCircle className="h-4 w-4 text-emerald-500" /></div><span className="text-muted-foreground">{item}</span></li>
                  ))}
                </ul>
              </div>
            </div>

            {lessons.length > 0 && (
              <div className="rounded-[2rem] bg-card border border-border/50 overflow-hidden neon-card">
                <div className="p-6 border-b border-border/50 bg-gradient-to-r from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg"><BookOpen className="h-5 w-5 text-white" /></div>
                      <div><h3 className="text-lg font-display font-bold text-foreground">Conteúdo do Curso</h3><p className="text-sm text-muted-foreground">{lessons.length} aulas • {durationText} de conteúdo</p></div>
                    </div>
                    {progress && (<div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full"><TrendingUp className="h-4 w-4 text-primary neon-icon" /><span className="text-sm font-semibold text-primary">{completedLessons}/{lessons.length}</span></div>)}
                  </div>
                </div>
                <div className="p-6"><LessonList lessons={lessons} progress={lessonsProgress} courseSlug={slug!} /></div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <CourseDetailSidebar progress={progress} completedLessons={completedLessons} totalLessons={lessons.length} durationText={durationText} instructorName={course.instructor_name} hasQuiz={hasQuiz} quizPassed={quizPassed} starting={starting} onContinue={handleContinueCourse} onStart={handleStartCourse} onOpenQuiz={() => setShowQuizModal(true)} />
          </div>
        </div>

        <div className="mt-12"><CourseDiscussions courseId={course.id} /></div>
      </main>

      {course && (<CourseQuizModal courseId={course.id} courseTitle={course.title} isOpen={showQuizModal} onClose={() => setShowQuizModal(false)} onQuizPassed={(score) => setQuizPassed({ passed: true, score })} />)}
    </div>
  );
};

export default CourseDetail;

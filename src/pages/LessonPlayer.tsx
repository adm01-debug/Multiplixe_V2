import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useConfetti } from "@/hooks/useConfetti";
import { useUserXP } from "@/hooks/useUserXP";
import { useAchievements } from "@/hooks/useAchievements";
import { useStreaks } from "@/hooks/useStreaks";
import { useCertificates } from "@/hooks/useCertificates";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { usePomodoro } from "@/hooks/usePomodoro";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import VideoPlayer from "@/components/player/VideoPlayer";
import FloatingProgress from "@/components/player/FloatingProgress";
import LessonPlayerHeader from "@/components/player/LessonPlayerHeader";
import LessonPlayerSidebar from "@/components/player/LessonPlayerSidebar";
import AchievementUnlocked from "@/components/AchievementUnlocked";
import StreakCelebration from "@/components/StreakCelebration";
import { QuizCard } from "@/components/quiz/QuizCard";
import { CourseQuizModal } from "@/components/quiz/CourseQuizModal";
import NotesPanel from "@/components/notes/NotesPanel";
import { toast } from "sonner";
import { Sparkles, ChevronLeft, ChevronRight, BookOpen, Loader2, CheckCircle, Trophy, Play } from "lucide-react";

interface Course { id: string; title: string; slug: string; }
interface Lesson { id: string; title: string; description: string | null; video_url: string | null; duration_seconds: number; order_index: number; is_free: boolean; course_id: string; }
interface LessonProgress { lesson_id: string; is_completed: boolean; last_position_seconds: number; }

const LessonPlayer = () => {
  const { slug, lessonId } = useParams<{ slug: string; lessonId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { fireLessonComplete, fireCourseComplete } = useConfetti();
  const { addXP, refetch: refetchXP } = useUserXP();
  const { checkAchievements, newAchievements, dismissAchievement } = useAchievements();
  const { updateStreak, hasStudiedToday } = useStreaks();
  const { generateCertificate } = useCertificates();
  const { preferences, updatePreference } = useUserPreferences();
  const { state: pomodoroState, startWork } = usePomodoro();
  const celebratedLessons = useRef<Set<string>>(new Set());
  const streakUpdatedToday = useRef(false);

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [lessonsProgress, setLessonsProgress] = useState<LessonProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [currentNewAchievement, setCurrentNewAchievement] = useState<typeof newAchievements[0] | null>(null);
  const [streakCelebration, setStreakCelebration] = useState<{ newStreak: number; xpAwarded: number; isNewRecord: boolean } | null>(null);
  const [showCourseQuizModal, setShowCourseQuizModal] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);

  const focusMode = preferences.focusMode;

  const toggleFocusMode = useCallback(() => {
    const next = !focusMode;
    updatePreference('focusMode', next);
    if (next) {
      setShowSidebar(false);
      if (pomodoroState === 'idle') startWork();
      toast.success('🎯 Modo Foco ativado', { description: 'Pomodoro iniciado. Boa sessão!' });
    } else {
      setShowSidebar(true);
      toast.info('Modo Foco desativado');
    }
  }, [focusMode, updatePreference, pomodoroState, startWork]);

  // Apply focus-mode-active class to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (focusMode) root.classList.add('focus-mode-active');
    else root.classList.remove('focus-mode-active');
    return () => { root.classList.remove('focus-mode-active'); };
  }, [focusMode]);

  // F shortcut to toggle
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'f') return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // Avoid clashing with video fullscreen 'f' inside <video> focus
      if (target && target.tagName === 'VIDEO') return;
      e.preventDefault();
      toggleFocusMode();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleFocusMode]);

  useEffect(() => { if (newAchievements.length > 0 && !currentNewAchievement) setCurrentNewAchievement(newAchievements[0]); }, [newAchievements, currentNewAchievement]);
  const handleDismissNewAchievement = () => { if (currentNewAchievement) { dismissAchievement(currentNewAchievement.id); setCurrentNewAchievement(null); refetchXP(); } };
  useEffect(() => { if (!authLoading && !user) navigate("/auth"); }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !slug) return;
      setLoading(true);
      const { data: courseData, error: courseError } = await supabase.from("courses").select("id, title, slug").eq("slug", slug).eq("is_published", true).maybeSingle();
      if (courseError || !courseData) { toast.error("Curso não encontrado"); navigate("/catalogo"); return; }
      setCourse(courseData);
      const { data: lessonsData } = await supabase.from("lessons").select("*").eq("course_id", courseData.id).order("order_index");
      if (lessonsData) {
        setLessons(lessonsData);
        if (lessonId) { const lesson = lessonsData.find((l) => l.id === lessonId); if (lesson) setCurrentLesson(lesson); else if (lessonsData.length > 0) navigate(`/curso/${slug}/aula/${lessonsData[0].id}`, { replace: true }); }
        else if (lessonsData.length > 0) navigate(`/curso/${slug}/aula/${lessonsData[0].id}`, { replace: true });
      }
      const { data: progressData } = await supabase.from("user_lesson_progress").select("lesson_id, is_completed, last_position_seconds").eq("user_id", user.id).eq("course_id", courseData.id);
      if (progressData) setLessonsProgress(progressData);
      setLoading(false);
    };
    fetchData();
  }, [user, slug, lessonId, navigate]);

  useEffect(() => { if (lessonId && lessons.length > 0) { const lesson = lessons.find((l) => l.id === lessonId); if (lesson) setCurrentLesson(lesson); } }, [lessonId, lessons]);

  const handleProgress = useCallback(async (currentTime: number, duration: number) => {
    if (!user || !currentLesson || !course) return;
    const isCompleted = currentTime / duration >= 0.9;
    try {
      const { error } = await supabase.from("user_lesson_progress").upsert({ user_id: user.id, lesson_id: currentLesson.id, course_id: course.id, last_position_seconds: Math.floor(currentTime), watched_seconds: Math.floor(currentTime), is_completed: isCompleted, completed_at: isCompleted ? new Date().toISOString() : null }, { onConflict: "user_id,lesson_id" });
      if (!error && isCompleted) {
        const wasAlreadyCompleted = lessonsProgress.find((p) => p.lesson_id === currentLesson.id)?.is_completed;
        setLessonsProgress((prev) => { const existing = prev.find((p) => p.lesson_id === currentLesson.id); if (existing) return prev.map((p) => p.lesson_id === currentLesson.id ? { ...p, is_completed: true } : p); return [...prev, { lesson_id: currentLesson.id, is_completed: true, last_position_seconds: Math.floor(currentTime) }]; });
        if (!wasAlreadyCompleted && !celebratedLessons.current.has(currentLesson.id)) {
          celebratedLessons.current.add(currentLesson.id);
          const newCompletedCount = lessonsProgress.filter((p) => p.is_completed).length + 1;
          if (newCompletedCount >= lessons.length) { fireCourseComplete(); await addXP(100, 'course'); toast.success("🏆 Parabéns! Você concluiu o curso! +100 XP", { duration: 5000 }); setShowCourseQuizModal(true); }
          else { fireLessonComplete(); await addXP(25, 'lesson'); toast.success("🎉 Aula concluída! +25 XP Continue assim!"); }
          await checkAchievements();
          if (!streakUpdatedToday.current && !hasStudiedToday) { streakUpdatedToday.current = true; const streakResult = await updateStreak(); if (streakResult && streakResult.streak_updated) setStreakCelebration({ newStreak: streakResult.new_streak, xpAwarded: streakResult.xp_awarded, isNewRecord: streakResult.is_new_record }); }
        }
        await updateCourseProgress();
      }
    } catch { /* Silent fail */ }
  }, [user, currentLesson, course, lessonsProgress, lessons.length, fireCourseComplete, fireLessonComplete, addXP, checkAchievements, hasStudiedToday, updateStreak]);

  const updateCourseProgress = async () => {
    if (!user || !course || lessons.length === 0) return;
    const completedCount = lessonsProgress.filter((p) => p.is_completed).length + 1;
    const progressPercentage = Math.round((completedCount / lessons.length) * 100);
    await supabase.from("user_course_progress").upsert({ user_id: user.id, course_id: course.id, progress_percentage: progressPercentage, last_accessed_at: new Date().toISOString(), completed_at: progressPercentage === 100 ? new Date().toISOString() : null }, { onConflict: "user_id,course_id" });
  };

  const handleComplete = async () => { if (!currentLesson) return; const currentIndex = lessons.findIndex((l) => l.id === currentLesson.id); if (currentIndex < lessons.length - 1) navigate(`/curso/${slug}/aula/${lessons[currentIndex + 1].id}`); };
  const handleSignOut = async () => { await signOut(); navigate("/"); };
  const goToPreviousLesson = () => { if (!currentLesson) return; const i = lessons.findIndex((l) => l.id === currentLesson.id); if (i > 0) navigate(`/curso/${slug}/aula/${lessons[i - 1].id}`); };
  const goToNextLesson = () => { if (!currentLesson) return; const i = lessons.findIndex((l) => l.id === currentLesson.id); if (i < lessons.length - 1) navigate(`/curso/${slug}/aula/${lessons[i + 1].id}`); };

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center"><div className="flex flex-col items-center gap-4"><div className="relative"><div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-secondary animate-spin-slow" /><div className="absolute inset-2 bg-background rounded-full" /><Loader2 className="absolute inset-0 m-auto h-6 w-6 animate-spin text-primary" /></div><p className="text-muted-foreground font-medium animate-pulse">Carregando aula...</p></div></div>;
  if (!user || !course || !currentLesson) return null;

  const userName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Colaborador";
  const currentIndex = lessons.findIndex((l) => l.id === currentLesson.id);
  const completedCount = lessonsProgress.filter((p) => p.is_completed).length;
  const courseProgress = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;
  const currentProgress = lessonsProgress.find((p) => p.lesson_id === currentLesson.id);
  const isFirstLesson = currentIndex === 0;
  const isLastLesson = currentIndex === lessons.length - 1;

  return (
    <>
      <AchievementUnlocked achievement={currentNewAchievement} onClose={handleDismissNewAchievement} />
      {streakCelebration && <StreakCelebration newStreak={streakCelebration.newStreak} xpAwarded={streakCelebration.xpAwarded} isNewRecord={streakCelebration.isNewRecord} onClose={() => { setStreakCelebration(null); refetchXP(); }} />}
      {course && <CourseQuizModal isOpen={showCourseQuizModal} onClose={() => setShowCourseQuizModal(false)} courseId={course.id} courseTitle={course.title} onQuizPassed={() => { setQuizPassed(true); const uName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Colaborador"; generateCertificate(course.id, uName, course.title).then((cert) => { if (cert) toast.success("📜 Certificado gerado! Veja em seu perfil.", { duration: 5000 }); }); }} />}
      <FloatingProgress progress={courseProgress} lessonTitle={currentLesson.title} lessonNumber={currentIndex + 1} totalLessons={lessons.length} />

      <div className="min-h-screen flex flex-col">
        <LessonPlayerHeader courseSlug={slug!} courseTitle={course.title} userName={userName} courseProgress={courseProgress} onSignOut={handleSignOut} focusMode={focusMode} onToggleFocus={toggleFocusMode} />

        <div className="flex-1 flex">
          <main className={`flex-1 flex flex-col transition-all duration-300 ${showSidebar && !focusMode ? 'lg:mr-80 xl:mr-96' : ''}`}>
            <div className={`flex-1 p-4 lg:p-6 ${focusMode ? 'max-w-6xl mx-auto w-full' : ''}`}>
              <div className="rounded-2xl overflow-hidden shadow-2xl mb-6">
                {currentLesson.video_url ? <VideoPlayer src={currentLesson.video_url} title={currentLesson.title} onProgress={handleProgress} onComplete={handleComplete} initialPosition={currentProgress?.last_position_seconds || 0} /> : (
                  <div className="aspect-video bg-gradient-to-br from-primary/20 via-secondary/15 to-accent/10 flex flex-col items-center justify-center gap-4"><div className="p-6 bg-card/50 backdrop-blur-sm rounded-full"><Play className="h-12 w-12 text-muted-foreground" /></div><p className="text-muted-foreground font-medium">Vídeo não disponível</p></div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full"><Sparkles className="h-4 w-4 text-primary" /><span className="text-sm font-semibold text-primary">Aula {currentIndex + 1} de {lessons.length}</span></div>
                  {currentProgress?.is_completed && <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full"><CheckCircle className="h-4 w-4 text-emerald-500" /><span className="text-sm font-semibold text-emerald-600">Concluída</span></div>}
                  <NotesPanel lessonId={currentLesson.id} courseId={course.id} currentTime={0} />
                </div>
                <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">{currentLesson.title}</h1>
                {currentLesson.description && <p className="text-muted-foreground leading-relaxed max-w-3xl">{currentLesson.description}</p>}
                <div className="mt-6"><QuizCard lessonId={currentLesson.id} onComplete={() => { refetchXP(); checkAchievements(); }} /></div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-8 mt-8 border-t border-border/50">
                <Button variant="outline" onClick={goToPreviousLesson} disabled={isFirstLesson} className="h-12 px-6 rounded-xl border-border/50 gap-2"><ChevronLeft className="h-5 w-5" /><span>Aula Anterior</span></Button>
                {isLastLesson ? <Button onClick={() => navigate(`/curso/${slug}`)} className="h-12 px-6 btn-gradient rounded-xl gap-2"><Trophy className="h-5 w-5" /><span>Concluir Curso</span></Button> : <Button onClick={goToNextLesson} className="h-12 px-6 btn-gradient rounded-xl gap-2"><span>Próxima Aula</span><ChevronRight className="h-5 w-5" /></Button>}
              </div>
            </div>

            {!focusMode && <Button variant="outline" size="sm" onClick={() => setShowSidebar(!showSidebar)} className="lg:hidden fixed bottom-4 right-4 z-40 rounded-full shadow-lg h-14 w-14 bg-card"><BookOpen className="h-5 w-5" /></Button>}
          </main>

          {!focusMode && <LessonPlayerSidebar lessons={lessons} lessonsProgress={lessonsProgress} currentLessonId={currentLesson.id} courseSlug={slug!} courseProgress={courseProgress} completedCount={completedCount} showSidebar={showSidebar} onCloseSidebar={() => setShowSidebar(false)} />}
        </div>
      </div>
    </>
  );
};

export default LessonPlayer;

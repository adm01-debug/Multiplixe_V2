import { Button } from '@/components/ui/button';
import LessonList from '@/components/player/LessonList';
import PomodoroTimer from '@/components/pomodoro/PomodoroTimer';
import { BookOpen, ChevronRight, TrendingUp } from 'lucide-react';

interface LessonProgress {
  lesson_id: string;
  is_completed: boolean;
  last_position_seconds: number;
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

interface Props {
  lessons: Lesson[];
  lessonsProgress: LessonProgress[];
  currentLessonId: string;
  courseSlug: string;
  courseProgress: number;
  completedCount: number;
  showSidebar: boolean;
  onCloseSidebar: () => void;
}

const LessonPlayerSidebar = ({ lessons, lessonsProgress, currentLessonId, courseSlug, courseProgress, completedCount, showSidebar, onCloseSidebar }: Props) => (
  <aside className={`fixed lg:fixed right-0 top-0 bottom-0 w-80 xl:w-96 bg-card/95 backdrop-blur-xl border-l border-border/50 transform transition-transform duration-300 z-40 pt-[65px] ${showSidebar ? 'translate-x-0' : 'translate-x-full'}`}>
    <div className="p-4 border-b border-border/50 bg-gradient-to-r from-primary/5 to-secondary/5">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10">
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-display font-bold text-foreground">Progresso do Curso</h3>
          <p className="text-sm text-muted-foreground">{completedCount} de {lessons.length} aulas</p>
        </div>
        <span className="text-2xl font-display font-bold text-primary">{courseProgress}%</span>
      </div>
      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full progress-animated transition-all duration-500" style={{ width: `${courseProgress}%` }} />
      </div>
    </div>

    <div className="p-4 border-b border-border/50">
      <PomodoroTimer variant="compact" />
    </div>

    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Conteúdo do Curso</span>
        </div>
        <LessonList lessons={lessons} progress={lessonsProgress} currentLessonId={currentLessonId} courseSlug={courseSlug} />
      </div>
    </div>

    <Button variant="ghost" size="icon" onClick={onCloseSidebar} className="lg:hidden absolute top-20 left-4 rounded-xl">
      <ChevronRight className="h-5 w-5" />
    </Button>
  </aside>
);

export default LessonPlayerSidebar;

import { memo } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, Circle, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  duration_seconds: number;
  order_index: number;
  is_free: boolean;
}

interface LessonProgress {
  lesson_id: string;
  is_completed: boolean;
}

interface LessonListProps {
  lessons: Lesson[];
  progress: LessonProgress[];
  currentLessonId?: string;
  courseSlug: string;
}

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins >= 60) {
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}min`;
  }
  return secs > 0 ? `${mins}min ${secs}s` : `${mins}min`;
};

const LessonList = ({ lessons, progress, currentLessonId, courseSlug }: LessonListProps) => {
  const getProgressForLesson = (lessonId: string) => {
    return progress.find((p) => p.lesson_id === lessonId);
  };

  return (
    <div className="space-y-2">
      {lessons.map((lesson, index) => {
        const lessonProgress = getProgressForLesson(lesson.id);
        const isCompleted = lessonProgress?.is_completed;
        const isCurrent = currentLessonId === lesson.id;

        return (
          <Link
            key={lesson.id}
            to={`/curso/${courseSlug}/aula/${lesson.id}`}
            className={cn(
              "flex items-start gap-3 p-3.5 rounded-xl border transition-all duration-300 group",
              isCurrent
                ? "bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/50 shadow-sm"
                : "border-border/40 hover:border-primary/30 hover:bg-muted/30"
            )}
          >
            {/* Status icon */}
            <div className="mt-0.5 shrink-0">
              {isCompleted ? (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
              ) : isCurrent ? (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center animate-pulse">
                  <PlayCircle className="h-4 w-4 text-white" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center group-hover:border-primary/50 transition-colors">
                  <Circle className="h-3 w-3 text-muted-foreground/50" />
                </div>
              )}
            </div>

            {/* Lesson info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-semibold text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {lesson.is_free && (
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    Grátis
                  </span>
                )}
              </div>
              <h4
                className={cn(
                  "font-medium truncate transition-colors",
                  isCurrent ? "text-primary" : "text-foreground group-hover:text-primary"
                )}
              >
                {lesson.title}
              </h4>
              {lesson.description && (
                <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                  {lesson.description}
                </p>
              )}
              <span className="text-xs text-muted-foreground mt-1 inline-block">
                {formatDuration(lesson.duration_seconds)}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default memo(LessonList);

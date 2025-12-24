import { Link } from "react-router-dom";
import { CheckCircle, Circle, PlayCircle, Lock } from "lucide-react";
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
              "flex items-start gap-3 p-3 rounded-lg border transition-all",
              isCurrent
                ? "bg-primary/10 border-primary"
                : "border-border/50 hover:border-primary/50 hover:bg-muted/50"
            )}
          >
            {/* Status icon */}
            <div className="mt-0.5">
              {isCompleted ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : isCurrent ? (
                <PlayCircle className="h-5 w-5 text-primary" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>

            {/* Lesson info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h4
                  className={cn(
                    "font-medium truncate",
                    isCurrent ? "text-primary" : "text-foreground"
                  )}
                >
                  {lesson.title}
                </h4>
              </div>
              {lesson.description && (
                <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                  {lesson.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">
                  {formatDuration(lesson.duration_seconds)}
                </span>
                {lesson.is_free && (
                  <span className="text-xs text-green-600 font-medium">Grátis</span>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default LessonList;

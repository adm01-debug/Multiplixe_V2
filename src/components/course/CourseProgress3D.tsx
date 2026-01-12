import { motion } from "framer-motion";
import { Check, Play, Lock, Clock, Trophy, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Lesson {
  id: string;
  title: string;
  duration: number;
  completed: boolean;
  current: boolean;
  locked: boolean;
}

interface CourseProgress3DProps {
  lessons: Lesson[];
  onLessonClick?: (lessonId: string) => void;
}

const CourseProgress3D = ({ lessons, onLessonClick }: CourseProgress3DProps) => {
  const completedCount = lessons.filter((l) => l.completed).length;
  const progress = (completedCount / lessons.length) * 100;

  return (
    <div className="relative py-6">
      {/* Background track */}
      <div className="absolute left-8 top-0 bottom-0 w-1 bg-border/50 rounded-full" />
      
      {/* Progress track */}
      <motion.div
        className="absolute left-8 top-0 w-1 bg-gradient-to-b from-primary via-accent to-primary rounded-full"
        initial={{ height: 0 }}
        animate={{ height: `${progress}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
      />

      {/* Lessons */}
      <div className="space-y-1">
        {lessons.map((lesson, index) => {
          const isFirst = index === 0;
          const isLast = index === lessons.length - 1;

          return (
            <motion.div
              key={lesson.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative"
            >
              <button
                onClick={() => !lesson.locked && onLessonClick?.(lesson.id)}
                disabled={lesson.locked}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-300 group text-left",
                  lesson.current && "bg-primary/10 border border-primary/30",
                  lesson.completed && !lesson.current && "hover:bg-muted/50",
                  !lesson.completed && !lesson.current && !lesson.locked && "hover:bg-muted/50",
                  lesson.locked && "opacity-50 cursor-not-allowed"
                )}
              >
                {/* Node */}
                <div className="relative z-10">
                  <motion.div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                      lesson.completed && "bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30",
                      lesson.current && "bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30",
                      !lesson.completed && !lesson.current && !lesson.locked && "bg-muted border border-border",
                      lesson.locked && "bg-muted/50 border border-border/50"
                    )}
                    whileHover={!lesson.locked ? { scale: 1.1 } : {}}
                    whileTap={!lesson.locked ? { scale: 0.95 } : {}}
                  >
                    {lesson.completed ? (
                      <Check className="h-5 w-5 text-white" />
                    ) : lesson.current ? (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <Play className="h-5 w-5 text-white" />
                      </motion.div>
                    ) : lesson.locked ? (
                      <Lock className="h-4 w-4 text-muted-foreground/50" />
                    ) : (
                      <span className="text-sm font-semibold text-muted-foreground">
                        {index + 1}
                      </span>
                    )}
                  </motion.div>

                  {/* Pulse effect for current lesson */}
                  {lesson.current && (
                    <motion.div
                      className="absolute inset-0 rounded-xl bg-primary/30"
                      animate={{ scale: [1, 1.5, 1.5], opacity: [0.5, 0, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4
                      className={cn(
                        "font-medium truncate transition-colors",
                        lesson.completed && "text-muted-foreground line-through",
                        lesson.current && "text-primary",
                        !lesson.completed && !lesson.current && "text-foreground group-hover:text-primary"
                      )}
                    >
                      {lesson.title}
                    </h4>
                    {lesson.current && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                        Atual
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {Math.floor(lesson.duration / 60)}:{(lesson.duration % 60).toString().padStart(2, "0")}
                    </span>
                    {lesson.completed && (
                      <span className="flex items-center gap-1 text-emerald-500">
                        <Star className="h-3 w-3" />
                        Concluído
                      </span>
                    )}
                  </div>
                </div>

                {/* Arrow indicator */}
                {!lesson.locked && !lesson.completed && (
                  <motion.div
                    className="text-muted-foreground group-hover:text-primary transition-colors"
                    whileHover={{ x: 4 }}
                  >
                    <Play className="h-4 w-4" />
                  </motion.div>
                )}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Completion badge */}
      {progress === 100 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 border border-amber-500/30 flex items-center gap-4"
        >
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Trophy className="h-7 w-7 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-foreground">Curso Concluído! 🎉</h4>
            <p className="text-sm text-muted-foreground">
              Parabéns! Você completou todas as aulas.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CourseProgress3D;

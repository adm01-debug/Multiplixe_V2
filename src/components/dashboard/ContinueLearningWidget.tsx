import PrefetchLink, { usePrefetchQuery } from "@/components/PrefetchLink";
import { useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Clock, ChevronRight, Flame, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface CourseData {
  id: string;
  title: string;
  slug: string;
  thumbnail_url: string | null;
  duration_minutes: number | null;
  total_lessons: number | null;
  instructor_name: string | null;
  description?: string | null;
  level?: string | null;
  is_featured?: boolean | null;
  categories?: {
    name: string;
    color: string | null;
  } | null;
}

interface CourseProgress {
  course_id: string;
  progress_percentage: number | null;
  courses: CourseData | null;
}

interface ContinueLearningWidgetProps {
  userProgress: CourseProgress[];
  className?: string;
}

const ContinueLearningWidget = ({ userProgress, className = "" }: ContinueLearningWidgetProps) => {
  // Get the most recent in-progress course
  const inProgressCourse = userProgress.find(
    (p) => (p.progress_percentage ?? 0) > 0 && (p.progress_percentage ?? 0) < 100
  );

  if (!inProgressCourse || !inProgressCourse.courses) return null;

  const course = inProgressCourse.courses;
  const progress = inProgressCourse.progress_percentage ?? 0;
  const remainingPercent = 100 - progress;
  const estimatedMinutes = Math.ceil((remainingPercent / 100) * (course.duration_minutes || 30));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-background border border-primary/20 ${className}`}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary/10 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-accent/10 blur-2xl"
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
      </div>

      <div className="relative p-5 sm:p-6">
        {/* Header badge */}
        <div className="flex items-center gap-2 mb-4">
          <motion.div
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Flame className="w-3 h-3" />
            Continue de onde parou
          </motion.div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          {/* Thumbnail */}
          <Link 
            to={`/curso/${course.slug}`}
            className="relative shrink-0 group"
          >
            <div className="relative w-full sm:w-32 h-20 rounded-xl overflow-hidden bg-muted">
              {course.thumbnail_url ? (
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  width={128}
                  height={80}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-primary/50" />
                </div>
              )}
              
              {/* Play overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center"
                >
                  <Play className="w-5 h-5 text-primary ml-0.5" fill="currentColor" />
                </motion.div>
              </div>
            </div>
          </Link>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <Link to={`/curso/${course.slug}`}>
              <h3 className="font-semibold text-foreground line-clamp-1 hover:text-primary transition-colors">
                {course.title}
              </h3>
            </Link>
            
            {course.instructor_name && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {course.instructor_name}
              </p>
            )}

            {/* Progress bar */}
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{progress}% concluído</span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  ~{estimatedMinutes} min restantes
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* CTA Button */}
            <div className="mt-4">
              <Link to={`/curso/${course.slug}`}>
                <Button 
                  size="sm"
                  className="w-full sm:w-auto bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg shadow-primary/20 group"
                >
                  <Play className="w-4 h-4 mr-1.5" fill="currentColor" />
                  Continuar Curso
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ContinueLearningWidget;

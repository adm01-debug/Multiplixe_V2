import { memo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BookOpen, CheckCircle2, ChevronRight, Lock } from 'lucide-react';
import PrefetchLink, { usePrefetchQuery } from '@/components/PrefetchLink';
import { LearningPathCourse } from '@/hooks/useLearningPaths';

interface LearningPathCourseItemProps {
  pathCourse: LearningPathCourse;
  index: number;
  isUnlocked: boolean;
  isCompleted: boolean;
  currentProgress: number;
}

function LearningPathCourseItem({ pathCourse, index, isUnlocked, isCompleted, currentProgress }: LearningPathCourseItemProps) {
  const { prefetchCourseDetail } = usePrefetchQuery();
  const [isPrefetching, setIsPrefetching] = useState(false);

  const handlePrefetch = useCallback(() => {
    if (!isUnlocked) return;
    setIsPrefetching(true);
    prefetchCourseDetail(pathCourse.course.slug);
    setTimeout(() => setIsPrefetching(false), 800);
  }, [pathCourse.course.slug, prefetchCourseDetail, isUnlocked]);

  const cardContent = (
    <Card className={`relative overflow-hidden transition-all duration-300 ${isUnlocked ? 'border-border/50 hover:border-primary/50 hover:shadow-lg' : 'opacity-60'}`}>
      {isPrefetching && (
        <div className="absolute top-3 right-3 z-20">
          <motion.div className="w-2 h-2 rounded-full bg-primary" initial={{ opacity: 0, scale: 0 }} animate={{ opacity: [0.5, 1, 0.5], scale: [0.8, 1.2, 0.8] }} transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }} />
        </div>
      )}
      <CardContent className="p-0">
        <div className="flex items-center gap-4 p-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold ${isCompleted ? 'bg-green-500 text-white' : isUnlocked ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
          </div>
          <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg">
            {pathCourse.course.thumbnail_url ? (
              <img src={pathCourse.course.thumbnail_url} alt={pathCourse.course.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted"><BookOpen className="h-6 w-6 text-muted-foreground" /></div>
            )}
            {!isUnlocked && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60"><Lock className="h-5 w-5 text-white" /></div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="mb-1 truncate font-semibold">{pathCourse.course.title}</h3>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>{pathCourse.course.total_lessons} aulas</span>
              <span>{Math.round(pathCourse.course.duration_minutes / 60)}h</span>
              {currentProgress > 0 && currentProgress < 100 && <span className="text-primary">{currentProgress}% concluído</span>}
            </div>
          </div>
          {isUnlocked && (
            <Button variant={isCompleted ? 'outline' : 'default'} size="sm">
              {isCompleted ? 'Revisar' : currentProgress > 0 ? 'Continuar' : 'Começar'}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
        {currentProgress > 0 && currentProgress < 100 && <Progress value={currentProgress} className="h-1 rounded-none" />}
      </CardContent>
    </Card>
  );

  if (!isUnlocked) return cardContent;

  return (
    <PrefetchLink to={`/curso/${pathCourse.course.slug}`} onPrefetchData={handlePrefetch} className="block">
      {cardContent}
    </PrefetchLink>
  );
}

export default memo(LearningPathCourseItem);

import PrefetchLink, { usePrefetchQuery } from '@/components/PrefetchLink';
import { motion } from 'framer-motion';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, BookOpen, Trophy, ChevronRight } from 'lucide-react';
import { LearningPath, UserLearningPathProgress } from '@/hooks/useLearningPaths';
import LazyImage from '@/components/LazyImage';
import { memo, useCallback, useState } from 'react';

interface LearningPathCardProps {
  learningPath: LearningPath;
  progress?: UserLearningPathProgress | null;
}

const levelConfig: Record<string, { label: string; color: string }> = {
  iniciante: { label: 'Iniciante', color: 'bg-green-500/20 text-green-400' },
  intermediario: { label: 'Intermediário', color: 'bg-yellow-500/20 text-yellow-400' },
  avancado: { label: 'Avançado', color: 'bg-red-500/20 text-red-400' },
};

const MotionCard = motion.create(Card);

export const LearningPathCard = memo(function LearningPathCard({ learningPath, progress }: LearningPathCardProps) {
  const levelInfo = levelConfig[learningPath.difficulty_level] || levelConfig.iniciante;
  const isCompleted = progress?.progress_percentage === 100;
  const isStarted = !!progress && progress.progress_percentage > 0;
  const { prefetchLearningPathDetail } = usePrefetchQuery();
  const [isPrefetching, setIsPrefetching] = useState(false);

  const handlePrefetchData = useCallback(() => {
    setIsPrefetching(true);
    prefetchLearningPathDetail(learningPath.slug);
    // Clear indicator after a short delay
    setTimeout(() => setIsPrefetching(false), 800);
  }, [learningPath.slug, prefetchLearningPathDetail]);

  return (
    <PrefetchLink to={`/trilha/${learningPath.slug}`} aria-label={`Trilha: ${learningPath.title}`} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" onPrefetchData={handlePrefetchData}>
      <MotionCard 
        className="group overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm cursor-pointer will-change-transform"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ 
          y: -8, 
          scale: 1.02,
          boxShadow: "0 20px 40px -15px hsl(var(--primary) / 0.25), 0 8px 16px -8px rgba(0,0,0,0.15)",
          borderColor: "hsl(var(--primary) / 0.6)"
        }}
        whileTap={{ 
          scale: 0.97,
          y: -4
        }}
        transition={{ 
          type: "spring", 
          stiffness: 400, 
          damping: 25 
        }}
      >
        {/* Prefetch indicator */}
        {isPrefetching && (
          <div className="absolute top-3 right-3 z-20">
            <motion.div
              className="w-2 h-2 rounded-full bg-primary"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0.5, 1, 0.5], 
                scale: [0.8, 1.2, 0.8] 
              }}
              transition={{ 
                duration: 0.6, 
                repeat: Infinity,
                ease: "easeInOut" 
              }}
            />
          </div>
        )}
        
        <div className="relative aspect-video overflow-hidden">
          {learningPath.thumbnail_url ? (
            <motion.div
              className="h-full w-full"
              whileHover={{ scale: 1.08 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <LazyImage
                src={learningPath.thumbnail_url}
                alt={learningPath.title}
                width={640}
                height={360}
                className="h-full w-full"
                placeholderClassName="bg-gradient-to-br from-primary/30 to-primary/10"
              />
            </motion.div>
          ) : (
            <motion.div 
              className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/30 to-primary/10"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.4 }}
            >
              <Trophy className="h-16 w-16 text-primary/50" />
            </motion.div>
          )}
          
          {learningPath.is_featured && (
            <Badge className="absolute left-3 top-3 bg-primary text-primary-foreground">
              Destaque
            </Badge>
          )}
          
          {isCompleted && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <div className="rounded-full bg-green-500 p-3">
                <Trophy className="h-8 w-8 text-white" />
              </div>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="secondary" className={levelInfo.color}>
              {levelInfo.label}
            </Badge>
          </div>

          <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
            {learningPath.title}
          </h3>

          <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
            {learningPath.description}
          </p>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              <span>{learningPath.courses_count || 0} cursos</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{learningPath.estimated_hours}h</span>
            </div>
            <div className="flex items-center gap-1">
              <Trophy className="h-3.5 w-3.5 text-yellow-500" />
              <span>{learningPath.xp_reward} XP</span>
            </div>
          </div>
        </CardContent>

        {isStarted && (
          <CardFooter className="border-t border-border/50 px-4 py-3">
            <div className="w-full">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {progress?.courses_completed}/{progress?.total_courses} cursos
                </span>
                <span className="font-medium text-primary">
                  {progress?.progress_percentage}%
                </span>
              </div>
              <Progress value={progress?.progress_percentage} className="h-1.5" />
            </div>
          </CardFooter>
        )}

        {!isStarted && (
          <CardFooter className="border-t border-border/50 px-4 py-3">
            <div className="flex w-full items-center justify-between text-sm">
              <span className="text-muted-foreground">Começar trilha</span>
              <motion.div
                whileHover={{ x: 4 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <ChevronRight className="h-4 w-4 text-primary" />
              </motion.div>
            </div>
          </CardFooter>
        )}
      </MotionCard>
    </PrefetchLink>
  );
});

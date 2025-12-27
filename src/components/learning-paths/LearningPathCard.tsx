import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, BookOpen, Trophy, ChevronRight } from 'lucide-react';
import { LearningPath, UserLearningPathProgress } from '@/hooks/useLearningPaths';

interface LearningPathCardProps {
  learningPath: LearningPath;
  progress?: UserLearningPathProgress | null;
}

const levelConfig: Record<string, { label: string; color: string }> = {
  iniciante: { label: 'Iniciante', color: 'bg-green-500/20 text-green-400' },
  intermediario: { label: 'Intermediário', color: 'bg-yellow-500/20 text-yellow-400' },
  avancado: { label: 'Avançado', color: 'bg-red-500/20 text-red-400' },
};

export function LearningPathCard({ learningPath, progress }: LearningPathCardProps) {
  const levelInfo = levelConfig[learningPath.difficulty_level] || levelConfig.iniciante;
  const isCompleted = progress?.progress_percentage === 100;
  const isStarted = !!progress && progress.progress_percentage > 0;

  return (
    <Link to={`/trilha/${learningPath.slug}`}>
      <Card className="group overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
        <div className="relative aspect-video overflow-hidden">
          {learningPath.thumbnail_url ? (
            <img
              src={learningPath.thumbnail_url}
              alt={learningPath.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/30 to-primary/10">
              <Trophy className="h-16 w-16 text-primary/50" />
            </div>
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
              <ChevronRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1" />
            </div>
          </CardFooter>
        )}
      </Card>
    </Link>
  );
}

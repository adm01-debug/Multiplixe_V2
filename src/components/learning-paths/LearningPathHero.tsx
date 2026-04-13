import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Clock, Play, Trophy, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LearningPath, LearningPathCourse } from '@/hooks/useLearningPaths';

const levelConfig: Record<string, { label: string; emoji: string; color: string }> = {
  iniciante: { label: 'Iniciante', emoji: '🌱', color: 'bg-green-500/20 text-green-400' },
  intermediario: { label: 'Intermediário', emoji: '🌿', color: 'bg-yellow-500/20 text-yellow-400' },
  avancado: { label: 'Avançado', emoji: '🌳', color: 'bg-red-500/20 text-red-400' },
};

interface LearningPathHeroProps {
  learningPath: LearningPath;
  courses: LearningPathCourse[];
  courseProgress: Record<string, number>;
  hasProgress: boolean;
  isPathCompleted: boolean;
  completedCourses: number;
  progressPercentage: number;
  generatingCertificate: boolean;
  onStartPath: () => void;
  onGenerateCertificate: () => void;
}

const LearningPathHero = ({
  learningPath, courses, courseProgress, hasProgress, isPathCompleted,
  completedCourses, progressPercentage, generatingCertificate,
  onStartPath, onGenerateCertificate,
}: LearningPathHeroProps) => {
  const levelInfo = levelConfig[learningPath.difficulty_level] || levelConfig.iniciante;

  return (
    <div className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent">
      <div className="flex flex-col gap-8 p-6 md:flex-row md:p-8">
        <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-xl md:w-80">
          {learningPath.thumbnail_url ? (
            <img src={learningPath.thumbnail_url} alt={learningPath.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/30 to-primary/10">
              <Trophy className="h-20 w-20 text-primary/50" />
            </div>
          )}
          {isPathCompleted && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <div className="rounded-full bg-green-500 p-4"><Trophy className="h-10 w-10 text-white" /></div>
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className={levelInfo.color}>{levelInfo.emoji} {levelInfo.label}</Badge>
            {learningPath.is_featured && <Badge className="bg-yellow-500/20 text-yellow-400">⭐ Destaque</Badge>}
          </div>

          <h1 className="mb-3 text-2xl font-bold md:text-3xl">{learningPath.title}</h1>
          <p className="mb-6 text-muted-foreground">{learningPath.description}</p>

          <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5"><BookOpen className="h-4 w-4" /><span>{courses.length} cursos</span></div>
            <div className="flex items-center gap-1.5"><Clock className="h-4 w-4" /><span>{learningPath.estimated_hours}h estimadas</span></div>
            <div className="flex items-center gap-1.5"><Trophy className="h-4 w-4 text-yellow-500" /><span>{learningPath.xp_reward} XP de bônus</span></div>
          </div>

          {hasProgress && (
            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{completedCourses} de {courses.length} cursos concluídos</span>
                <span className="font-semibold text-primary">{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {!hasProgress ? (
              <Button onClick={onStartPath} size="lg"><Play className="mr-2 h-5 w-5" />Iniciar Trilha</Button>
            ) : isPathCompleted ? (
              <Button onClick={onGenerateCertificate} size="lg" disabled={generatingCertificate}>
                <GraduationCap className="mr-2 h-5 w-5" />{generatingCertificate ? 'Gerando...' : 'Obter Certificado'}
              </Button>
            ) : (
              <Button asChild size="lg">
                <Link to={`/curso/${courses.find(c => courseProgress[c.course_id] !== 100)?.course.slug || courses[0]?.course.slug}`}>
                  <Play className="mr-2 h-5 w-5" />Continuar Trilha
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningPathHero;

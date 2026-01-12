import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  useLearningPaths, 
  LearningPath, 
  LearningPathCourse, 
  UserLearningPathProgress,
  LearningPathCertificate
} from '@/hooks/useLearningPaths';
import { supabase } from '@/integrations/supabase/client';
import PrefetchLink, { usePrefetchQuery } from '@/components/PrefetchLink';
import { 
  ArrowLeft, 
  BookOpen, 
  CheckCircle2, 
  ChevronRight,
  Clock, 
  Download,
  GraduationCap,
  Lock,
  Play,
  Route,
  Trophy
} from 'lucide-react';

const levelConfig: Record<string, { label: string; emoji: string; color: string }> = {
  iniciante: { label: 'Iniciante', emoji: '🌱', color: 'bg-green-500/20 text-green-400' },
  intermediario: { label: 'Intermediário', emoji: '🌿', color: 'bg-yellow-500/20 text-yellow-400' },
  avancado: { label: 'Avançado', emoji: '🌳', color: 'bg-red-500/20 text-red-400' },
};

// Course List Item Component with Prefetch
interface CourseListItemProps {
  pathCourse: LearningPathCourse;
  index: number;
  isUnlocked: boolean;
  isCompleted: boolean;
  currentProgress: number;
}

function CourseListItem({ pathCourse, index, isUnlocked, isCompleted, currentProgress }: CourseListItemProps) {
  const { prefetchCourseDetail } = usePrefetchQuery();
  const [isPrefetching, setIsPrefetching] = useState(false);

  const handlePrefetch = useCallback(() => {
    if (!isUnlocked) return;
    setIsPrefetching(true);
    prefetchCourseDetail(pathCourse.course.slug);
    setTimeout(() => setIsPrefetching(false), 800);
  }, [pathCourse.course.slug, prefetchCourseDetail, isUnlocked]);

  const cardContent = (
    <Card 
      className={`relative overflow-hidden transition-all duration-300 ${
        isUnlocked 
          ? 'border-border/50 hover:border-primary/50 hover:shadow-lg' 
          : 'opacity-60'
      }`}
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
      
      <CardContent className="p-0">
        <div className="flex items-center gap-4 p-4">
          {/* Order Number */}
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold ${
            isCompleted 
              ? 'bg-green-500 text-white' 
              : isUnlocked
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
          }`}>
            {isCompleted ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              index + 1
            )}
          </div>

          {/* Thumbnail */}
          <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg">
            {pathCourse.course.thumbnail_url ? (
              <img
                src={pathCourse.course.thumbnail_url}
                alt={pathCourse.course.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted">
                <BookOpen className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            {!isUnlocked && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <Lock className="h-5 w-5 text-white" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <h3 className="mb-1 truncate font-semibold">
              {pathCourse.course.title}
            </h3>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>{pathCourse.course.total_lessons} aulas</span>
              <span>{Math.round(pathCourse.course.duration_minutes / 60)}h</span>
              {currentProgress > 0 && currentProgress < 100 && (
                <span className="text-primary">{currentProgress}% concluído</span>
              )}
            </div>
          </div>

          {/* Action */}
          {isUnlocked && (
            <Button 
              variant={isCompleted ? 'outline' : 'default'} 
              size="sm"
            >
              {isCompleted ? 'Revisar' : currentProgress > 0 ? 'Continuar' : 'Começar'}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>

        {currentProgress > 0 && currentProgress < 100 && (
          <Progress value={currentProgress} className="h-1 rounded-none" />
        )}
      </CardContent>
    </Card>
  );

  if (!isUnlocked) {
    return cardContent;
  }

  return (
    <PrefetchLink 
      to={`/curso/${pathCourse.course.slug}`} 
      onPrefetchData={handlePrefetch}
      className="block"
    >
      {cardContent}
    </PrefetchLink>
  );
}

export default function LearningPathDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    getLearningPathBySlug, 
    getLearningPathCourses, 
    getUserProgress,
    startLearningPath,
    issueCertificate
  } = useLearningPaths();

  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [courses, setCourses] = useState<LearningPathCourse[]>([]);
  const [progress, setProgress] = useState<UserLearningPathProgress | null>(null);
  const [courseProgress, setCourseProgress] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [certificate, setCertificate] = useState<LearningPathCertificate | null>(null);
  const [generatingCertificate, setGeneratingCertificate] = useState(false);

  const fetchData = useCallback(async () => {
    if (!slug) return;

    try {
      setLoading(true);
      const path = await getLearningPathBySlug(slug);
      if (!path) {
        navigate('/trilhas');
        return;
      }

      setLearningPath(path);
      const pathCourses = await getLearningPathCourses(path.id);
      setCourses(pathCourses);

      if (user) {
        const userProgress = await getUserProgress(path.id);
        setProgress(userProgress);

        // Fetch course completion status
        const { data: courseProgressData } = await supabase
          .from('user_course_progress')
          .select('course_id, progress_percentage')
          .eq('user_id', user.id)
          .in('course_id', pathCourses.map(c => c.course_id));

        if (courseProgressData) {
          const progressMap: Record<string, number> = {};
          courseProgressData.forEach((p: any) => {
            progressMap[p.course_id] = p.progress_percentage;
          });
          setCourseProgress(progressMap);
        }
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [slug, user, getLearningPathBySlug, getLearningPathCourses, getUserProgress, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStartPath = async () => {
    if (!learningPath || !user) {
      navigate('/auth');
      return;
    }

    await startLearningPath(learningPath.id, courses.length);
    toast({
      title: '🎯 Trilha iniciada!',
      description: 'Boa sorte na sua jornada de aprendizado!',
    });
    fetchData();
  };

  const handleGenerateCertificate = async () => {
    if (!learningPath || !user) return;

    try {
      setGeneratingCertificate(true);
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();

      const userName = profile?.full_name || user.email?.split('@')[0] || 'Estudante';
      const cert = await issueCertificate(learningPath.id, userName, learningPath.title);
      
      if (cert) {
        setCertificate(cert);
        setShowCertificateModal(true);
        toast({
          title: '🎓 Certificado gerado!',
          description: 'Parabéns por completar a trilha!',
        });
      }
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar o certificado.',
        variant: 'destructive',
      });
    } finally {
      setGeneratingCertificate(false);
    }
  };

  const isCourseUnlocked = (index: number) => {
    if (index === 0) return true;
    const prevCourse = courses[index - 1];
    return courseProgress[prevCourse.course_id] === 100;
  };

  const completedCourses = courses.filter(c => courseProgress[c.course_id] === 100).length;
  const isPathCompleted = completedCourses === courses.length && courses.length > 0;
  const progressPercentage = courses.length > 0 
    ? Math.round((completedCourses / courses.length) * 100) 
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-lg">
          <div className="container mx-auto flex h-16 items-center px-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="ml-4 h-6 w-48" />
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <Skeleton className="mb-8 h-64 w-full rounded-2xl" />
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!learningPath) return null;

  const levelInfo = levelConfig[learningPath.difficulty_level] || levelConfig.iniciante;

  return (
    <>
      <Helmet>
        <title>{learningPath.title} | Trilha de Aprendizado</title>
        <meta name="description" content={learningPath.description || ''} />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-lg">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <Link to="/trilhas">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Route className="h-6 w-6 text-primary" />
                <span className="font-semibold">Trilha</span>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent">
            <div className="flex flex-col gap-8 p-6 md:flex-row md:p-8">
              {/* Thumbnail */}
              <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-xl md:w-80">
                {learningPath.thumbnail_url ? (
                  <img
                    src={learningPath.thumbnail_url}
                    alt={learningPath.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/30 to-primary/10">
                    <Trophy className="h-20 w-20 text-primary/50" />
                  </div>
                )}
                {isPathCompleted && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <div className="rounded-full bg-green-500 p-4">
                      <Trophy className="h-10 w-10 text-white" />
                    </div>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className={levelInfo.color}>
                    {levelInfo.emoji} {levelInfo.label}
                  </Badge>
                  {learningPath.is_featured && (
                    <Badge className="bg-yellow-500/20 text-yellow-400">
                      ⭐ Destaque
                    </Badge>
                  )}
                </div>

                <h1 className="mb-3 text-2xl font-bold md:text-3xl">
                  {learningPath.title}
                </h1>

                <p className="mb-6 text-muted-foreground">
                  {learningPath.description}
                </p>

                <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4" />
                    <span>{courses.length} cursos</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    <span>{learningPath.estimated_hours}h estimadas</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    <span>{learningPath.xp_reward} XP de bônus</span>
                  </div>
                </div>

                {/* Progress */}
                {progress && (
                  <div className="mb-6">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {completedCourses} de {courses.length} cursos concluídos
                      </span>
                      <span className="font-semibold text-primary">
                        {progressPercentage}%
                      </span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  {!progress ? (
                    <Button onClick={handleStartPath} size="lg">
                      <Play className="mr-2 h-5 w-5" />
                      Iniciar Trilha
                    </Button>
                  ) : isPathCompleted ? (
                    <Button 
                      onClick={handleGenerateCertificate} 
                      size="lg"
                      disabled={generatingCertificate}
                    >
                      <GraduationCap className="mr-2 h-5 w-5" />
                      {generatingCertificate ? 'Gerando...' : 'Obter Certificado'}
                    </Button>
                  ) : (
                    <Button asChild size="lg">
                      <Link to={`/curso/${courses.find(c => courseProgress[c.course_id] !== 100)?.course.slug || courses[0]?.course.slug}`}>
                        <Play className="mr-2 h-5 w-5" />
                        Continuar Trilha
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Courses List */}
          <section>
            <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold">
              <BookOpen className="h-5 w-5 text-primary" />
              Cursos da Trilha
            </h2>

            <div className="space-y-4">
              {courses.map((pathCourse, index) => (
                <CourseListItem
                  key={pathCourse.id}
                  pathCourse={pathCourse}
                  index={index}
                  isUnlocked={isCourseUnlocked(index)}
                  isCompleted={courseProgress[pathCourse.course_id] === 100}
                  currentProgress={courseProgress[pathCourse.course_id] || 0}
                />
              ))}
            </div>
          </section>
        </main>

        {/* Certificate Modal */}
        <Dialog open={showCertificateModal} onOpenChange={setShowCertificateModal}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <GraduationCap className="h-6 w-6 text-primary" />
                Certificado de Conclusão
              </DialogTitle>
              <DialogDescription>
                Parabéns! Você completou a trilha "{learningPath?.title}".
              </DialogDescription>
            </DialogHeader>

            {certificate && (
              <div className="space-y-4">
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-6 text-center">
                  <Trophy className="mx-auto mb-4 h-16 w-16 text-yellow-500" />
                  <h3 className="mb-2 text-xl font-bold">{certificate.path_title}</h3>
                  <p className="mb-4 text-muted-foreground">
                    Certificado emitido para <strong>{certificate.user_name}</strong>
                  </p>
                  <div className="rounded bg-muted px-3 py-2 font-mono text-sm">
                    Código: {certificate.verification_code}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/verificar-certificado?code=${certificate.verification_code}`
                      );
                      toast({ title: 'Link copiado!' });
                    }}
                  >
                    Copiar Link
                  </Button>
                  <Button className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
                    Baixar PDF
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

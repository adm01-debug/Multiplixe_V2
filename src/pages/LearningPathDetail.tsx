import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  useLearningPaths, LearningPath, LearningPathCourse,
  UserLearningPathProgress, LearningPathCertificate,
} from '@/hooks/useLearningPaths';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, BookOpen, Route } from 'lucide-react';
import LearningPathHero from '@/components/learning-paths/LearningPathHero';
import CertificateModal from '@/components/learning-paths/CertificateModal';
import LearningPathCourseItem from '@/components/learning-paths/LearningPathCourseItem';

export default function LearningPathDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { getLearningPathBySlug, getLearningPathCourses, getUserProgress, startLearningPath, issueCertificate } = useLearningPaths();

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
      if (!path) { navigate('/trilhas'); return; }
      setLearningPath(path);
      const pathCourses = await getLearningPathCourses(path.id);
      setCourses(pathCourses);

      if (user) {
        const userProgress = await getUserProgress(path.id);
        setProgress(userProgress);
        const { data: courseProgressData } = await supabase
          .from('user_course_progress')
          .select('course_id, progress_percentage')
          .eq('user_id', user.id)
          .in('course_id', pathCourses.map(c => c.course_id));
        if (courseProgressData) {
          const progressMap: Record<string, number> = {};
          courseProgressData.forEach((p: { course_id: string; progress_percentage: number }) => {
            progressMap[p.course_id] = p.progress_percentage;
          });
          setCourseProgress(progressMap);
        }
      }
    } catch { /* Silent fail */ } finally { setLoading(false); }
  }, [slug, user, getLearningPathBySlug, getLearningPathCourses, getUserProgress, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleStartPath = async () => {
    if (!learningPath || !user) { navigate('/auth'); return; }
    await startLearningPath(learningPath.id, courses.length);
    toast({ title: '🎯 Trilha iniciada!', description: 'Boa sorte na sua jornada de aprendizado!' });
    fetchData();
  };

  const handleGenerateCertificate = async () => {
    if (!learningPath || !user) return;
    try {
      setGeneratingCertificate(true);
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('user_id', user.id).single();
      const userName = profile?.full_name || user.email?.split('@')[0] || 'Estudante';
      const cert = await issueCertificate(learningPath.id, userName, learningPath.title);
      if (cert) {
        setCertificate(cert);
        setShowCertificateModal(true);
        toast({ title: '🎓 Certificado gerado!', description: 'Parabéns por completar a trilha!' });
      }
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível gerar o certificado.', variant: 'destructive' });
    } finally { setGeneratingCertificate(false); }
  };

  const isCourseUnlocked = (index: number) => {
    if (index === 0) return true;
    return courseProgress[courses[index - 1].course_id] === 100;
  };

  const completedCourses = courses.filter(c => courseProgress[c.course_id] === 100).length;
  const isPathCompleted = completedCourses === courses.length && courses.length > 0;
  const progressPercentage = courses.length > 0 ? Math.round((completedCourses / courses.length) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-lg">
          <div className="container mx-auto flex h-16 items-center px-4">
            <Skeleton className="h-10 w-10" /><Skeleton className="ml-4 h-6 w-48" />
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <Skeleton className="mb-8 h-64 w-full rounded-2xl" />
          <div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
        </main>
      </div>
    );
  }

  if (!learningPath) return null;

  return (
    <>
      <Helmet>
        <title>{learningPath.title} | Trilha de Aprendizado</title>
        <meta name="description" content={learningPath.description || ''} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-lg">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <Link to="/trilhas"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
              <div className="flex items-center gap-2"><Route className="h-6 w-6 text-primary" /><span className="font-semibold">Trilha</span></div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <LearningPathHero
            learningPath={learningPath}
            courses={courses}
            courseProgress={courseProgress}
            hasProgress={!!progress}
            isPathCompleted={isPathCompleted}
            completedCourses={completedCourses}
            progressPercentage={progressPercentage}
            generatingCertificate={generatingCertificate}
            onStartPath={handleStartPath}
            onGenerateCertificate={handleGenerateCertificate}
          />

          <section>
            <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold">
              <BookOpen className="h-5 w-5 text-primary" />Cursos da Trilha
            </h2>
            <div className="space-y-4">
              {courses.map((pathCourse, index) => (
                <LearningPathCourseItem
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

        <CertificateModal
          open={showCertificateModal}
          onOpenChange={setShowCertificateModal}
          certificate={certificate}
          pathTitle={learningPath.title}
        />
      </div>
    </>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLearningPaths, UserLearningPathProgress } from '@/hooks/useLearningPaths';
import { useAuth } from '@/hooks/useAuth';
import { LearningPathCard } from '@/components/learning-paths/LearningPathCard';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, 
  GraduationCap, 
  Route,
  Sparkles
} from 'lucide-react';

export default function LearningPaths() {
  const { user } = useAuth();
  const { learningPaths, loading } = useLearningPaths();
  const [userProgress, setUserProgress] = useState<Record<string, UserLearningPathProgress>>({});

  useEffect(() => {
    const fetchUserProgress = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('user_learning_path_progress')
        .select('*')
        .eq('user_id', user.id);

      if (data) {
        const progressMap: Record<string, UserLearningPathProgress> = {};
        data.forEach((p: any) => {
          progressMap[p.learning_path_id] = p;
        });
        setUserProgress(progressMap);
      }
    };

    fetchUserProgress();
  }, [user]);

  const featuredPaths = learningPaths.filter(p => p.is_featured);
  const regularPaths = learningPaths.filter(p => !p.is_featured);

  return (
    <>
      <Helmet>
        <title>Trilhas de Aprendizado | Plataforma de Cursos</title>
        <meta name="description" content="Explore trilhas de aprendizado estruturadas com cursos ordenados e certificados de conclusão." />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-lg">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Route className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold">Trilhas de Aprendizado</h1>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="mb-12 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-8 md:p-12">
            <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="mb-2 flex items-center gap-2 text-3xl font-bold md:text-4xl">
                  <Sparkles className="h-8 w-8 text-primary" />
                  Trilhas de Aprendizado
                </h2>
                <p className="max-w-2xl text-muted-foreground">
                  Siga trilhas estruturadas com cursos ordenados por especialistas. 
                  Complete todos os cursos para ganhar XP bônus e um certificado exclusivo de conclusão da trilha.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-background/50 p-4">
                <GraduationCap className="h-10 w-10 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{learningPaths.length}</p>
                  <p className="text-sm text-muted-foreground">trilhas disponíveis</p>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-video w-full rounded-lg" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
            </div>
          ) : learningPaths.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Route className="mb-4 h-16 w-16 text-muted-foreground/50" />
              <h3 className="mb-2 text-xl font-semibold">Nenhuma trilha disponível</h3>
              <p className="text-muted-foreground">
                Novas trilhas de aprendizado serão adicionadas em breve.
              </p>
            </div>
          ) : (
            <>
              {/* Featured Paths */}
              {featuredPaths.length > 0 && (
                <section className="mb-12">
                  <h3 className="mb-6 flex items-center gap-2 text-xl font-semibold">
                    <Sparkles className="h-5 w-5 text-yellow-500" />
                    Trilhas em Destaque
                  </h3>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {featuredPaths.map((path) => (
                      <LearningPathCard
                        key={path.id}
                        learningPath={path}
                        progress={userProgress[path.id]}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* All Paths */}
              {regularPaths.length > 0 && (
                <section>
                  <h3 className="mb-6 text-xl font-semibold">Todas as Trilhas</h3>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {regularPaths.map((path) => (
                      <LearningPathCard
                        key={path.id}
                        learningPath={path}
                        progress={userProgress[path.id]}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
}

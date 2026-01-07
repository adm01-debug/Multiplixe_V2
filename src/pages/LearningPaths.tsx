import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { LearningPathGridSkeleton } from '@/components/skeletons/PageSkeletons';
import { useAuth } from '@/hooks/useAuth';
import { LearningPathCard } from '@/components/learning-paths/LearningPathCard';
import VirtualizedLearningPathGrid from '@/components/VirtualizedLearningPathGrid';
import { useLearningPathsList, useUserLearningPathProgressCached } from '@/hooks/useCachedQuery';
import EmptyState from '@/components/EmptyState';
import { 
  ArrowLeft, 
  GraduationCap, 
  Route,
  Sparkles
} from 'lucide-react';

// Threshold para ativar virtualização
const VIRTUALIZATION_THRESHOLD = 12;

export default function LearningPaths() {
  const { user } = useAuth();
  
  // Usar hooks cacheados com React Query
  const { data: learningPathsData = [], isLoading: pathsLoading } = useLearningPathsList();
  const { data: userProgress = {}, isLoading: progressLoading } = useUserLearningPathProgressCached(user?.id || '');

  // Transformar dados para o formato esperado pelos componentes
  const learningPaths = useMemo(() => {
    return learningPathsData.map((path: any) => ({
      id: path.id,
      title: path.title,
      slug: path.slug,
      description: path.description,
      thumbnail_url: path.thumbnail_url,
      estimated_hours: path.estimated_hours ?? 0,
      difficulty_level: path.difficulty_level ?? 'Iniciante',
      is_published: path.is_published ?? true,
      is_featured: path.is_featured ?? false,
      xp_reward: path.xp_reward ?? 0,
      created_at: path.created_at,
      courses_count: path.learning_path_courses?.length ?? 0,
    }));
  }, [learningPathsData]);

  const featuredPaths = useMemo(() => learningPaths.filter(p => p.is_featured), [learningPaths]);
  const regularPaths = useMemo(() => learningPaths.filter(p => !p.is_featured), [learningPaths]);

  const loading = pathsLoading || progressLoading;

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
            <LearningPathGridSkeleton count={6} />
          ) : learningPaths.length === 0 ? (
            <EmptyState type="learning-paths" />
          ) : (
            <>
              {/* Featured Paths */}
              {featuredPaths.length > 0 && (
                <section className="mb-12">
                  <h3 className="mb-6 flex items-center gap-2 text-xl font-semibold">
                    <Sparkles className="h-5 w-5 text-yellow-500" />
                    Trilhas em Destaque
                  </h3>
                  <motion.div 
                    className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: {
                        opacity: 1,
                        transition: { staggerChildren: 0.1 }
                      }
                    }}
                  >
                    {featuredPaths.map((path) => (
                      <motion.div
                        key={path.id}
                        variants={{
                          hidden: { opacity: 0, y: 20, scale: 0.95 },
                          visible: { 
                            opacity: 1, 
                            y: 0, 
                            scale: 1,
                            transition: { duration: 0.4, ease: "easeOut" }
                          }
                        }}
                      >
                        <LearningPathCard
                          learningPath={path}
                          progress={userProgress[path.id]}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                </section>
              )}

              {/* All Paths - com virtualização para listas grandes */}
              {regularPaths.length > 0 && (
                <section>
                  <h3 className="mb-6 text-xl font-semibold">Todas as Trilhas</h3>
                  {regularPaths.length >= VIRTUALIZATION_THRESHOLD ? (
                    <VirtualizedLearningPathGrid
                      learningPaths={regularPaths}
                      userProgress={userProgress}
                      columns={3}
                    />
                  ) : (
                    <motion.div 
                      className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                      initial="hidden"
                      animate="visible"
                      variants={{
                        hidden: { opacity: 0 },
                        visible: {
                          opacity: 1,
                          transition: { staggerChildren: 0.1, delayChildren: 0.2 }
                        }
                      }}
                    >
                      {regularPaths.map((path) => (
                        <motion.div
                          key={path.id}
                          variants={{
                            hidden: { opacity: 0, y: 20, scale: 0.95 },
                            visible: { 
                              opacity: 1, 
                              y: 0, 
                              scale: 1,
                              transition: { duration: 0.4, ease: "easeOut" }
                            }
                          }}
                        >
                          <LearningPathCard
                            learningPath={path}
                            progress={userProgress[path.id]}
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </section>
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
}

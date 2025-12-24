import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  GraduationCap,
  LogOut,
  User,
  Clock,
  BookOpen,
  ArrowLeft,
  Play,
  CheckCircle,
  Loader2,
  Award,
} from "lucide-react";

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  duration_minutes: number;
  level: string;
  instructor_name: string | null;
  instructor_avatar: string | null;
  total_lessons: number;
  is_featured: boolean;
  categories: {
    id: string;
    name: string;
    slug: string;
    color: string | null;
  } | null;
}

interface UserProgress {
  progress_percentage: number;
  started_at: string;
  completed_at: string | null;
}

const levelLabels: Record<string, string> = {
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

const CourseDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchCourse = async () => {
      if (!user || !slug) return;

      setLoading(true);

      const { data: courseData, error } = await supabase
        .from("courses")
        .select(`
          *,
          categories (*)
        `)
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();

      if (error || !courseData) {
        toast.error("Curso não encontrado");
        navigate("/catalogo");
        return;
      }

      setCourse(courseData as Course);

      // Fetch user progress
      const { data: progressData } = await supabase
        .from("user_course_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("course_id", courseData.id)
        .maybeSingle();

      if (progressData) {
        setProgress(progressData);
      }

      setLoading(false);
    };

    fetchCourse();
  }, [user, slug, navigate]);

  const handleStartCourse = async () => {
    if (!user || !course) return;

    setStarting(true);

    const { error } = await supabase.from("user_course_progress").insert({
      user_id: user.id,
      course_id: course.id,
      progress_percentage: 0,
    });

    if (error) {
      if (error.code === "23505") {
        toast.info("Você já iniciou este curso!");
      } else {
        toast.error("Erro ao iniciar curso");
      }
    } else {
      toast.success("Curso iniciado! Bons estudos!");
      setProgress({
        progress_percentage: 0,
        started_at: new Date().toISOString(),
        completed_at: null,
      });
    }

    setStarting(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !course) {
    return null;
  }

  const userName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Colaborador";
  const hours = Math.floor(course.duration_minutes / 60);
  const minutes = course.duration_minutes % 60;
  const durationText = hours > 0
    ? `${hours}h ${minutes > 0 ? `${minutes}min` : ""}`
    : `${minutes}min`;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">MULTIPLIXE</h1>
              <p className="text-xs text-muted-foreground">by Promo Brindes</p>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{userName}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link to="/catalogo">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao catálogo
          </Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Header */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {course.categories && (
                  <Badge
                    style={{
                      backgroundColor: course.categories.color
                        ? `${course.categories.color}20`
                        : undefined,
                      color: course.categories.color || undefined,
                    }}
                  >
                    {course.categories.name}
                  </Badge>
                )}
                <Badge variant="secondary">{levelLabels[course.level]}</Badge>
                {course.is_featured && (
                  <Badge className="bg-accent text-accent-foreground">Destaque</Badge>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {course.title}
              </h1>

              <p className="text-lg text-muted-foreground">{course.description}</p>
            </div>

            {/* Course Preview */}
            <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
              <button className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                <Play className="w-8 h-8 ml-1" fill="currentColor" />
              </button>
            </div>

            {/* What you'll learn */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  O que você vai aprender
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid md:grid-cols-2 gap-3">
                  {[
                    "Fundamentos e conceitos essenciais",
                    "Técnicas práticas aplicáveis no dia a dia",
                    "Melhores práticas do mercado",
                    "Casos de uso e exemplos reais",
                  ].map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Course Info Card */}
            <Card className="border-border/50 sticky top-24">
              <CardContent className="p-6 space-y-6">
                {/* Progress */}
                {progress && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Seu progresso</span>
                      <span className="font-medium text-primary">
                        {progress.progress_percentage}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${progress.progress_percentage}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* CTA Button */}
                {progress ? (
                  <Button className="w-full" size="lg">
                    <Play className="h-4 w-4 mr-2" />
                    Continuar Curso
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleStartCourse}
                    disabled={starting}
                  >
                    {starting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Iniciando...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Iniciar Curso
                      </>
                    )}
                  </Button>
                )}

                {/* Course Stats */}
                <div className="space-y-4 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{durationText}</p>
                      <p className="text-xs text-muted-foreground">Duração total</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {course.total_lessons} aulas
                      </p>
                      <p className="text-xs text-muted-foreground">Conteúdo do curso</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Certificado</p>
                      <p className="text-xs text-muted-foreground">Ao concluir o curso</p>
                    </div>
                  </div>
                </div>

                {/* Instructor */}
                {course.instructor_name && (
                  <div className="pt-4 border-t border-border/50">
                    <p className="text-xs text-muted-foreground mb-2">Instrutor(a)</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{course.instructor_name}</p>
                        <p className="text-xs text-muted-foreground">Instrutor MULTIPLIXE</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CourseDetail;

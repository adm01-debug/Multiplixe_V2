import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import CourseCard from "@/components/catalog/CourseCard";
import CategoryFilter from "@/components/catalog/CategoryFilter";
import LevelFilter from "@/components/catalog/LevelFilter";
import SearchInput from "@/components/catalog/SearchInput";
import EmptyState from "@/components/EmptyState";
import { 
  GraduationCap, 
  LogOut, 
  User, 
  Loader2, 
  Sparkles, 
  Rocket,
  Search,
  Filter,
  ChevronDown,
  LayoutGrid
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
}

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  duration_minutes: number;
  level: string;
  instructor_name: string | null;
  total_lessons: number;
  is_featured: boolean;
  category_id: string | null;
  categories: Category | null;
}

const Catalog = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      setLoading(true);
      
      const [coursesRes, categoriesRes] = await Promise.all([
        supabase
          .from("courses")
          .select(`
            *,
            categories (*)
          `)
          .eq("is_published", true)
          .order("is_featured", { ascending: false })
          .order("created_at", { ascending: false }),
        supabase.from("categories").select("*").order("name"),
      ]);

      if (coursesRes.data) {
        setCourses(coursesRes.data as Course[]);
      }
      if (categoriesRes.data) {
        setCategories(categoriesRes.data);
      }
      
      setLoading(false);
    };

    fetchData();
  }, [user]);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = course.title.toLowerCase().includes(query);
        const matchesDescription = course.description?.toLowerCase().includes(query);
        const matchesInstructor = course.instructor_name?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDescription && !matchesInstructor) {
          return false;
        }
      }
      
      if (selectedCategory && course.categories?.slug !== selectedCategory) {
        return false;
      }
      
      if (selectedLevel && course.level !== selectedLevel) {
        return false;
      }
      
      return true;
    });
  }, [courses, searchQuery, selectedCategory, selectedLevel]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-secondary animate-spin-slow" />
            <div className="absolute inset-2 bg-background rounded-full" />
            <Loader2 className="absolute inset-0 m-auto h-6 w-6 animate-spin text-primary" />
          </div>
          <p className="text-muted-foreground font-medium animate-pulse">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const userName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Colaborador";
  const hasActiveFilters = selectedCategory || selectedLevel;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 glass neon-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity dark:opacity-70 dark:group-hover:opacity-100" />
                <div className="relative p-2.5 bg-gradient-to-r from-primary to-accent rounded-2xl shadow-lg neon-button">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent flex items-center justify-center pulse-glow">
                  <Sparkles className="w-2.5 h-2.5 text-accent-foreground" />
                </div>
              </div>
              <div>
                <h1 className="font-display font-bold text-xl text-foreground tracking-tight">
                  MULTIPLI<span className="text-gradient neon-text">XE</span>
                </h1>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">by Promo Brindes</p>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1 p-1 bg-muted/50 rounded-2xl neon-border">
              <Link 
                to="/dashboard" 
                className="px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-xl transition-colors"
              >
                Dashboard
              </Link>
              <Link 
                to="/catalogo" 
                className="px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-primary to-accent text-white rounded-xl shadow-lg neon-button"
              >
                Catálogo
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <Link 
                to="/perfil" 
                className="hidden sm:flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-2xl neon-border hover:bg-muted transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm neon-button">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-foreground">{userName}</span>
              </Link>
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleSignOut}
                className="rounded-xl border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 h-11 w-11 neon-border"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="relative mb-10 p-8 md:p-12 rounded-[2rem] overflow-hidden neon-card">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-background dark:from-primary/30 dark:via-accent/20" />
          <div className="absolute inset-0 opacity-30 dark:opacity-50" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--primary) / 0.2) 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }} />
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-primary/30 to-accent/20 dark:from-primary/50 dark:to-accent/40 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-br from-accent/20 to-primary/10 dark:from-accent/40 dark:to-primary/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4" />
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6 dark:bg-primary/10 dark:border-primary/30 dark:shadow-[0_0_20px_hsl(270_100%_70%/0.2)]">
              <Sparkles className="h-4 w-4 text-primary neon-icon" />
              <span className="text-sm font-semibold text-foreground">Catálogo de Cursos</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
              Explore e <span className="text-gradient neon-text">Evolua</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Descubra cursos incríveis para impulsionar sua carreira e alcançar novos patamares de conhecimento 🚀
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 mt-8">
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 neon-card">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg dark:shadow-[0_0_20px_hsl(270_100%_70%/0.4)]">
                  <LayoutGrid className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{courses.length}</p>
                  <p className="text-sm text-muted-foreground">Cursos disponíveis</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 neon-card">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg dark:shadow-[0_0_20px_hsl(25_100%_55%/0.4)]">
                  <Rocket className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{categories.length}</p>
                  <p className="text-sm text-muted-foreground">Categorias</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <SearchInput 
                value={searchQuery} 
                onChange={setSearchQuery}
                className="pl-12 h-14 text-base rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm focus:bg-card neon-border"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={`h-14 px-6 rounded-2xl border-border/50 gap-2 neon-border ${hasActiveFilters ? 'bg-primary/10 border-primary/50 text-primary dark:shadow-[0_0_20px_hsl(270_100%_70%/0.3)]' : ''}`}
            >
              <Filter className="h-5 w-5" />
              <span>Filtros</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse dark:shadow-[0_0_10px_hsl(270_100%_70%/0.8)]" />
              )}
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
          </div>

          {/* Filter Panel */}
          <div className={`overflow-hidden transition-all duration-300 ${showFilters ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="p-6 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 space-y-5 neon-card">
              <div>
                <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span>📂</span> Categorias
                </p>
                <CategoryFilter
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                />
              </div>
              
              <div className="border-t border-border/50 pt-5">
                <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span>📊</span> Nível de Dificuldade
                </p>
                <LevelFilter
                  selectedLevel={selectedLevel}
                  onSelectLevel={setSelectedLevel}
                />
              </div>

              {hasActiveFilters && (
                <div className="pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCategory(null);
                      setSelectedLevel(null);
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Limpar filtros
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{filteredCourses.length}</span> {filteredCourses.length === 1 ? "curso encontrado" : "cursos encontrados"}
          </p>
        </div>

        {/* Course Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-3xl bg-card/50 border border-border/50 overflow-hidden animate-pulse">
                <div className="aspect-[16/10] bg-muted" />
                <div className="p-5 space-y-4">
                  <div className="h-5 bg-muted rounded-lg w-3/4" />
                  <div className="h-4 bg-muted rounded-lg w-full" />
                  <div className="h-4 bg-muted rounded-lg w-1/2" />
                  <div className="flex gap-2">
                    <div className="h-6 bg-muted rounded-full w-16" />
                    <div className="h-6 bg-muted rounded-full w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCourses.map((course, index) => (
              <div 
                key={course.id} 
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <CourseCard
                  id={course.id}
                  slug={course.slug}
                  title={course.title}
                  description={course.description}
                  thumbnailUrl={course.thumbnail_url}
                  durationMinutes={course.duration_minutes}
                  level={course.level}
                  instructorName={course.instructor_name}
                  totalLessons={course.total_lessons}
                  categoryName={course.categories?.name}
                  categoryColor={course.categories?.color || undefined}
                  isFeatured={course.is_featured}
                />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            type="search"
            title="Nenhum curso encontrado"
            description="Tente ajustar os filtros ou buscar por outros termos para encontrar o curso perfeito para você"
            actionLabel="Limpar busca"
            onAction={() => {
              setSearchQuery("");
              setSelectedCategory(null);
              setSelectedLevel(null);
            }}
          />
        )}
      </main>
    </div>
  );
};

export default Catalog;

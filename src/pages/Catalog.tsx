import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import CourseCard from "@/components/catalog/CourseCard";
import CategoryFilter from "@/components/catalog/CategoryFilter";
import LevelFilter from "@/components/catalog/LevelFilter";
import SearchInput from "@/components/catalog/SearchInput";
import { 
  GraduationCap, 
  LogOut, 
  User, 
  BookOpen, 
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
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-2xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative p-2.5 bg-gradient-to-r from-primary to-secondary rounded-xl">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="font-display font-bold text-xl text-foreground">MULTIPLIXE</h1>
                <p className="text-xs text-muted-foreground">by Promo Brindes</p>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link 
                to="/dashboard" 
                className="px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-all"
              >
                Dashboard
              </Link>
              <Link 
                to="/catalogo" 
                className="px-4 py-2 text-foreground font-medium bg-primary/10 text-primary rounded-xl"
              >
                Catálogo
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">{userName}</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSignOut}
                className="rounded-xl border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="relative mb-10 p-8 md:p-12 rounded-3xl overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/5" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-br from-accent/20 to-primary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="px-3 py-1.5 bg-primary/10 rounded-full">
                <div className="flex items-center gap-2 text-primary">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-sm font-semibold">Catálogo de Cursos</span>
                </div>
              </div>
            </div>
            
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
              Explore e <span className="text-gradient">Evolua</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Descubra cursos incríveis para impulsionar sua carreira e alcançar novos patamares de conhecimento 🚀
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 mt-8">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10">
                  <LayoutGrid className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{courses.length}</p>
                  <p className="text-sm text-muted-foreground">Cursos disponíveis</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-secondary/10">
                  <Rocket className="h-5 w-5 text-secondary" />
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
                className="pl-12 h-14 text-base rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm focus:bg-card"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={`h-14 px-6 rounded-2xl border-border/50 gap-2 ${hasActiveFilters ? 'bg-primary/10 border-primary/50 text-primary' : ''}`}
            >
              <Filter className="h-5 w-5" />
              <span>Filtros</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              )}
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
          </div>

          {/* Filter Panel */}
          <div className={`overflow-hidden transition-all duration-300 ${showFilters ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="p-6 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 space-y-5">
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
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-2xl" />
              <div className="relative p-6 bg-card rounded-full border border-border/50">
                <BookOpen className="h-12 w-12 text-muted-foreground" />
              </div>
            </div>
            <h3 className="text-xl font-display font-bold text-foreground mb-2">
              Nenhum curso encontrado
            </h3>
            <p className="text-muted-foreground max-w-md mb-6">
              Tente ajustar os filtros ou buscar por outros termos para encontrar o curso perfeito para você
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory(null);
                setSelectedLevel(null);
              }}
              className="rounded-xl"
            >
              Limpar busca
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Catalog;

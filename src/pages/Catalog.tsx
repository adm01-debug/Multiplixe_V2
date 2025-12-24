import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import CourseCard from "@/components/catalog/CourseCard";
import CategoryFilter from "@/components/catalog/CategoryFilter";
import LevelFilter from "@/components/catalog/LevelFilter";
import SearchInput from "@/components/catalog/SearchInput";
import { GraduationCap, LogOut, User, BookOpen, Loader2 } from "lucide-react";

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
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = course.title.toLowerCase().includes(query);
        const matchesDescription = course.description?.toLowerCase().includes(query);
        const matchesInstructor = course.instructor_name?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDescription && !matchesInstructor) {
          return false;
        }
      }
      
      // Category filter
      if (selectedCategory && course.categories?.slug !== selectedCategory) {
        return false;
      }
      
      // Level filter
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const userName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Colaborador";

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

          <nav className="hidden md:flex items-center gap-6">
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <Link to="/catalogo" className="text-foreground font-medium">
              Catálogo
            </Link>
          </nav>

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
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Catálogo de Cursos</h2>
          <p className="text-muted-foreground">
            Explore todos os cursos disponíveis e continue sua jornada de aprendizado
          </p>
        </div>

        {/* Filters */}
        <div className="space-y-4 mb-8 p-6 bg-card rounded-xl border border-border/50">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <SearchInput value={searchQuery} onChange={setSearchQuery} />
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Categorias</p>
              <CategoryFilter
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
            </div>
            
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Nível</p>
              <LevelFilter
                selectedLevel={selectedLevel}
                onSelectLevel={setSelectedLevel}
              />
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            {filteredCourses.length} {filteredCourses.length === 1 ? "curso encontrado" : "cursos encontrados"}
          </p>
        </div>

        {/* Course Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCourses.map((course) => (
              <CourseCard
                key={course.id}
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
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 bg-muted rounded-full mb-4">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhum curso encontrado
            </h3>
            <p className="text-muted-foreground max-w-md">
              Tente ajustar os filtros ou buscar por outros termos
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Catalog;

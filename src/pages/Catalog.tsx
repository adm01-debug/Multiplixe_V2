import { useCallback, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCourses, useCategories } from "@/hooks/useCachedQuery";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useFuzzySearchWithMatches } from "@/hooks/useFuzzySearch";
import CacheIndicator from "@/components/ui/CacheIndicator";
import { Button } from "@/components/ui/button";
import CourseCard from "@/components/catalog/CourseCard";
import CategoryFilter from "@/components/catalog/CategoryFilter";
import LevelFilter from "@/components/catalog/LevelFilter";
import SearchInput from "@/components/catalog/SearchInput";
import CatalogHeader from "@/components/catalog/CatalogHeader";
import CatalogHero from "@/components/catalog/CatalogHero";
import EmptyState from "@/components/EmptyState";
import { CourseGridSkeleton } from "@/components/skeletons/PageSkeletons";
import VirtualizedCourseGrid from "@/components/VirtualizedCourseGrid";
import { 
  StaggerContainer, StaggerItem,
  scaleUpContainerVariants, scaleUpItemVariants 
} from "@/components/ui/stagger-container";
import { Loader2, Search, Filter, ChevronDown } from "lucide-react";
import type { FuseResultMatch } from "fuse.js";

const VIRTUALIZATION_THRESHOLD = 20;

interface Category {
  id: string; name: string; slug: string; description: string | null; icon: string | null; color: string | null;
}

interface Course {
  id: string; title: string; slug: string; description: string | null; thumbnail_url: string | null;
  duration_minutes: number | null; level: string | null; instructor_name: string | null;
  total_lessons: number | null; is_featured: boolean | null; category_id: string | null; categories: Category | null;
}

const Catalog = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { data: courses = [], isLoading: coursesLoading, isStale: coursesStale, isFetching: coursesFetching, refetch: refetchCourses } = useCourses();
  const { data: categories = [], isLoading: categoriesLoading, isStale: categoriesStale, isFetching: categoriesFetching, refetch: refetchCategories } = useCategories();

  const isStale = coursesStale || categoriesStale;
  const isFetching = coursesFetching || categoriesFetching;
  const handleRefresh = useCallback(() => { refetchCourses(); refetchCategories(); }, [refetchCourses, refetchCategories]);

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebouncedValue(searchQuery, 300);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  

  const fuzzySearchResults = useFuzzySearchWithMatches(
    courses as Course[], ["title", "description", "instructor_name", "categories.name"], debouncedSearch
  );

  const matchesMap = useMemo(() => {
    const map = new Map<string, readonly FuseResultMatch[] | undefined>();
    fuzzySearchResults.forEach((result) => { map.set(result.item.id, result.matches); });
    return map;
  }, [fuzzySearchResults]);

  const filteredCourses = useMemo(() => {
    return fuzzySearchResults
      .filter((result) => {
        const course = result.item;
        if (selectedCategory && course.categories?.slug !== selectedCategory) return false;
        if (selectedLevel && course.level !== selectedLevel) return false;
        return true;
      })
      .map((result) => result.item);
  }, [fuzzySearchResults, selectedCategory, selectedLevel]);

  const handleSignOut = useCallback(async () => { await signOut(); navigate("/"); }, [signOut, navigate]);
  const handleClearAll = useCallback(() => { setSearchQuery(""); setSelectedCategory(null); setSelectedLevel(null); }, []);
  const handleToggleFilters = useCallback(() => setShowFilters((v) => !v), []);
  const loading = coursesLoading || categoriesLoading;

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

  if (!user) return <Navigate to="/auth" replace />;

  const userName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Colaborador";
  const hasActiveFilters = selectedCategory || selectedLevel;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <CatalogHeader userName={userName} onSignOut={handleSignOut} />

      <main id="main-content" className="container mx-auto px-4 py-8">
        <CatalogHero coursesCount={courses.length} categoriesCount={categories.length} />

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <SearchInput value={searchQuery} onChange={setSearchQuery} className="pl-12 h-14 text-base rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm focus:bg-card neon-border" />
            </div>
            <Button variant="outline" onClick={handleToggleFilters} className={`h-14 px-6 rounded-2xl border-border/50 gap-2 neon-border ${hasActiveFilters ? 'bg-primary/10 border-primary/50 text-primary dark:shadow-[0_0_20px_hsl(270_100%_70%/0.3)]' : ''}`}>
              <Filter className="h-5 w-5" /><span>Filtros</span>
              {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-primary animate-pulse dark:shadow-[0_0_10px_hsl(270_100%_70%/0.8)]" />}
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
          </div>

          <div className={`overflow-hidden transition-all duration-300 ${showFilters ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="p-6 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 space-y-5 neon-card">
              <div>
                <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><span>📂</span> Categorias</p>
                <CategoryFilter categories={categories as Category[]} selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
              </div>
              <div className="border-t border-border/50 pt-5">
                <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><span>📊</span> Nível de Dificuldade</p>
                <LevelFilter selectedLevel={selectedLevel} onSelectLevel={setSelectedLevel} />
              </div>
              {hasActiveFilters && (
                <div className="pt-2">
                  <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-muted-foreground hover:text-foreground">Limpar filtros</Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">{filteredCourses.length}</span> {filteredCourses.length === 1 ? "curso encontrado" : "cursos encontrados"}</p>
            <CacheIndicator isStale={isStale} isFetching={isFetching} showLabel onRefresh={handleRefresh} />
          </div>
        </div>

        {/* Course Grid */}
        {loading ? (
          <CourseGridSkeleton count={8} />
        ) : filteredCourses.length > 0 ? (
          filteredCourses.length >= VIRTUALIZATION_THRESHOLD ? (
            <VirtualizedCourseGrid courses={filteredCourses.map(c => ({ ...c, duration_minutes: c.duration_minutes ?? 0, level: c.level ?? 'Iniciante', total_lessons: c.total_lessons ?? 0, is_featured: c.is_featured ?? false }))} columns={4} />
          ) : (
            <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" variants={scaleUpContainerVariants} initial="hidden" animate="visible">
              {filteredCourses.map((course, index) => (
                <motion.div key={course.id} variants={scaleUpItemVariants} custom={index}>
                  <CourseCard id={course.id} slug={course.slug} title={course.title} description={course.description} thumbnailUrl={course.thumbnail_url} durationMinutes={course.duration_minutes ?? 0} level={course.level ?? 'Iniciante'} instructorName={course.instructor_name} totalLessons={course.total_lessons ?? 0} categoryName={course.categories?.name} categoryColor={course.categories?.color || undefined} isFeatured={course.is_featured ?? false} searchMatches={debouncedSearch ? matchesMap.get(course.id) : undefined} />
                </motion.div>
              ))}
            </motion.div>
          )
        ) : (
          <EmptyState type="search" title="Nenhum curso encontrado" description="Tente ajustar os filtros ou buscar por outros termos para encontrar o curso perfeito para você" actionLabel="Limpar busca" onAction={handleClearAll} />
        )}
      </main>
    </div>
  );
};

export default Catalog;

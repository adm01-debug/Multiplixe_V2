import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import CourseCard from "@/components/catalog/CourseCard";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { CourseGridSkeleton } from "@/components/skeletons/PageSkeletons";

interface FavoriteCourse {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  duration_minutes: number;
  level: string;
  instructor_name: string | null;
  total_lessons: number;
  categories?: { name: string; color: string | null } | null;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const FavoritesSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { favorites, isLoading } = useFavorites();
  const [courses, setCourses] = useState<FavoriteCourse[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  const idsKey = favorites.map((favorite) => favorite.course_id).join(",");
  const userId = user?.id;

  useEffect(() => {
    if (!userId || !idsKey) {
      setCourses([]);
      return;
    }

    let cancelled = false;
    const ids = idsKey.split(",");

    const fetchCourses = async () => {
      setLoadingCourses(true);
      const { data, error } = await supabase
        .from("courses")
        .select("*, categories(*)")
        .in("id", ids)
        .eq("is_published", true);

      if (cancelled) return;

      if (error) {
        setCourses([]);
      } else {
        const byId = new Map(((data ?? []) as FavoriteCourse[]).map((course) => [course.id, course]));
        setCourses(ids.map((id) => byId.get(id)).filter((course): course is FavoriteCourse => Boolean(course)));
      }
      setLoadingCourses(false);
    };

    fetchCourses();
    return () => {
      cancelled = true;
    };
  }, [userId, idsKey]);

  const isFetching = isLoading || loadingCourses;
  const favCount = favorites.length;

  return (
    <div>
      <motion.div className="flex items-center justify-between mb-6" variants={itemVariants}>
        <div className="flex items-center gap-4">
          <motion.div
            className="p-3 rounded-2xl bg-gradient-to-br from-rose-500/10 to-pink-500/10 border border-rose-500/20"
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            <Heart className="h-6 w-6 text-rose-500 neon-icon" fill={favCount > 0 ? "currentColor" : "none"} />
          </motion.div>
          <div>
            <h3 className="text-2xl font-display font-bold text-foreground">Meus Favoritos</h3>
            <p className="text-sm text-muted-foreground">
              {favCount === 0
                ? "Salve cursos com o coração para encontrá-los rapidinho aqui"
                : `${favCount} ${favCount === 1 ? "curso salvo" : "cursos salvos"} para assistir depois`}
            </p>
          </div>
        </div>
        {favCount > 0 && (
          <Button variant="ghost" size="sm" asChild className="rounded-xl gap-2 text-primary hover:text-primary hover:bg-primary/10 neon-button">
            <Link to="/catalogo" className="gap-2">
              Ver catálogo<ArrowRight className="h-4 w-4 neon-icon" />
            </Link>
          </Button>
        )}
      </motion.div>

      {isFetching && favCount > 0 ? (
        <CourseGridSkeleton count={Math.min(favCount, 4)} />
      ) : favCount === 0 ? (
        <div className="rounded-2xl border border-border/50 bg-card/50 neon-card">
          <EmptyState type="favorites" actionLabel="Explorar cursos" onAction={() => navigate("/catalogo")} />
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {courses.map((course) => (
            <motion.div key={course.id} variants={itemVariants}>
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
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default FavoritesSection;
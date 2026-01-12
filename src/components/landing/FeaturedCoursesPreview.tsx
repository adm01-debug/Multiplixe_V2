import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Play, 
  Clock, 
  BookOpen, 
  ArrowRight, 
  Sparkles,
  Star,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  duration_minutes: number | null;
  total_lessons: number | null;
  level: string | null;
  instructor_name: string | null;
}

const FeaturedCoursesPreview = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedCourses = async () => {
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('id, title, slug, description, thumbnail_url, duration_minutes, total_lessons, level, instructor_name')
          .eq('is_published', true)
          .eq('is_featured', true)
          .limit(3);

        if (error) throw error;
        
        // If no featured courses, get latest published courses
        if (!data || data.length === 0) {
          const { data: latestCourses } = await supabase
            .from('courses')
            .select('id, title, slug, description, thumbnail_url, duration_minutes, total_lessons, level, instructor_name')
            .eq('is_published', true)
            .order('created_at', { ascending: false })
            .limit(3);
          
          setCourses(latestCourses || []);
        } else {
          setCourses(data);
        }
      } catch (error) {
        // Keep empty on error
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedCourses();
  }, []);

  const getLevelColor = (level: string | null) => {
    switch (level?.toLowerCase()) {
      case 'iniciante':
        return 'bg-success/10 text-success border-success/20';
      case 'intermediário':
      case 'intermediario':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'avançado':
      case 'avancado':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  if (loading) {
    return (
      <section className="py-20 relative overflow-hidden">
        <div className="container-app">
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-3xl bg-card/50 p-6 animate-pulse">
                <div className="aspect-video bg-muted rounded-2xl mb-4" />
                <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (courses.length === 0) return null;

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/50 via-background to-background" />
      
      {/* Decorative */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px]" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[120px]" />

      <div className="container-app relative">
        {/* Section Header */}
        <motion.div 
          className="text-center max-w-3xl mx-auto mb-16 space-y-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 backdrop-blur-sm">
            <Star className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Cursos em Destaque
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground leading-tight">
            Comece a aprender{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary">
              agora mesmo
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Explore nossos cursos mais populares e dê o primeiro passo no seu desenvolvimento.
          </p>
        </motion.div>

        {/* Courses Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {courses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="group"
            >
              <Link to={`/curso/${course.slug}`}>
                <div className="relative bg-card/80 backdrop-blur-sm rounded-3xl border border-border/50 hover:border-primary/30 overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/10">
                  {/* Thumbnail */}
                  <div className="relative aspect-video overflow-hidden">
                    {course.thumbnail_url ? (
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/30 via-accent/20 to-secondary/30 flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-primary/50" />
                      </div>
                    )}
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                    
                    {/* Play button */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <motion.div
                        className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center shadow-2xl"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Play className="w-7 h-7 text-primary-foreground ml-1" fill="currentColor" />
                      </motion.div>
                    </div>

                    {/* Level badge */}
                    {course.level && (
                      <Badge 
                        className={`absolute top-4 left-4 ${getLevelColor(course.level)}`}
                        variant="outline"
                      >
                        {course.level}
                      </Badge>
                    )}

                    {/* Featured badge */}
                    <div className="absolute top-4 right-4">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warning/20 border border-warning/30 backdrop-blur-sm">
                        <Sparkles className="w-3.5 h-3.5 text-warning" />
                        <span className="text-xs font-semibold text-warning">Destaque</span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-card-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                    
                    {course.description && (
                      <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                        {course.description}
                      </p>
                    )}

                    {/* Meta info */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      {course.duration_minutes && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          <span>{course.duration_minutes} min</span>
                        </div>
                      )}
                      {course.total_lessons && (
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="w-4 h-4" />
                          <span>{course.total_lessons} aulas</span>
                        </div>
                      )}
                    </div>

                    {/* Instructor */}
                    {course.instructor_name && (
                      <div className="flex items-center gap-2 pt-4 border-t border-border/50">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                          <Users className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {course.instructor_name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div 
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <Link to="/catalogo">
            <Button size="lg" variant="outline" className="group border-2">
              Ver todos os cursos
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedCoursesPreview;

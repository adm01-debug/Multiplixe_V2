import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useRecommendations } from "@/hooks/useRecommendations";
import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen, Sparkles, ChevronRight, TrendingUp } from "lucide-react";

const RecommendationsWidget = () => {
  const { recommendations, isLoading } = useRecommendations(4);

  if (isLoading) {
    return (
      <div className="p-6 rounded-2xl bg-card/50 border border-border/50 animate-pulse">
        <div className="h-6 w-40 bg-muted rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="p-6 rounded-2xl bg-card/80 border border-border/50 neon-card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
            <Sparkles className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <h3 className="font-display font-bold text-foreground">Para Você</h3>
            <p className="text-sm text-muted-foreground">Recomendações personalizadas</p>
          </div>
        </div>
        <Link 
          to="/catalogo" 
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          Ver todos
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="space-y-3">
        {recommendations.map((course, index) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link
              to={`/curso/${course.slug}`}
              className="group flex gap-4 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 border border-transparent hover:border-border/50 transition-all"
            >
              {/* Thumbnail */}
              <div className="w-20 h-14 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20 flex-shrink-0">
                {course.thumbnail_url ? (
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-primary/50" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                  {course.title}
                </h4>
                <div className="flex items-center gap-3 mt-1">
                  {course.duration_minutes && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {Math.floor(course.duration_minutes / 60)}h
                    </span>
                  )}
                  {course.total_lessons && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {course.total_lessons} aulas
                    </span>
                  )}
                </div>
                <Badge
                  variant="secondary"
                  className="mt-2 text-xs bg-primary/10 text-primary border-0"
                >
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {course.recommendation_reason}
                </Badge>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default RecommendationsWidget;

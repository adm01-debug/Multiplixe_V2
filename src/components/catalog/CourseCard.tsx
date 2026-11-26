import PrefetchLink, { usePrefetchQuery } from "@/components/PrefetchLink";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen, User, Sparkles, Play, TrendingUp } from "lucide-react";
import LazyImage from "@/components/LazyImage";
import { memo, useCallback, useState } from "react";
import { FuzzyHighlight } from "@/components/ui/FuzzyHighlight";
import FavoriteButton from "@/components/favorites/FavoriteButton";
import type { FuseResultMatch } from "fuse.js";

interface CourseCardProps {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  durationMinutes: number;
  level: string;
  instructorName: string | null;
  totalLessons: number;
  categoryName?: string;
  categoryColor?: string;
  progress?: number;
  isFeatured?: boolean;
  searchMatches?: readonly FuseResultMatch[];
}

const levelLabels: Record<string, string> = {
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

const levelConfig: Record<string, { bg: string; text: string; icon: string }> = {
  iniciante: { bg: "bg-emerald-500/15", text: "text-emerald-600 dark:text-emerald-400", icon: "🌱" },
  intermediario: { bg: "bg-amber-500/15", text: "text-amber-600 dark:text-amber-400", icon: "🚀" },
  avancado: { bg: "bg-rose-500/15", text: "text-rose-600 dark:text-rose-400", icon: "⚡" },
};

const CourseCard = memo(({
  id,
  slug,
  title,
  description,
  thumbnailUrl,
  durationMinutes,
  level,
  instructorName,
  totalLessons,
  categoryName,
  categoryColor,
  progress,
  isFeatured,
  searchMatches,
}: CourseCardProps) => {
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  const durationText = hours > 0 
    ? `${hours}h ${minutes > 0 ? `${minutes}min` : ''}`
    : `${minutes}min`;

  const levelStyle = levelConfig[level] || levelConfig.iniciante;
  const { prefetchCourseDetail } = usePrefetchQuery();
  const [isPrefetching, setIsPrefetching] = useState(false);

  const handlePrefetchData = useCallback(() => {
    setIsPrefetching(true);
    prefetchCourseDetail(slug);
    // Clear indicator after a short delay
    setTimeout(() => setIsPrefetching(false), 800);
  }, [slug, prefetchCourseDetail]);

  return (
    <PrefetchLink to={`/curso/${slug}`} className="group block h-full rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" aria-label={`Curso: ${title}`} onPrefetchData={handlePrefetchData}>
      <motion.div 
        className="relative h-full rounded-3xl bg-card border border-border/50 overflow-hidden cursor-pointer will-change-transform"
        whileHover={{ 
          y: -8, 
          scale: 1.02,
          boxShadow: "0 20px 40px -15px hsl(var(--primary) / 0.25), 0 8px 16px -8px rgba(0,0,0,0.15)",
          borderColor: "hsl(var(--primary) / 0.6)"
        }}
        whileTap={{ 
          scale: 0.97,
          y: -4
        }}
        transition={{ 
          type: "spring", 
          stiffness: 400, 
          damping: 25 
        }}
      >
        {/* Prefetch indicator */}
        {isPrefetching && (
          <div className="absolute top-3 right-3 z-20">
            <motion.div
              className="w-2 h-2 rounded-full bg-primary"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0.5, 1, 0.5], 
                scale: [0.8, 1.2, 0.8] 
              }}
              transition={{ 
                duration: 0.6, 
                repeat: Infinity,
                ease: "easeInOut" 
              }}
            />
          </div>
        )}
        {/* Gradient Background */}
        <div className="aspect-[16/10] relative overflow-hidden">
          {/* Thumbnail with lazy loading or gradient fallback */}
          {thumbnailUrl ? (
            <LazyImage
              src={thumbnailUrl}
              alt={title}
              width={640}
              height={400}
              className="absolute inset-0 w-full h-full"
              placeholderClassName="bg-gradient-to-br from-primary/20 via-secondary/15 to-accent/10"
            />
          ) : (
            <>
              {/* Animated Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/15 to-accent/10" />
              
              {/* Mesh Pattern */}
              <div className="absolute inset-0 opacity-30">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <defs>
                    <pattern id={`grid-${slug}`} width="10" height="10" patternUnits="userSpaceOnUse">
                      <circle cx="1" cy="1" r="0.5" fill="currentColor" className="text-primary/20" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill={`url(#grid-${slug})`} />
                </svg>
              </div>
            </>
          )}

          {/* Decorative Elements */}
          <div className="absolute top-4 right-4 w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="absolute bottom-4 left-4 w-16 h-16 rounded-full bg-gradient-to-br from-accent/30 to-primary/20 blur-xl group-hover:scale-150 transition-transform duration-700" />
          
          {/* Featured badge */}
          {isFeatured && (
            <Badge className="absolute top-4 left-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg gap-1.5 font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              Destaque
            </Badge>
          )}
          
          {/* Category badge */}
          {categoryName && (
            <Badge 
              className="absolute top-4 right-4 border-0 shadow-md font-medium backdrop-blur-sm"
              style={{ 
                backgroundColor: categoryColor ? `${categoryColor}25` : 'hsl(var(--muted))', 
                color: categoryColor || 'hsl(var(--muted-foreground))'
              }}
            >
              {categoryName}
            </Badge>
          )}

          {/* Play Button Overlay */}
          <motion.div 
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
          >
            <motion.div 
              className="w-16 h-16 rounded-full bg-card/90 backdrop-blur-sm flex items-center justify-center shadow-xl"
              initial={{ scale: 0.7, opacity: 0 }}
              whileHover={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <Play className="h-6 w-6 text-primary ml-1" />
            </motion.div>
          </motion.div>

          {/* Progress bar overlay */}
          {progress !== undefined && progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0">
              <div className="h-1.5 bg-muted/50 backdrop-blur-sm">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-secondary rounded-r-full progress-animated"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div>
            <h3 className="font-display font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
              <FuzzyHighlight 
                text={title} 
                matches={searchMatches} 
                fieldKey="title" 
              />
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              <FuzzyHighlight 
                text={description || ""} 
                matches={searchMatches} 
                fieldKey="description" 
              />
            </p>
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1.5 rounded-full">
              <Clock className="h-3.5 w-3.5" />
              <span className="font-medium">{durationText}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1.5 rounded-full">
              <BookOpen className="h-3.5 w-3.5" />
              <span className="font-medium">{totalLessons} aulas</span>
            </div>
            <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full ${levelStyle.bg} ${levelStyle.text}`}>
              <span>{levelStyle.icon}</span>
              <span className="font-medium">{levelLabels[level]}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-border/50">
            {/* Instructor */}
            {instructorName && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground font-medium">
                  <FuzzyHighlight 
                    text={instructorName} 
                    matches={searchMatches} 
                    fieldKey="instructor_name" 
                  />
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
                          {/* Progress indicator */}
                          {progress !== undefined && progress > 0 && (
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-primary" />
                              <span className="text-sm font-bold text-primary">{progress}%</span>
                            </div>
                          )}

                          <FavoriteButton courseId={id} size="sm" />
                        </div>
          </div>
        </div>
      </motion.div>
    </PrefetchLink>
  );
});

CourseCard.displayName = "CourseCard";

export default CourseCard;

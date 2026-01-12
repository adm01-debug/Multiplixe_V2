import { memo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen, User, Sparkles, TrendingUp, ChevronRight } from "lucide-react";
import LazyImage from "@/components/LazyImage";
import FavoriteButton from "@/components/favorites/FavoriteButton";

interface CourseListItemProps {
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
}

const levelConfig: Record<string, { bg: string; text: string; icon: string }> = {
  iniciante: { bg: "bg-emerald-500/15", text: "text-emerald-600 dark:text-emerald-400", icon: "🌱" },
  intermediario: { bg: "bg-amber-500/15", text: "text-amber-600 dark:text-amber-400", icon: "🚀" },
  avancado: { bg: "bg-rose-500/15", text: "text-rose-600 dark:text-rose-400", icon: "⚡" },
};

const levelLabels: Record<string, string> = {
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

const CourseListItem = memo(({
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
}: CourseListItemProps) => {
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  const durationText = hours > 0 
    ? `${hours}h ${minutes > 0 ? `${minutes}min` : ''}`
    : `${minutes}min`;

  const levelStyle = levelConfig[level] || levelConfig.iniciante;

  return (
    <motion.div
      whileHover={{ x: 4 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <Link
        to={`/curso/${slug}`}
        className="group flex gap-4 p-4 rounded-2xl bg-card/80 border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all"
      >
        {/* Thumbnail */}
        <div className="relative w-40 h-24 md:w-48 md:h-28 rounded-xl overflow-hidden flex-shrink-0">
          {thumbnailUrl ? (
            <LazyImage
              src={thumbnailUrl}
              alt={title}
              className="w-full h-full"
              placeholderClassName="bg-gradient-to-br from-primary/20 via-secondary/15 to-accent/10"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 via-secondary/15 to-accent/10 flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-primary/50" />
            </div>
          )}
          
          {/* Progress overlay */}
          {progress !== undefined && progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/30">
              <div 
                className="h-full bg-gradient-to-r from-primary to-secondary rounded-r-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Featured badge */}
          {isFeatured && (
            <Badge className="absolute top-2 left-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg gap-1 text-xs">
              <Sparkles className="h-3 w-3" />
              Destaque
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {title}
              </h3>
              <FavoriteButton courseId={id} size="sm" />
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {description}
            </p>
          </div>

          <div className="flex items-center justify-between mt-3">
            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1.5 rounded-full">
                <Clock className="h-3.5 w-3.5" />
                {durationText}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1.5 rounded-full">
                <BookOpen className="h-3.5 w-3.5" />
                {totalLessons} aulas
              </span>
              <span className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full ${levelStyle.bg} ${levelStyle.text}`}>
                {levelStyle.icon} {levelLabels[level]}
              </span>
              {categoryName && (
                <Badge 
                  variant="outline" 
                  className="text-xs"
                  style={{ 
                    borderColor: categoryColor || undefined,
                    color: categoryColor || undefined
                  }}
                >
                  {categoryName}
                </Badge>
              )}
            </div>

            {/* Progress or instructor */}
            <div className="flex items-center gap-3">
              {progress !== undefined && progress > 0 ? (
                <div className="flex items-center gap-2 text-primary">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-bold">{progress}%</span>
                </div>
              ) : instructorName && (
                <div className="hidden md:flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span className="text-sm">{instructorName}</span>
                </div>
              )}
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
});

CourseListItem.displayName = "CourseListItem";

export default CourseListItem;

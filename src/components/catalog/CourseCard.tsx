import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen, User, Sparkles, Play, TrendingUp } from "lucide-react";

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

const CourseCard = ({
  slug,
  title,
  description,
  durationMinutes,
  level,
  instructorName,
  totalLessons,
  categoryName,
  categoryColor,
  progress,
  isFeatured,
}: CourseCardProps) => {
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  const durationText = hours > 0 
    ? `${hours}h ${minutes > 0 ? `${minutes}min` : ''}`
    : `${minutes}min`;

  const levelStyle = levelConfig[level] || levelConfig.iniciante;

  return (
    <Link to={`/curso/${slug}`} className="group block">
      <div className="relative h-full rounded-3xl bg-card border border-border/50 overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-card hover:border-primary/30">
        {/* Gradient Background */}
        <div className="aspect-[16/10] relative overflow-hidden">
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
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="w-16 h-16 rounded-full bg-card/90 backdrop-blur-sm flex items-center justify-center shadow-xl transform scale-75 group-hover:scale-100 transition-transform duration-300">
              <Play className="h-6 w-6 text-primary ml-1" />
            </div>
          </div>

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
              {title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {description}
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
                <span className="text-sm text-muted-foreground font-medium">{instructorName}</span>
              </div>
            )}

            {/* Progress indicator */}
            {progress !== undefined && progress > 0 && (
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold text-primary">{progress}%</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;

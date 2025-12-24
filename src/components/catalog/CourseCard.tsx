import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen, User } from "lucide-react";

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

const levelColors: Record<string, string> = {
  iniciante: "bg-green-500/10 text-green-600",
  intermediario: "bg-yellow-500/10 text-yellow-600",
  avancado: "bg-red-500/10 text-red-600",
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

  return (
    <Link to={`/curso/${slug}`}>
      <Card className="group h-full border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 overflow-hidden">
        {/* Thumbnail */}
        <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
          
          {/* Featured badge */}
          {isFeatured && (
            <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground">
              Destaque
            </Badge>
          )}
          
          {/* Category badge */}
          {categoryName && (
            <Badge 
              className="absolute top-3 right-3"
              style={{ backgroundColor: categoryColor ? `${categoryColor}20` : undefined, color: categoryColor }}
            >
              {categoryName}
            </Badge>
          )}

          {/* Progress bar overlay */}
          {progress !== undefined && progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
              <div 
                className="h-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        <CardHeader className="pb-2">
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {title}
          </h3>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{durationText}</span>
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              <span>{totalLessons} aulas</span>
            </div>
            <Badge variant="secondary" className={levelColors[level]}>
              {levelLabels[level]}
            </Badge>
          </div>

          {/* Instructor */}
          {instructorName && (
            <div className="flex items-center gap-2 pt-2 border-t border-border/50">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-3 w-3 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">{instructorName}</span>
            </div>
          )}

          {/* Progress indicator */}
          {progress !== undefined && progress > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium text-primary">{progress}%</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};

export default CourseCard;

import { Badge } from '@/components/ui/badge';
import { Clock, BookOpen, User, Star, Sparkles } from 'lucide-react';

interface Props {
  title: string;
  description: string | null;
  category: { name: string; color: string | null } | null;
  level: string;
  isFeatured: boolean;
  durationText: string;
  lessonsCount: number;
  instructorName: string | null;
}

const levelConfig: Record<string, { label: string; emoji: string; gradient: string }> = {
  iniciante: { label: "Iniciante", emoji: "🌱", gradient: "from-emerald-500 to-teal-500" },
  intermediario: { label: "Intermediário", emoji: "🚀", gradient: "from-amber-500 to-orange-500" },
  avancado: { label: "Avançado", emoji: "⚡", gradient: "from-rose-500 to-pink-500" },
};

const CourseDetailHero = ({ title, description, category, level, isFeatured, durationText, lessonsCount, instructorName }: Props) => {
  const levelStyle = levelConfig[level] || levelConfig.iniciante;

  return (
    <div className="relative rounded-[2rem] overflow-hidden p-8 md:p-10 neon-card">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-background dark:from-primary/30 dark:via-accent/20" />
      <div className="absolute inset-0 opacity-30 dark:opacity-50" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--primary) / 0.2) 1px, transparent 0)`, backgroundSize: '32px 32px' }} />
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-primary/30 to-accent/30 dark:from-primary/50 dark:to-accent/40 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-gradient-to-br from-accent/25 to-primary/15 dark:from-accent/40 dark:to-primary/30 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4" />
      <div className="absolute top-6 right-6 w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg animate-float dark:shadow-[0_0_25px_hsl(25_100%_55%/0.5)]" aria-hidden="true">
        <Star className="h-6 w-6 text-white" />
      </div>

      <div className="relative z-10">
        <div className="flex flex-wrap items-center gap-2 mb-5">
          {category && (
            <Badge className="rounded-full px-3 py-1 font-medium border-0" style={{ backgroundColor: category.color ? `${category.color}25` : "hsl(var(--muted))", color: category.color || "hsl(var(--muted-foreground))" }}>
              {category.name}
            </Badge>
          )}
          <Badge className={`rounded-full px-3 py-1 font-medium border-0 bg-gradient-to-r ${levelStyle.gradient} text-white`}>
            {levelStyle.emoji} {levelStyle.label}
          </Badge>
          {isFeatured && (
            <Badge className="rounded-full px-3 py-1 font-medium border-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />Destaque
            </Badge>
          )}
        </div>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">{title}</h1>
        <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">{description}</p>
        <div className="flex flex-wrap items-center gap-4 mt-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background/50 backdrop-blur-sm px-3 py-2 rounded-xl">
            <Clock className="h-4 w-4 text-primary" /><span className="font-medium">{durationText}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background/50 backdrop-blur-sm px-3 py-2 rounded-xl">
            <BookOpen className="h-4 w-4 text-primary" /><span className="font-medium">{lessonsCount} aulas</span>
          </div>
          {instructorName && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background/50 backdrop-blur-sm px-3 py-2 rounded-xl">
              <User className="h-4 w-4 text-primary" /><span className="font-medium">{instructorName}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetailHero;

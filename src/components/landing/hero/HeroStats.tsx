import { memo } from "react";
import { BookOpen, TrendingUp, Award } from "lucide-react";

const stats = [
  { icon: BookOpen, value: "50+", label: "Cursos disponíveis", color: "from-primary to-accent" },
  { icon: TrendingUp, value: "12", label: "Trilhas de carreira", color: "from-accent to-warning" },
  { icon: Award, value: "100%", label: "Certificados válidos", color: "from-warning to-primary" },
];

const HeroStats = memo(() => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 pt-12 border-t border-border/50">
      {stats.map((stat, index) => (
        <div 
          key={stat.label}
          className="flex items-center gap-5 p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 group animate-fade-in"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`} aria-hidden="true">
            <stat.icon className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <p className="text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/70">
              {stat.value}
            </p>
            <p className="text-muted-foreground font-medium">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
});

HeroStats.displayName = "HeroStats";

export default HeroStats;

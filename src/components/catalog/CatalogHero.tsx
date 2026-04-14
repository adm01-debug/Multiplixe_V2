import { Sparkles, LayoutGrid, Rocket } from 'lucide-react';

interface CatalogHeroProps {
  coursesCount: number;
  categoriesCount: number;
}

const CatalogHero = ({ coursesCount, categoriesCount }: CatalogHeroProps) => {
  return (
    <div className="relative mb-10 p-8 md:p-12 rounded-[2rem] overflow-hidden neon-card">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-background dark:from-primary/30 dark:via-accent/20" />
      <div className="absolute inset-0 opacity-30 dark:opacity-50" style={{
        backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--primary) / 0.2) 1px, transparent 0)`,
        backgroundSize: '32px 32px'
      }} />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-primary/30 to-accent/20 dark:from-primary/50 dark:to-accent/40 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-br from-accent/20 to-primary/10 dark:from-accent/40 dark:to-primary/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4" />

      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6 dark:bg-primary/10 dark:border-primary/30 dark:shadow-[0_0_20px_hsl(270_100%_70%/0.2)]">
          <Sparkles className="h-4 w-4 text-primary neon-icon" />
          <span className="text-sm font-semibold text-foreground">Catálogo de Cursos</span>
        </div>

        <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
          Explore e <span className="text-gradient neon-text">Evolua</span>
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Descubra cursos incríveis para impulsionar sua carreira e alcançar novos patamares de conhecimento 🚀
        </p>

        <div className="flex flex-wrap gap-6 mt-8">
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 neon-card">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg dark:shadow-[0_0_20px_hsl(270_100%_70%/0.4)]">
              <LayoutGrid className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{coursesCount}</p>
              <p className="text-sm text-muted-foreground">Cursos disponíveis</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 neon-card">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg dark:shadow-[0_0_20px_hsl(25_100%_55%/0.4)]">
              <Rocket className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{categoriesCount}</p>
              <p className="text-sm text-muted-foreground">Categorias</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CatalogHero;

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Crown, Zap, Star, Rocket, ArrowRight } from 'lucide-react';

interface Props {
  userName: string;
}

const DashboardHero = ({ userName }: Props) => (
  <div className="relative mb-12 rounded-[2rem] overflow-hidden neon-card">
    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-background dark:from-primary/30 dark:via-accent/20 dark:to-background" />
    <div className="absolute inset-0 opacity-30 dark:opacity-50" style={{
      backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--primary) / 0.2) 1px, transparent 0)`,
      backgroundSize: '32px 32px'
    }} />
    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-primary/30 to-accent/20 dark:from-primary/50 dark:to-accent/40 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4" />
    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-br from-accent/20 to-warning/10 dark:from-accent/40 dark:to-secondary/30 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4" />
    
    <div className="absolute top-8 right-8 animate-float" aria-hidden="true">
      <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-xl shadow-orange-500/30 rotate-12 dark:shadow-[0_0_30px_hsl(25_100%_55%/0.5)]">
        <Crown className="h-7 w-7 text-white" />
      </div>
    </div>
    <div className="absolute top-24 right-32 animate-float" style={{ animationDelay: '0.5s' }} aria-hidden="true">
      <div className="w-11 h-11 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 -rotate-6 dark:shadow-[0_0_25px_hsl(150_100%_45%/0.5)]">
        <Zap className="h-5 w-5 text-white" />
      </div>
    </div>
    <div className="absolute bottom-12 right-16 animate-float" style={{ animationDelay: '1s' }} aria-hidden="true">
      <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30 rotate-6 dark:shadow-[0_0_25px_hsl(320_100%_65%/0.5)]">
        <Star className="h-5 w-5 text-white" />
      </div>
    </div>

    <div className="relative z-10 p-8 md:p-12 lg:p-16">
      <div className="max-w-3xl">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6 dark:bg-primary/10 dark:border-primary/30 dark:shadow-[0_0_20px_hsl(270_100%_70%/0.2)]">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse dark:shadow-[0_0_10px_hsl(150_100%_45%/0.8)]" />
          <span className="text-sm font-semibold text-foreground">Bem-vindo de volta!</span>
        </div>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-4 leading-tight">
          Olá, <span className="text-gradient neon-text">{userName}</span>!{' '}
          <span className="inline-block animate-bounce ml-2">👋</span>
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-8">
          Continue sua jornada de aprendizado. Cada aula te aproxima mais dos seus objetivos profissionais!
        </p>
        <Button asChild size="lg" className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white rounded-2xl h-14 px-8 text-base font-semibold shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5 group neon-button">
          <Link to="/catalogo">
            <Rocket className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
            Explorar Cursos
            <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </div>
    </div>
  </div>
);

export default DashboardHero;

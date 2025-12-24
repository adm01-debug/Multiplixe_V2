import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Play, 
  ArrowRight, 
  Users, 
  BookOpen, 
  Award, 
  TrendingUp, 
  Sparkles, 
  Zap, 
  Trophy,
  Target,
  Flame
} from "lucide-react";

const HeroSection = () => {
  const stats = [
    { icon: BookOpen, value: "50+", label: "Cursos disponíveis", color: "from-primary to-accent" },
    { icon: TrendingUp, value: "12", label: "Trilhas de carreira", color: "from-accent to-warning" },
    { icon: Award, value: "100%", label: "Certificados válidos", color: "from-warning to-primary" },
  ];

  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-secondary/5 rounded-full blur-[150px]" />
      </div>

      {/* Floating Elements */}
      <div className="absolute top-32 left-10 animate-float opacity-60">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 backdrop-blur-sm border border-primary/20 flex items-center justify-center">
          <Zap className="w-8 h-8 text-primary" />
        </div>
      </div>
      <div className="absolute top-48 right-20 animate-float opacity-60" style={{ animationDelay: "0.5s" }}>
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 backdrop-blur-sm border border-accent/20 flex items-center justify-center">
          <Trophy className="w-7 h-7 text-accent" />
        </div>
      </div>
      <div className="absolute bottom-32 left-20 animate-float opacity-60" style={{ animationDelay: "1s" }}>
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-warning/20 to-warning/5 backdrop-blur-sm border border-warning/20 flex items-center justify-center">
          <Target className="w-6 h-6 text-warning" />
        </div>
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 -z-10 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      <div className="container-app py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content */}
          <div className="space-y-8 animate-slide-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 backdrop-blur-sm">
              <Flame className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-sm font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Exclusivo para colaboradores Promo Brindes
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-foreground leading-[1.1] tracking-tight">
              Invista no seu{" "}
              <span className="relative">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-gradient">
                  crescimento
                </span>
                <Sparkles className="absolute -top-2 -right-6 w-6 h-6 text-accent animate-pulse" />
              </span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-warning">
                profissional
              </span>
            </h1>

            {/* Description */}
            <p className="text-xl md:text-2xl text-muted-foreground max-w-xl leading-relaxed">
              A Promo Brindes acredita no seu potencial. Acesse cursos exclusivos, 
              desenvolva novas habilidades e construa a carreira que você sempre quis.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link to="/auth">
                <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground text-lg px-8 h-16 font-semibold shadow-2xl shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 hover:-translate-y-1 group">
                  <Sparkles className="mr-2 w-5 h-5 group-hover:rotate-12 transition-transform" />
                  Acessar Minha Conta
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 h-16 group border-2 border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
              >
                <Play className="mr-2 w-5 h-5 group-hover:scale-125 transition-transform text-primary" fill="currentColor" />
                Conhecer a Plataforma
              </Button>
            </div>

            {/* Internal message */}
            <div className="pt-4 flex items-center gap-4 p-4 rounded-2xl bg-muted/50 border border-border/50 backdrop-blur-sm">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Acesso 100% gratuito</p>
                <p className="text-sm text-muted-foreground">Todos os colaboradores têm acesso completo</p>
              </div>
            </div>
          </div>

          {/* Right Content - Hero Image/Card */}
          <div className="relative animate-scale-in">
            {/* Glow Effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-[2rem] blur-2xl opacity-50" />
            
            {/* Main Card */}
            <div className="relative bg-card/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-border/50 overflow-hidden">
              {/* Video Preview */}
              <div className="aspect-video bg-gradient-to-br from-primary/30 via-accent/20 to-secondary/30 flex items-center justify-center relative">
                {/* Mesh Pattern */}
                <div className="absolute inset-0 opacity-30" style={{
                  backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--primary) / 0.3) 1px, transparent 0)`,
                  backgroundSize: '24px 24px'
                }} />
                
                <button className="relative w-24 h-24 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground flex items-center justify-center shadow-2xl shadow-primary/40 hover:scale-110 transition-all duration-300 group">
                  <div className="absolute inset-0 rounded-full bg-primary/50 animate-ping" />
                  <Play className="w-10 h-10 ml-1 group-hover:scale-110 transition-transform" fill="currentColor" />
                </button>

                {/* Course Badge */}
                <div className="absolute top-4 left-4 px-4 py-2 rounded-xl bg-background/90 backdrop-blur-sm border border-border/50 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">Em alta</span>
                </div>
              </div>

              {/* Course Info Preview */}
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <BookOpen className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-card-foreground">
                      Atendimento de Excelência
                    </h4>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium">Trilha obrigatória</span>
                      <span>8 módulos</span>
                    </p>
                  </div>
                </div>
                
                {/* Progress */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground font-medium">Seu progresso</span>
                    <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">65%</span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-1000 ease-out"
                      style={{ width: "65%" }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Card - XP */}
            <div className="absolute -bottom-6 -left-6 bg-card/90 backdrop-blur-xl rounded-2xl shadow-xl border border-border/50 p-4 animate-float">
              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-accent to-warning text-accent-foreground font-bold text-sm">
                  +150 XP
                </div>
                <div className="text-sm">
                  <p className="font-bold text-card-foreground">Parabéns!</p>
                  <p className="text-muted-foreground text-xs">Curso concluído</p>
                </div>
              </div>
            </div>

            {/* Floating Card - Certificate */}
            <div className="absolute -top-4 -right-4 bg-card/90 backdrop-blur-xl rounded-2xl shadow-xl border border-border/50 p-4 animate-float" style={{ animationDelay: "0.5s" }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-warning/20 to-accent/20 flex items-center justify-center">
                  <Award className="w-6 h-6 text-warning" />
                </div>
                <div className="text-sm">
                  <p className="font-bold text-card-foreground">Certificado</p>
                  <p className="text-muted-foreground text-xs">Disponível</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 pt-12 border-t border-border/50">
          {stats.map((stat, index) => (
            <div 
              key={stat.label}
              className="flex items-center gap-5 p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 group animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-8 h-8 text-white" />
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
      </div>

      {/* CSS for gradient animation */}
      <style>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </section>
  );
};

export default HeroSection;

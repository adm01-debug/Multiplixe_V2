import { 
  PlayCircle, 
  Trophy, 
  BarChart3, 
  Target,
  Smartphone, 
  Award,
  Clock,
  Sparkles,
  Zap,
  ArrowRight
} from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: PlayCircle,
      title: "Cursos em Vídeo",
      description: "Assista no seu ritmo, pause quando quiser e continue de onde parou.",
      gradient: "from-primary to-accent",
    },
    {
      icon: Target,
      title: "Trilhas por Área",
      description: "Conteúdos organizados por departamento e função para seu desenvolvimento.",
      gradient: "from-accent to-warning",
    },
    {
      icon: Trophy,
      title: "Gamificação",
      description: "Ganhe XP, conquiste badges e suba no ranking dos colaboradores.",
      gradient: "from-warning to-primary",
    },
    {
      icon: BarChart3,
      title: "Acompanhe seu Progresso",
      description: "Dashboard pessoal para visualizar sua evolução e conquistas.",
      gradient: "from-info to-primary",
    },
    {
      icon: Clock,
      title: "Aprenda no seu Tempo",
      description: "Acesse 24h por dia, de qualquer lugar, no horário que preferir.",
      gradient: "from-primary to-info",
    },
    {
      icon: Smartphone,
      title: "Acesso pelo Celular",
      description: "Plataforma 100% responsiva, funciona perfeitamente no mobile.",
      gradient: "from-accent to-primary",
    },
    {
      icon: Award,
      title: "Certificados",
      description: "Receba certificados ao concluir cursos para seu currículo.",
      gradient: "from-warning to-accent",
    },
    {
      icon: Sparkles,
      title: "Conteúdo Exclusivo",
      description: "Cursos desenvolvidos especialmente para a realidade da Promo Brindes.",
      gradient: "from-primary to-warning",
    },
  ];

  return (
    <section id="recursos" className="py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />
      
      {/* Decorative Elements */}
      <div className="absolute top-20 left-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-20 right-0 w-96 h-96 bg-accent/5 rounded-full blur-[120px]" />

      <div className="container-app relative">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-6">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 backdrop-blur-sm">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Recursos Poderosos
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground leading-tight">
            Tudo para o seu{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary">
              desenvolvimento
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A MULTIPLIXE oferece recursos completos para você evoluir 
            profissionalmente dentro da Promo Brindes.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative bg-card/50 backdrop-blur-sm rounded-3xl p-7 border border-border/50 hover:border-primary/30 transition-all duration-500 hover:-translate-y-2 animate-fade-in overflow-hidden"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Hover Glow */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
              
              {/* Icon */}
              <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                <feature.icon className="w-8 h-8 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-display font-bold text-card-foreground mb-3 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {feature.description}
              </p>

              {/* Arrow indicator */}
              <div className="flex items-center gap-2 text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-[-10px] group-hover:translate-x-0">
                <span className="text-sm font-semibold">Saiba mais</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;

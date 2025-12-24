import { 
  PlayCircle, 
  Trophy, 
  BarChart3, 
  Target,
  Smartphone, 
  Award,
  Clock,
  Sparkles
} from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: PlayCircle,
      title: "Cursos em Vídeo",
      description: "Assista no seu ritmo, pause quando quiser e continue de onde parou.",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Target,
      title: "Trilhas por Área",
      description: "Conteúdos organizados por departamento e função para seu desenvolvimento.",
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      icon: Trophy,
      title: "Gamificação",
      description: "Ganhe XP, conquiste badges e suba no ranking dos colaboradores.",
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      icon: BarChart3,
      title: "Acompanhe seu Progresso",
      description: "Dashboard pessoal para visualizar sua evolução e conquistas.",
      color: "text-info",
      bgColor: "bg-info/10",
    },
    {
      icon: Clock,
      title: "Aprenda no seu Tempo",
      description: "Acesse 24h por dia, de qualquer lugar, no horário que preferir.",
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      icon: Smartphone,
      title: "Acesso pelo Celular",
      description: "Plataforma 100% responsiva, funciona perfeitamente no mobile.",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Award,
      title: "Certificados",
      description: "Receba certificados ao concluir cursos para seu currículo.",
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      icon: Sparkles,
      title: "Conteúdo Exclusivo",
      description: "Cursos desenvolvidos especialmente para a realidade da Promo Brindes.",
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
  ];

  return (
    <section id="recursos" className="py-24 bg-surface">
      <div className="container-app">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm">
            Recursos
          </span>
          <h2 className="text-foreground">
            Tudo para o seu{" "}
            <span className="text-gradient">desenvolvimento</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            A MULTIPLIXE oferece recursos completos para você evoluir 
            profissionalmente dentro da Promo Brindes.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group bg-card rounded-2xl p-6 border border-border card-hover animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className={`w-14 h-14 rounded-xl ${feature.bgColor} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                <feature.icon className={`w-7 h-7 ${feature.color}`} />
              </div>
              <h3 className="text-xl font-display font-semibold text-card-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
import { 
  PlayCircle, 
  Trophy, 
  BarChart3, 
  Users, 
  Smartphone, 
  Shield,
  Zap,
  Target
} from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: PlayCircle,
      title: "Player Avançado",
      description: "Assista em qualquer velocidade, com legendas e salve seu progresso automaticamente.",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Target,
      title: "Trilhas Personalizadas",
      description: "Crie jornadas de aprendizado sob medida para cada cargo e departamento.",
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      icon: Trophy,
      title: "Gamificação",
      description: "Engaje sua equipe com pontos XP, badges, rankings e desafios semanais.",
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      icon: BarChart3,
      title: "Analytics Completo",
      description: "Dashboards detalhados para acompanhar o desenvolvimento de cada colaborador.",
      color: "text-info",
      bgColor: "bg-info/10",
    },
    {
      icon: Users,
      title: "Gestão de Equipes",
      description: "Gerencie licenças, atribua cursos e monitore o progresso em tempo real.",
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      icon: Smartphone,
      title: "100% Responsivo",
      description: "Acesse de qualquer dispositivo: desktop, tablet ou smartphone.",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Shield,
      title: "Certificados Válidos",
      description: "Emita certificados digitais com código de validação para cada conclusão.",
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      icon: Zap,
      title: "Masterclasses ao Vivo",
      description: "Realize eventos ao vivo com especialistas do mercado.",
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
            Tudo que você precisa para{" "}
            <span className="text-gradient">capacitar sua equipe</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Uma plataforma completa com recursos avançados para transformar 
            o desenvolvimento profissional da sua empresa.
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
import { Button } from "@/components/ui/button";
import { Play, ArrowRight, Users, BookOpen, Award } from "lucide-react";

const HeroSection = () => {
  const stats = [
    { icon: Users, value: "50.000+", label: "Colaboradores treinados" },
    { icon: BookOpen, value: "500+", label: "Cursos disponíveis" },
    { icon: Award, value: "98%", label: "Taxa de satisfação" },
  ];

  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background gradient */}
      <div 
        className="absolute inset-0 -z-10"
        style={{ background: "var(--gradient-hero)" }}
      />
      
      {/* Decorative circles */}
      <div className="absolute top-20 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-20 left-0 w-72 h-72 bg-secondary/10 rounded-full blur-3xl -z-10" />

      <div className="container-app py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-8 animate-slide-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Plataforma #1 em Treinamento Corporativo
            </div>

            {/* Heading */}
            <h1 className="text-foreground leading-tight">
              Transforme sua equipe com{" "}
              <span className="text-gradient">aprendizado contínuo</span>
            </h1>

            {/* Description */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
              Capacite seus colaboradores com cursos de alta qualidade, trilhas 
              personalizadas e certificações reconhecidas. Tudo em uma única plataforma.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="btn-gradient text-lg px-8 h-14">
                Começar Gratuitamente
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 h-14 group"
              >
                <Play className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                Ver Demonstração
              </Button>
            </div>

            {/* Trust badges */}
            <div className="pt-4">
              <p className="text-sm text-muted-foreground mb-4">
                Empresas que confiam em nós:
              </p>
              <div className="flex flex-wrap gap-8 items-center opacity-60">
                {["Empresa A", "Empresa B", "Empresa C", "Empresa D"].map((company) => (
                  <div 
                    key={company}
                    className="font-display font-bold text-lg text-muted-foreground"
                  >
                    {company}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Content - Hero Image/Card */}
          <div className="relative animate-scale-in">
            {/* Main Card */}
            <div className="relative bg-card rounded-2xl shadow-xl border border-border overflow-hidden">
              {/* Video Preview */}
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center relative">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
                <button className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-glow hover:scale-110 transition-transform">
                  <Play className="w-8 h-8 ml-1" fill="currentColor" />
                </button>
              </div>

              {/* Course Info Preview */}
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-card-foreground">
                      Inteligência Emocional 2.0
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Prof. Dr. João Silva
                    </p>
                  </div>
                </div>
                
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Seu progresso</span>
                    <span className="font-medium text-primary">65%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-primary progress-animated"
                      style={{ width: "65%" }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Card - XP */}
            <div className="absolute -bottom-6 -left-6 bg-card rounded-xl shadow-lg border border-border p-4 animate-bounce">
              <div className="flex items-center gap-3">
                <div className="badge-xp">+150 XP</div>
                <div className="text-sm">
                  <p className="font-medium text-card-foreground">Parabéns!</p>
                  <p className="text-muted-foreground">Curso concluído</p>
                </div>
              </div>
            </div>

            {/* Floating Card - Certificate */}
            <div className="absolute -top-4 -right-4 bg-card rounded-xl shadow-lg border border-border p-4">
              <div className="flex items-center gap-3">
                <Award className="w-8 h-8 text-accent" />
                <div className="text-sm">
                  <p className="font-medium text-card-foreground">Certificado</p>
                  <p className="text-muted-foreground">Disponível</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 pt-12 border-t border-border">
          {stats.map((stat, index) => (
            <div 
              key={stat.label}
              className="flex items-center gap-4 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <stat.icon className="w-7 h-7 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-display font-bold text-foreground">
                  {stat.value}
                </p>
                <p className="text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
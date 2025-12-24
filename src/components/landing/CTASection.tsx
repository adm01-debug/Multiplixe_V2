import { Button } from "@/components/ui/button";
import { ArrowRight, Rocket, Heart, TrendingUp } from "lucide-react";

const CTASection = () => {
  const benefits = [
    { icon: Heart, text: "Investimento da empresa no seu futuro" },
    { icon: TrendingUp, text: "Oportunidade de crescimento interno" },
    { icon: Rocket, text: "Desenvolvimento contínuo" },
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 -z-10"
        style={{ background: "var(--gradient-primary)" }}
      />
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />

      <div className="container-app relative">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Heading */}
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white leading-tight">
            Sua evolução começa agora!
          </h2>

          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            A Promo Brindes acredita em você. Aproveite esta oportunidade 
            para desenvolver novas habilidades e crescer na sua carreira.
          </p>

          {/* Benefits */}
          <div className="flex flex-wrap justify-center gap-8 py-6">
            {benefits.map((benefit) => (
              <div 
                key={benefit.text}
                className="flex items-center gap-3 text-white/90"
              >
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <benefit.icon className="w-5 h-5 text-white" />
                </div>
                <span>{benefit.text}</span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <div className="pt-4">
            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-white/90 text-lg px-10 h-16 font-semibold"
            >
              Acessar Plataforma
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>

          {/* Note */}
          <p className="text-white/60 text-sm pt-4">
            Acesso exclusivo para colaboradores com email @promobrindes.com.br
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
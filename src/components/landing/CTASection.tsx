import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Rocket, Heart, TrendingUp, Sparkles, Zap, Star } from "lucide-react";

const CTASection = () => {
  const benefits = [
    { icon: Heart, text: "Investimento da empresa no seu futuro" },
    { icon: TrendingUp, text: "Oportunidade de crescimento interno" },
    { icon: Rocket, text: "Desenvolvimento contínuo" },
  ];

  return (
    <section className="py-32 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-accent" />
      
      {/* Mesh Pattern */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
        backgroundSize: '32px 32px'
      }} />
      
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-[150px]" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-accent/30 rounded-full blur-[150px]" />
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-20 animate-float opacity-40">
        <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
          <Star className="w-8 h-8 text-white" />
        </div>
      </div>
      <div className="absolute bottom-20 right-20 animate-float opacity-40" style={{ animationDelay: "0.5s" }}>
        <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
          <Zap className="w-7 h-7 text-white" />
        </div>
      </div>
      <div className="absolute top-1/2 right-10 animate-float opacity-40" style={{ animationDelay: "1s" }}>
        <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
      </div>

      <div className="container-app relative">
        <div className="max-w-4xl mx-auto text-center space-y-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
            <Rocket className="w-4 h-4 text-white" />
            <span className="text-sm font-semibold text-white">
              Transforme sua carreira hoje
            </span>
          </div>

          {/* Heading */}
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-white leading-[1.1]">
            Sua evolução{" "}
            <span className="relative">
              começa agora!
              <Sparkles className="absolute -top-3 -right-8 w-8 h-8 text-warning animate-pulse" />
            </span>
          </h2>

          <p className="text-xl md:text-2xl text-white/80 max-w-2xl mx-auto leading-relaxed">
            A Promo Brindes acredita em você. Aproveite esta oportunidade 
            para desenvolver novas habilidades e crescer na sua carreira.
          </p>

          {/* Benefits */}
          <div className="flex flex-wrap justify-center gap-6 py-8">
            {benefits.map((benefit) => (
              <div 
                key={benefit.text}
                className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <benefit.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-white font-medium">{benefit.text}</span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <div className="pt-6">
            <Link to="/auth">
              <Button 
                size="lg" 
                className="bg-white text-primary hover:bg-white/90 text-xl px-12 h-18 font-bold shadow-2xl shadow-black/20 hover:shadow-3xl transition-all duration-300 hover:-translate-y-1 group"
              >
                <Sparkles className="mr-3 w-6 h-6 group-hover:rotate-12 transition-transform" />
                Acessar Plataforma
                <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          {/* Note */}
          <p className="text-white/50 text-sm pt-4 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white/30" />
            Acesso exclusivo para colaboradores com email @promobrindes.com.br
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;

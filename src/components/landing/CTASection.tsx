import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const CTASection = () => {
  const benefits = [
    "14 dias grátis para testar",
    "Sem necessidade de cartão de crédito",
    "Suporte dedicado desde o início",
    "Cancelamento a qualquer momento",
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
            Pronto para transformar o desenvolvimento da sua equipe?
          </h2>

          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Junte-se a mais de 500 empresas que já estão capacitando seus 
            colaboradores com a CorpLearn.
          </p>

          {/* Benefits */}
          <div className="flex flex-wrap justify-center gap-6 py-4">
            {benefits.map((benefit) => (
              <div 
                key={benefit}
                className="flex items-center gap-2 text-white/90"
              >
                <CheckCircle2 className="w-5 h-5 text-white" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-white/90 text-lg px-8 h-14 font-semibold"
            >
              Começar Gratuitamente
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 text-lg px-8 h-14"
            >
              Falar com Vendas
            </Button>
          </div>

          {/* Social proof */}
          <p className="text-white/60 text-sm pt-4">
            ⭐ Avaliado com 4.9/5 por mais de 2.000 gestores de RH
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
import { Sparkles, Users, Flame } from "lucide-react";
import { motion } from "framer-motion";
import TestimonialCarousel from "./TestimonialCarousel";

const TestimonialsSection = () => {
  const steps = [
    {
      step: "1",
      title: "Faça Login",
      description: "Use seu email corporativo @promobrindes para acessar a plataforma.",
      gradient: "from-primary to-accent",
    },
    {
      step: "2",
      title: "Escolha sua Trilha",
      description: "Selecione os cursos da sua área ou explore conteúdos de seu interesse.",
      gradient: "from-accent to-warning",
    },
    {
      step: "3",
      title: "Aprenda e Evolua",
      description: "Complete os cursos, ganhe XP, conquiste certificados e cresça na carreira!",
      gradient: "from-warning to-primary",
    },
  ];

  return (
    <section id="como-funciona" className="py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-background to-muted/30" />
      
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-l from-primary/5 to-transparent rounded-full blur-[150px]" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-r from-accent/5 to-transparent rounded-full blur-[100px]" />
      
      <div className="container-app relative">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-6">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-accent/10 to-warning/10 border border-accent/20 backdrop-blur-sm">
            <Users className="w-4 h-4 text-accent" />
            <span className="text-sm font-semibold bg-gradient-to-r from-accent to-warning bg-clip-text text-transparent">
              Histórias de Sucesso
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground leading-tight">
            O que nossos colegas{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-warning to-accent">
              estão dizendo
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Veja como a MULTIPLIXE está transformando o desenvolvimento dos colaboradores.
          </p>
        </div>

        {/* Testimonials Carousel */}
        <motion.div 
          className="mb-24"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <TestimonialCarousel />
        </motion.div>

        {/* How it works */}
        <motion.div 
          className="relative"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          {/* Background Glow */}
          <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-[3rem] blur-2xl opacity-50" />
          
          <div className="relative bg-card/80 backdrop-blur-xl rounded-[2rem] border border-border/50 p-10 md:p-16 overflow-hidden">
            {/* Decorative */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-3xl" />
            
            <div className="text-center mb-16">
              <motion.div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 mb-6"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <Flame className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary">Comece Agora</span>
              </motion.div>
              <h3 className="text-3xl md:text-4xl font-display font-bold text-card-foreground">
                Como começar a aprender
              </h3>
            </div>

            <div className="grid md:grid-cols-3 gap-10">
              {steps.map((item, index) => (
                <motion.div 
                  key={item.step} 
                  className="relative text-center group"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 * index, duration: 0.5 }}
                >
                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-10 left-1/2 w-full h-0.5 bg-gradient-to-r from-border to-border/0" />
                  )}
                  
                  <motion.div 
                    className={`relative w-20 h-20 rounded-3xl bg-gradient-to-br ${item.gradient} text-white font-display font-bold text-3xl flex items-center justify-center mx-auto mb-6 shadow-xl`}
                    whileHover={{ scale: 1.1, rotate: 3 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {item.step}
                    <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-warning animate-pulse" />
                  </motion.div>
                  <h4 className="text-xl font-bold text-card-foreground mb-3 group-hover:text-primary transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;

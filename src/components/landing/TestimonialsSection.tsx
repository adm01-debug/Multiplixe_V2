import { Star, Quote } from "lucide-react";

const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "Maria Santos",
      role: "Diretora de RH",
      company: "TechCorp Brasil",
      avatar: "MS",
      rating: 5,
      text: "A CorpLearn transformou completamente nosso programa de treinamento. O engajamento dos colaboradores aumentou 300% e conseguimos reduzir custos com treinamentos presenciais.",
    },
    {
      name: "Carlos Oliveira",
      role: "CEO",
      company: "StartUp Innovation",
      avatar: "CO",
      rating: 5,
      text: "Plataforma intuitiva e completa. A gamificação fez toda a diferença para manter nossa equipe motivada. Os relatórios de analytics são muito úteis para tomada de decisões.",
    },
    {
      name: "Ana Paula Ferreira",
      role: "Gerente de T&D",
      company: "Grupo Empresarial ABC",
      avatar: "AF",
      rating: 5,
      text: "O suporte é excepcional e a plataforma está sempre evoluindo. As trilhas personalizadas nos ajudaram a desenvolver competências específicas para cada área.",
    },
  ];

  const stats = [
    { value: "4.9/5", label: "Avaliação média" },
    { value: "+500", label: "Empresas parceiras" },
    { value: "98%", label: "Taxa de renovação" },
  ];

  return (
    <section id="depoimentos" className="py-24 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent -z-10" />
      
      <div className="container-app">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="inline-block px-4 py-2 rounded-full bg-accent/10 text-accent font-medium text-sm">
            Depoimentos
          </span>
          <h2 className="text-foreground">
            O que nossos clientes{" "}
            <span className="text-gradient">dizem sobre nós</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Mais de 500 empresas confiam na MULTIPLIXE para capacitar suas equipes.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.name}
              className="bg-card rounded-2xl p-8 border border-border card-hover relative animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Quote Icon */}
              <Quote className="absolute top-6 right-6 w-10 h-10 text-primary/10" />
              
              {/* Rating */}
              <div className="flex gap-1 mb-6">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-warning fill-warning" />
                ))}
              </div>

              {/* Text */}
              <p className="text-card-foreground leading-relaxed mb-8">
                "{testimonial.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-semibold text-card-foreground">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role} • {testimonial.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-4xl font-display font-bold text-primary mb-2">
                {stat.value}
              </p>
              <p className="text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
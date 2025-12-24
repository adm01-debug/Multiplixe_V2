import { Star, Quote } from "lucide-react";

const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "Ana Paula",
      role: "Vendas",
      department: "Comercial",
      avatar: "AP",
      rating: 5,
      text: "A plataforma me ajudou muito a entender melhor nossos produtos. Os cursos são práticos e consigo aplicar o que aprendo no mesmo dia!",
    },
    {
      name: "Carlos Eduardo",
      role: "Atendimento",
      department: "SAC",
      avatar: "CE",
      rating: 5,
      text: "Adoro o sistema de gamificação! Me motiva a completar os cursos e competir com os colegas. Já conquistei 5 badges!",
    },
    {
      name: "Juliana Mendes",
      role: "Coordenadora",
      department: "Logística",
      avatar: "JM",
      rating: 5,
      text: "Os certificados são um diferencial para o meu currículo. A empresa investir no nosso desenvolvimento mostra que valoriza a gente.",
    },
  ];

  return (
    <section id="como-funciona" className="py-24 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent -z-10" />
      
      <div className="container-app">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="inline-block px-4 py-2 rounded-full bg-accent/10 text-accent font-medium text-sm">
            Depoimentos
          </span>
          <h2 className="text-foreground">
            O que nossos colegas{" "}
            <span className="text-gradient">estão dizendo</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Veja como a MULTIPLIXE está transformando o desenvolvimento dos colaboradores.
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
                    {testimonial.role} • {testimonial.department}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="bg-card rounded-2xl border border-border p-8 md:p-12">
          <h3 className="text-2xl font-display font-bold text-card-foreground text-center mb-12">
            Como começar a aprender
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Faça Login",
                description: "Use seu email corporativo @promobrindes para acessar a plataforma.",
              },
              {
                step: "2",
                title: "Escolha sua Trilha",
                description: "Selecione os cursos da sua área ou explore conteúdos de seu interesse.",
              },
              {
                step: "3",
                title: "Aprenda e Evolua",
                description: "Complete os cursos, ganhe XP, conquiste certificados e cresça na carreira!",
              },
            ].map((item, index) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground font-display font-bold text-2xl flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h4 className="text-xl font-semibold text-card-foreground mb-2">
                  {item.title}
                </h4>
                <p className="text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Quote, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Testimonial {
  name: string;
  role: string;
  department: string;
  avatar: string;
  rating: number;
  text: string;
  gradient: string;
  metric: string;
}

const testimonials: Testimonial[] = [
  {
    name: "Ana Paula",
    role: "Vendas",
    department: "Comercial",
    avatar: "AP",
    rating: 5,
    text: "A plataforma me ajudou muito a entender melhor nossos produtos. Os cursos são práticos e consigo aplicar o que aprendo no mesmo dia!",
    gradient: "from-primary to-accent",
    metric: "+35% em vendas",
  },
  {
    name: "Carlos Eduardo",
    role: "Atendimento",
    department: "SAC",
    avatar: "CE",
    rating: 5,
    text: "Adoro o sistema de gamificação! Me motiva a completar os cursos e competir com os colegas. Já conquistei 5 badges!",
    gradient: "from-accent to-warning",
    metric: "20 cursos concluídos",
  },
  {
    name: "Juliana Mendes",
    role: "Coordenadora",
    department: "Logística",
    avatar: "JM",
    rating: 5,
    text: "Os certificados são um diferencial para o meu currículo. A empresa investir no nosso desenvolvimento mostra que valoriza a gente.",
    gradient: "from-warning to-primary",
    metric: "Promovida em 6 meses",
  },
  {
    name: "Roberto Silva",
    role: "Analista",
    department: "TI",
    avatar: "RS",
    rating: 5,
    text: "A qualidade dos cursos é excelente! Consegui me atualizar em várias tecnologias que uso no dia a dia.",
    gradient: "from-primary to-secondary",
    metric: "+45% produtividade",
  },
  {
    name: "Fernanda Costa",
    role: "Designer",
    department: "Marketing",
    avatar: "FC",
    rating: 5,
    text: "Interface incrível e cursos super didáticos. A trilha de UX Design me ajudou muito a evoluir profissionalmente!",
    gradient: "from-secondary to-accent",
    metric: "3 certificações",
  },
  {
    name: "Marcos Oliveira",
    role: "Supervisor",
    department: "Produção",
    avatar: "MO",
    rating: 5,
    text: "Depois dos cursos de liderança, minha equipe melhorou muito a performance. Recomendo demais!",
    gradient: "from-accent to-primary",
    metric: "+28% eficiência equipe",
  },
  {
    name: "Patricia Santos",
    role: "Analista",
    department: "Financeiro",
    avatar: "PS",
    rating: 5,
    text: "Os cursos de Excel avançado e BI transformaram minha forma de trabalhar. Economizo horas toda semana!",
    gradient: "from-warning to-accent",
    metric: "8h/semana economizadas",
  },
  {
    name: "Lucas Pereira",
    role: "Vendedor",
    department: "Comercial",
    avatar: "LP",
    rating: 5,
    text: "Comecei como trainee e hoje sou referência em produtos. A plataforma foi fundamental nessa evolução!",
    gradient: "from-primary to-warning",
    metric: "Top 3 do ranking",
  },
];

const TestimonialCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [direction, setDirection] = useState(1);

  const next = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  }, []);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, []);

  const goTo = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(next, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, next]);

  const testimonial = testimonials[currentIndex];

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -300 : 300,
      opacity: 0,
      scale: 0.95,
    }),
  };

  return (
    <div className="relative">
      {/* Main Carousel */}
      <div className="relative overflow-hidden rounded-3xl bg-card/50 backdrop-blur-sm border border-border/50 p-8 md:p-12 min-h-[320px]">
        {/* Quote Icon Background */}
        <Quote className="absolute top-6 right-6 w-24 h-24 text-primary/5" />

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
              scale: { duration: 0.2 },
            }}
            className="relative z-10"
          >
            {/* Rating */}
            <motion.div 
              className="flex gap-1 mb-6"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {[...Array(testimonial.rating)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                >
                  <Star className="w-5 h-5 text-warning fill-warning" />
                </motion.div>
              ))}
            </motion.div>

            {/* Text */}
            <motion.p 
              className="text-xl md:text-2xl text-card-foreground leading-relaxed mb-8 font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              "{testimonial.text}"
            </motion.p>

            {/* Author */}
            <motion.div 
              className="flex items-center justify-between flex-wrap gap-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-bold text-card-foreground text-lg">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role} • {testimonial.department}
                  </p>
                </div>
              </div>
              
              {/* Metric Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, type: "spring" }}
                className={`px-4 py-2 rounded-full bg-gradient-to-r ${testimonial.gradient} text-white font-bold text-sm shadow-lg`}
              >
                {testimonial.metric}
              </motion.div>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        <div className="absolute top-1/2 -translate-y-1/2 left-4 right-4 flex justify-between pointer-events-none">
          <Button
            variant="ghost"
            size="icon"
            onClick={prev}
            className="pointer-events-auto h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-background shadow-lg"
            aria-label="Depoimento anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={next}
            className="pointer-events-auto h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-background shadow-lg"
            aria-label="Próximo depoimento"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Dots Navigation & Auto-play Control */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <div className="flex items-center gap-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => goTo(index)}
              aria-label={`Ir para depoimento ${index + 1}`}
              className={`transition-all duration-300 rounded-full ${
                index === currentIndex
                  ? "w-8 h-2 bg-primary"
                  : "w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
            />
          ))}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsAutoPlaying(!isAutoPlaying)}
          className="h-8 w-8 rounded-full"
          aria-label={isAutoPlaying ? "Pausar reprodução automática" : "Iniciar reprodução automática"}
        >
          {isAutoPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default TestimonialCarousel;

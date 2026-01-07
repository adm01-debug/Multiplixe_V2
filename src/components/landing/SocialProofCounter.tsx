import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Users, BookOpen, Trophy, Flame } from "lucide-react";

interface StatItem {
  icon: React.ElementType;
  value: number;
  suffix?: string;
  label: string;
  gradient: string;
}

const stats: StatItem[] = [
  {
    icon: Users,
    value: 500,
    suffix: "+",
    label: "Colaboradores ativos",
    gradient: "from-primary to-accent",
  },
  {
    icon: BookOpen,
    value: 50,
    suffix: "+",
    label: "Cursos disponíveis",
    gradient: "from-accent to-warning",
  },
  {
    icon: Trophy,
    value: 1200,
    suffix: "+",
    label: "Certificados emitidos",
    gradient: "from-warning to-primary",
  },
  {
    icon: Flame,
    value: 95,
    suffix: "%",
    label: "Taxa de satisfação",
    gradient: "from-primary to-secondary",
  },
];

const AnimatedCounter = ({ 
  value, 
  suffix = "", 
  duration = 2 
}: { 
  value: number; 
  suffix?: string; 
  duration?: number 
}) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number;
    let animationFrame: number;

    const easeOutQuart = (x: number): number => {
      return 1 - Math.pow(1 - x, 4);
    };

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      
      const easedProgress = easeOutQuart(progress);
      setCount(Math.floor(easedProgress * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isInView, value, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {count.toLocaleString('pt-BR')}{suffix}
    </span>
  );
};

const SocialProofCounter = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-50px" });

  return (
    <section className="py-16 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5" />
      
      <div className="container-app relative" ref={containerRef}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8"
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className="relative group"
              >
                <div className="text-center p-6 lg:p-8 rounded-3xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1">
                  {/* Icon */}
                  <motion.div
                    className={`w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </motion.div>

                  {/* Value */}
                  <div className={`text-4xl lg:text-5xl font-display font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent mb-2`}>
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </div>

                  {/* Label */}
                  <p className="text-sm lg:text-base text-muted-foreground font-medium">
                    {stat.label}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-4 mt-12"
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/50">
            <div className="flex -space-x-2">
              {["AP", "CE", "JM", "RS"].map((initials, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold border-2 border-background"
                >
                  {initials}
                </div>
              ))}
            </div>
            <span className="text-sm text-muted-foreground ml-2">
              +500 colaboradores aprendendo
            </span>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/50">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className="w-4 h-4 text-warning fill-warning"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              4.9/5 de satisfação
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SocialProofCounter;

import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Play, ArrowRight, Users, Sparkles, Flame
} from "lucide-react";
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";
import HeroBackground from "./hero/HeroBackground";
import HeroFloatingElements from "./hero/HeroFloatingElements";
import HeroStats from "./hero/HeroStats";
import HeroCard from "./hero/HeroCard";

const rotatingWords = ["crescimento", "futuro", "carreira", "potencial", "sucesso"];

const HeroSection = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % rotatingWords.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"]
  });

  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const bgY = useTransform(smoothProgress, [0, 1], [0, 150]);
  const floatingY1 = useTransform(smoothProgress, [0, 1], [0, -80]);
  const floatingY2 = useTransform(smoothProgress, [0, 1], [0, -120]);
  const floatingY3 = useTransform(smoothProgress, [0, 1], [0, -60]);
  const contentY = useTransform(smoothProgress, [0, 1], [0, 50]);
  const cardY = useTransform(smoothProgress, [0, 1], [0, -30]);
  const gridOpacity = useTransform(smoothProgress, [0, 0.5], [0.02, 0]);

  useEffect(() => {
    let rafId: number | null = null;
    let lastX = 0;
    let lastY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      lastX = e.clientX;
      lastY = e.clientY;
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        setMousePosition({ x: (lastX - centerX) / centerX, y: (lastY - centerY) / centerY });
        rafId = null;
      });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <section ref={sectionRef} className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      <HeroBackground bgY={bgY} mousePosition={mousePosition} gridOpacity={gridOpacity} />
      <HeroFloatingElements floatingY1={floatingY1} floatingY2={floatingY2} floatingY3={floatingY3} mousePosition={mousePosition} />

      <div className="container-app py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content */}
          <motion.div className="space-y-8" style={{ y: contentY }}>
            <motion.div
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 backdrop-blur-sm"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Flame className="w-4 h-4 text-primary animate-pulse" aria-hidden="true" />
              <span className="text-sm font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Exclusivo para colaboradores Promo Brindes
              </span>
            </motion.div>

            <motion.h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold text-foreground leading-[1.1] tracking-tight"
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            >
              Invista no seu{" "}
              <span className="relative inline-block min-w-[200px] sm:min-w-[280px] md:min-w-[360px]">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={currentWordIndex}
                    className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-gradient absolute left-0"
                    initial={{ opacity: 0, y: 20, rotateX: -90 }} animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    exit={{ opacity: 0, y: -20, rotateX: 90 }} transition={{ duration: 0.5, ease: "easeOut" }}
                  >
                    {rotatingWords[currentWordIndex]}
                  </motion.span>
                </AnimatePresence>
                <span className="invisible">{rotatingWords[0]}</span>
                <Sparkles className="absolute -top-2 -right-6 w-6 h-6 text-accent animate-pulse" aria-hidden="true" />
              </span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-warning">profissional</span>
            </motion.h1>

            <motion.p
              className="text-xl md:text-2xl text-muted-foreground max-w-xl leading-relaxed"
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            >
              A Promo Brindes acredita no seu potencial. Acesse cursos exclusivos, 
              desenvolva novas habilidades e construa a carreira que você sempre quis.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 pt-4"
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Link to="/auth">
                <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground text-lg px-8 h-16 font-semibold shadow-2xl shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 hover:-translate-y-1 group">
                  <Sparkles className="mr-2 w-5 h-5 group-hover:rotate-12 transition-transform" aria-hidden="true" />
                  Acessar Minha Conta
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </Button>
              </Link>
              <Link to="/catalogo">
                <Button size="lg" variant="outline" className="text-lg px-8 h-16 group border-2 border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-300">
                  <Play className="mr-2 w-5 h-5 group-hover:scale-125 transition-transform text-primary" fill="currentColor" aria-hidden="true" />
                  Conhecer a Plataforma
                </Button>
              </Link>
            </motion.div>

            <motion.div
              className="pt-4 flex items-center gap-4 p-4 rounded-2xl bg-muted/50 border border-border/50 backdrop-blur-sm"
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center" aria-hidden="true">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Acesso 100% gratuito</p>
                <p className="text-sm text-muted-foreground">Todos os colaboradores têm acesso completo</p>
              </div>
            </motion.div>
          </motion.div>

          <HeroCard cardY={cardY} mousePosition={mousePosition} />
        </div>

        <HeroStats />
      </div>

      <style>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient { animation: gradient 3s ease infinite; }
      `}</style>
    </section>
  );
};

export default HeroSection;

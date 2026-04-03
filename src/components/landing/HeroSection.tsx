import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Play, 
  Pause,
  ArrowRight, 
  Users, 
  BookOpen, 
  Award, 
  Sparkles, 
  Flame,
  Volume2,
  VolumeX
} from "lucide-react";
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";
import HeroBackground from "./hero/HeroBackground";
import HeroFloatingElements from "./hero/HeroFloatingElements";
import HeroStats from "./hero/HeroStats";
import CountUp from "./hero/CountUp";

// Typing effect words
const rotatingWords = ["crescimento", "futuro", "carreira", "potencial", "sucesso"];

const HeroSection = () => {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  // Rotate typing words
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % rotatingWords.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Scroll-based parallax
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"]
  });

  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  // Parallax transforms for different layers
  const bgY = useTransform(smoothProgress, [0, 1], [0, 150]);
  const floatingY1 = useTransform(smoothProgress, [0, 1], [0, -80]);
  const floatingY2 = useTransform(smoothProgress, [0, 1], [0, -120]);
  const floatingY3 = useTransform(smoothProgress, [0, 1], [0, -60]);
  const contentY = useTransform(smoothProgress, [0, 1], [0, 50]);
  const cardY = useTransform(smoothProgress, [0, 1], [0, -30]);
  const gridOpacity = useTransform(smoothProgress, [0, 0.5], [0.02, 0]);

  // Mouse parallax effect with throttle for performance
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
        setMousePosition({
          x: (lastX - centerX) / centerX,
          y: (lastY - centerY) / centerY,
        });
        rafId = null;
      });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  const handlePlayVideo = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  const handleToggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <section ref={sectionRef} className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      <HeroBackground bgY={bgY} mousePosition={mousePosition} gridOpacity={gridOpacity} />
      <HeroFloatingElements 
        floatingY1={floatingY1} 
        floatingY2={floatingY2} 
        floatingY3={floatingY3} 
        mousePosition={mousePosition} 
      />

      <div className="container-app py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content */}
          <motion.div className="space-y-8" style={{ y: contentY }}>
            {/* Badge */}
            <motion.div 
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 backdrop-blur-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Flame className="w-4 h-4 text-primary animate-pulse" aria-hidden="true" />
              <span className="text-sm font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Exclusivo para colaboradores Promo Brindes
              </span>
            </motion.div>

            {/* Heading with Typing Effect */}
            <motion.h1 
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold text-foreground leading-[1.1] tracking-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Invista no seu{" "}
              <span className="relative inline-block min-w-[200px] sm:min-w-[280px] md:min-w-[360px]">
                <AnimatePresence mode="wait">
                  <motion.span 
                    key={currentWordIndex}
                    className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-gradient absolute left-0"
                    initial={{ opacity: 0, y: 20, rotateX: -90 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    exit={{ opacity: 0, y: -20, rotateX: 90 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  >
                    {rotatingWords[currentWordIndex]}
                  </motion.span>
                </AnimatePresence>
                <span className="invisible">{rotatingWords[0]}</span>
                <Sparkles className="absolute -top-2 -right-6 w-6 h-6 text-accent animate-pulse" aria-hidden="true" />
              </span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-warning">
                profissional
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p 
              className="text-xl md:text-2xl text-muted-foreground max-w-xl leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              A Promo Brindes acredita no seu potencial. Acesse cursos exclusivos, 
              desenvolva novas habilidades e construa a carreira que você sempre quis.
            </motion.p>

            {/* CTAs */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 pt-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Link to="/auth">
                <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground text-lg px-8 h-16 font-semibold shadow-2xl shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 hover:-translate-y-1 group">
                  <Sparkles className="mr-2 w-5 h-5 group-hover:rotate-12 transition-transform" aria-hidden="true" />
                  Acessar Minha Conta
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </Button>
              </Link>
              <Link to="/catalogo">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-8 h-16 group border-2 border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
                >
                  <Play className="mr-2 w-5 h-5 group-hover:scale-125 transition-transform text-primary" fill="currentColor" aria-hidden="true" />
                  Conhecer a Plataforma
                </Button>
              </Link>
            </motion.div>

            {/* Internal message */}
            <motion.div 
              className="pt-4 flex items-center gap-4 p-4 rounded-2xl bg-muted/50 border border-border/50 backdrop-blur-sm"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
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

          {/* Right Content - Hero Card */}
          <motion.div 
            className="relative"
            style={{ y: cardY }}
            initial={{ opacity: 0, scale: 0.9, x: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Glow Effect */}
            <motion.div 
              className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-[2rem] blur-2xl opacity-50"
              aria-hidden="true"
              animate={{ opacity: [0.4, 0.6, 0.4], scale: [1, 1.02, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            
            {/* Main Card */}
            <motion.div 
              className="relative bg-card/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-border/50 overflow-hidden"
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {/* Video Preview */}
              <div className="aspect-video bg-gradient-to-br from-primary/30 via-accent/20 to-secondary/30 flex items-center justify-center relative overflow-hidden">
                <video
                  ref={videoRef}
                  className="absolute inset-0 w-full h-full object-cover"
                  poster="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80"
                  muted={isMuted}
                  loop
                  playsInline
                  preload="metadata"
                >
                  <source 
                    src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" 
                    type="video/mp4" 
                  />
                </video>

                <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-background/20" aria-hidden="true" />

                <div className="absolute inset-0 opacity-20" aria-hidden="true" style={{
                  backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--primary) / 0.3) 1px, transparent 0)`,
                  backgroundSize: '24px 24px'
                }} />
                
                {/* Play/Pause Button */}
                <motion.button 
                  onClick={handlePlayVideo}
                  className="relative z-10 w-24 h-24 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground flex items-center justify-center shadow-2xl shadow-primary/40 group"
                  aria-label={isVideoPlaying ? "Pausar vídeo" : "Reproduzir vídeo"}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  {!isVideoPlaying && <div className="absolute inset-0 rounded-full bg-primary/50 animate-ping" aria-hidden="true" />}
                  {isVideoPlaying ? (
                    <Pause className="w-10 h-10 group-hover:scale-110 transition-transform" fill="currentColor" />
                  ) : (
                    <Play className="w-10 h-10 ml-1 group-hover:scale-110 transition-transform" fill="currentColor" />
                  )}
                </motion.button>

                {/* Volume Control */}
                {isVideoPlaying && (
                  <motion.button
                    onClick={handleToggleMute}
                    className="absolute bottom-4 right-4 z-10 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
                    aria-label={isMuted ? "Ativar som" : "Desativar som"}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {isMuted ? <VolumeX className="w-5 h-5 text-foreground" /> : <Volume2 className="w-5 h-5 text-foreground" />}
                  </motion.button>
                )}

                {/* Course Badge */}
                <div className="absolute top-4 left-4 z-10 px-4 py-2 rounded-xl bg-background/90 backdrop-blur-sm border border-border/50 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-primary" aria-hidden="true" />
                  <span className="text-sm font-semibold text-foreground">Em alta</span>
                </div>
              </div>

              {/* Course Info Preview */}
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center" aria-hidden="true">
                    <BookOpen className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-card-foreground">
                      Atendimento de Excelência
                    </h4>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium">Trilha obrigatória</span>
                      <span>8 módulos</span>
                    </p>
                  </div>
                </div>
                
                {/* Progress */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground font-medium">Seu progresso</span>
                    <motion.span 
                      className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.2 }}
                    >
                      <CountUp target={65} />%
                    </motion.span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden relative">
                    <motion.div 
                      className="h-full rounded-full bg-gradient-to-r from-primary to-accent relative"
                      initial={{ width: 0 }}
                      animate={{ width: "65%" }}
                      transition={{ duration: 1.5, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-foreground/30 to-transparent"
                        aria-hidden="true"
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 2 }}
                      />
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Floating XP Card */}
            <motion.div 
              className="absolute -bottom-6 -left-6 bg-card/90 backdrop-blur-xl rounded-2xl shadow-xl border border-border/50 p-4"
              aria-hidden="true"
              initial={{ opacity: 0, x: -30, y: 30 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              style={{
                x: mousePosition.x * -25,
                y: mousePosition.y * -25,
                rotateX: mousePosition.y * -8,
                rotateY: mousePosition.x * 8,
                transformStyle: "preserve-3d",
                perspective: 1000,
              }}
              whileHover={{ 
                scale: 1.08, 
                rotateX: 0, 
                rotateY: 0,
                boxShadow: "0 25px 50px -12px hsl(var(--primary) / 0.25)",
              }}
            >
              <motion.div 
                className="flex items-center gap-3"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                style={{ transform: "translateZ(20px)" }}
              >
                <div className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-accent to-warning text-accent-foreground font-bold text-sm">
                  +150 XP
                </div>
                <div className="text-sm">
                  <p className="font-bold text-card-foreground">Parabéns!</p>
                  <p className="text-muted-foreground text-xs">Curso concluído</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Floating Certificate Card */}
            <motion.div 
              className="absolute -top-4 -right-4 bg-card/90 backdrop-blur-xl rounded-2xl shadow-xl border border-border/50 p-4"
              aria-hidden="true"
              initial={{ opacity: 0, x: 30, y: -30 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              style={{
                x: mousePosition.x * 20,
                y: mousePosition.y * 20,
                rotateX: mousePosition.y * 10,
                rotateY: mousePosition.x * -10,
                transformStyle: "preserve-3d",
                perspective: 1000,
              }}
              whileHover={{ 
                scale: 1.08, 
                rotateX: 0, 
                rotateY: 0,
                boxShadow: "0 25px 50px -12px hsl(var(--warning) / 0.25)",
              }}
            >
              <motion.div 
                className="flex items-center gap-3"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                style={{ transform: "translateZ(20px)" }}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-warning/20 to-accent/20 flex items-center justify-center">
                  <Award className="w-6 h-6 text-warning" />
                </div>
                <div className="text-sm">
                  <p className="font-bold text-card-foreground">Certificado</p>
                  <p className="text-muted-foreground text-xs">Disponível</p>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        <HeroStats />
      </div>

      {/* CSS for gradient animation */}
      <style>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </section>
  );
};

export default HeroSection;

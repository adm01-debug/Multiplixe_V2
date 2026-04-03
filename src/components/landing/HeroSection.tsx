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
  TrendingUp, 
  Sparkles, 
  Zap, 
  Trophy,
  Target,
  Flame,
  Volume2,
  VolumeX
} from "lucide-react";
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";

// Typing effect words
const rotatingWords = ["crescimento", "futuro", "carreira", "potencial", "sucesso"];

// Animated counter component
const CountUp = ({ target }: { target: number }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const duration = 1500;
    const startTime = Date.now();
    const startDelay = 800;
    
    const timeout = setTimeout(() => {
      const animate = () => {
        const elapsed = Date.now() - startTime - startDelay;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        setCount(Math.floor(easeOut * target));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    }, startDelay);
    
    return () => clearTimeout(timeout);
  }, [target]);
  
  return <>{count}</>;
};

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

  // Mouse parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      setMousePosition({
        x: (clientX - centerX) / centerX,
        y: (clientY - centerY) / centerY,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
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

  const stats = [
    { icon: BookOpen, value: "50+", label: "Cursos disponíveis", color: "from-primary to-accent" },
    { icon: TrendingUp, value: "12", label: "Trilhas de carreira", color: "from-accent to-warning" },
    { icon: Award, value: "100%", label: "Certificados válidos", color: "from-warning to-primary" },
  ];

  return (
    <section ref={sectionRef} className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Animated Background with Parallax */}
      <motion.div className="absolute inset-0 -z-10" style={{ y: bgY }}>
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted" />
        <motion.div 
          className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]"
          animate={{
            x: mousePosition.x * 30,
            y: mousePosition.y * 30,
            scale: [1, 1.05, 1],
          }}
          transition={{ 
            x: { type: "spring", stiffness: 50, damping: 30 },
            y: { type: "spring", stiffness: 50, damping: 30 },
            scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
          }}
        />
        <motion.div 
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px]"
          animate={{
            x: mousePosition.x * -20,
            y: mousePosition.y * -20,
            scale: [1, 1.08, 1],
          }}
          transition={{ 
            x: { type: "spring", stiffness: 50, damping: 30 },
            y: { type: "spring", stiffness: 50, damping: 30 },
            scale: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }
          }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-secondary/5 rounded-full blur-[150px]" />
      </motion.div>

      {/* Floating Elements with Parallax */}
      <motion.div 
        className="absolute top-32 left-10 opacity-60"
        aria-hidden="true"
        style={{ y: floatingY1 }}
        animate={{
          x: mousePosition.x * 15,
          y: mousePosition.y * 15,
        }}
        transition={{ type: "spring", stiffness: 50, damping: 30 }}
      >
        <motion.div 
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 backdrop-blur-sm border border-primary/20 flex items-center justify-center"
          animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Zap className="w-8 h-8 text-primary" />
        </motion.div>
      </motion.div>
      <motion.div 
        className="absolute top-48 right-20 opacity-60"
        aria-hidden="true"
        style={{ y: floatingY2 }}
        animate={{
          x: mousePosition.x * -10,
          y: mousePosition.y * -10,
        }}
        transition={{ type: "spring", stiffness: 50, damping: 30 }}
      >
        <motion.div 
          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 backdrop-blur-sm border border-accent/20 flex items-center justify-center"
          animate={{ y: [0, -15, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        >
          <Trophy className="w-7 h-7 text-accent" />
        </motion.div>
      </motion.div>
      <motion.div 
        className="absolute bottom-32 left-20 opacity-60"
        aria-hidden="true"
        style={{ y: floatingY3 }}
        animate={{
          x: mousePosition.x * 20,
          y: mousePosition.y * 20,
        }}
        transition={{ type: "spring", stiffness: 50, damping: 30 }}
      >
        <motion.div 
          className="w-12 h-12 rounded-2xl bg-gradient-to-br from-warning/20 to-warning/5 backdrop-blur-sm border border-warning/20 flex items-center justify-center"
          animate={{ y: [0, -8, 0], rotate: [0, 3, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        >
          <Target className="w-6 h-6 text-warning" />
        </motion.div>
      </motion.div>

      {/* Grid Pattern with fade on scroll */}
      <motion.div className="absolute inset-0 -z-10" style={{ opacity: gridOpacity }}>
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />
      </motion.div>

      <div className="container-app py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content with subtle parallax */}
          <motion.div className="space-y-8" style={{ y: contentY }}>
            {/* Badge */}
            <motion.div 
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 backdrop-blur-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Flame className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-sm font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Exclusivo para colaboradores Promo Brindes
              </span>
            </motion.div>

            {/* Heading with Typing Effect */}
            <motion.h1 
              className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-foreground leading-[1.1] tracking-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Invista no seu{" "}
              <span className="relative inline-block min-w-[280px] md:min-w-[360px]">
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
                <Sparkles className="absolute -top-2 -right-6 w-6 h-6 text-accent animate-pulse" />
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
                  <Sparkles className="mr-2 w-5 h-5 group-hover:rotate-12 transition-transform" />
                  Acessar Minha Conta
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/catalogo">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-8 h-16 group border-2 border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
                >
                  <Play className="mr-2 w-5 h-5 group-hover:scale-125 transition-transform text-primary" fill="currentColor" />
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
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Acesso 100% gratuito</p>
                <p className="text-sm text-muted-foreground">Todos os colaboradores têm acesso completo</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Content - Hero Image/Card with parallax */}
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
              animate={{
                opacity: [0.4, 0.6, 0.4],
                scale: [1, 1.02, 1],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            
            {/* Main Card */}
            <motion.div 
              className="relative bg-card/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-border/50 overflow-hidden"
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {/* Video Preview with Real Video */}
              <div className="aspect-video bg-gradient-to-br from-primary/30 via-accent/20 to-secondary/30 flex items-center justify-center relative overflow-hidden">
                {/* Background Video */}
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

                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-background/20" />

                {/* Mesh Pattern */}
                <div className="absolute inset-0 opacity-20" style={{
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
                  {!isVideoPlaying && <div className="absolute inset-0 rounded-full bg-primary/50 animate-ping" />}
                  {isVideoPlaying ? (
                    <Pause className="w-10 h-10 group-hover:scale-110 transition-transform" fill="currentColor" />
                  ) : (
                    <Play className="w-10 h-10 ml-1 group-hover:scale-110 transition-transform" fill="currentColor" />
                  )}
                </motion.button>

                {/* Video Controls */}
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
                    {isMuted ? (
                      <VolumeX className="w-5 h-5 text-foreground" />
                    ) : (
                      <Volume2 className="w-5 h-5 text-foreground" />
                    )}
                  </motion.button>
                )}

                {/* Course Badge */}
                <div className="absolute top-4 left-4 z-10 px-4 py-2 rounded-xl bg-background/90 backdrop-blur-sm border border-border/50 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">Em alta</span>
                </div>
              </div>

              {/* Course Info Preview */}
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
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
                
                {/* Animated Progress Ring */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground font-medium">Seu progresso</span>
                    <motion.span 
                      className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.2 }}
                    >
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        {/* Animated Counter */}
                        <CountUp target={65} />%
                      </motion.span>
                    </motion.span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden relative">
                    <motion.div 
                      className="h-full rounded-full bg-gradient-to-r from-primary to-accent relative"
                      initial={{ width: 0 }}
                      animate={{ width: "65%" }}
                      transition={{ duration: 1.5, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    >
                      {/* Shimmer effect on progress bar */}
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 2 }}
                      />
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Floating Card - XP with 3D Tilt + Enhanced Parallax */}
            <motion.div 
              className="absolute -bottom-6 -left-6 bg-card/90 backdrop-blur-xl rounded-2xl shadow-xl border border-border/50 p-4 cursor-pointer"
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
                transition: { type: "spring", stiffness: 300, damping: 20 }
              }}
              whileTap={{ scale: 0.95 }}
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
              {/* Shine Effect */}
              <motion.div 
                className="absolute inset-0 rounded-2xl opacity-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent"
                whileHover={{ opacity: 1, x: ['-100%', '100%'] }}
                transition={{ duration: 0.6 }}
              />
            </motion.div>

            {/* Floating Card - Certificate with 3D Tilt + Enhanced Parallax */}
            <motion.div 
              className="absolute -top-4 -right-4 bg-card/90 backdrop-blur-xl rounded-2xl shadow-xl border border-border/50 p-4 cursor-pointer"
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
                transition: { type: "spring", stiffness: 300, damping: 20 }
              }}
              whileTap={{ scale: 0.95 }}
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
              {/* Shine Effect */}
              <motion.div 
                className="absolute inset-0 rounded-2xl opacity-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent"
                whileHover={{ opacity: 1, x: ['-100%', '100%'] }}
                transition={{ duration: 0.6 }}
              />
            </motion.div>
          </motion.div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 pt-12 border-t border-border/50">
          {stats.map((stat, index) => (
            <div 
              key={stat.label}
              className="flex items-center gap-5 p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 group animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/70">
                  {stat.value}
                </p>
                <p className="text-muted-foreground font-medium">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
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

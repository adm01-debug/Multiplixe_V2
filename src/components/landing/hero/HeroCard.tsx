import { useRef, useState } from "react";
import { Play, Pause, BookOpen, Award, Flame, Volume2, VolumeX } from "lucide-react";
import { motion, MotionValue } from "framer-motion";
import CountUp from "./CountUp";

interface HeroCardProps {
  cardY: MotionValue<number>;
  mousePosition: { x: number; y: number };
}

const HeroCard = ({ cardY, mousePosition }: HeroCardProps) => {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

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
            aria-label="Prévia do curso em destaque"
          >
            <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" type="video/mp4" />
          </video>

          <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-background/20" aria-hidden="true" />
          <div className="absolute inset-0 opacity-20" aria-hidden="true" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--primary) / 0.3) 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }} />

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
              <h4 className="font-bold text-lg text-card-foreground">Atendimento de Excelência</h4>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium">Trilha obrigatória</span>
                <span>8 módulos</span>
              </p>
            </div>
          </div>

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
        whileHover={{ scale: 1.08, rotateX: 0, rotateY: 0, boxShadow: "0 25px 50px -12px hsl(var(--primary) / 0.25)" }}
      >
        <motion.div
          className="flex items-center gap-3"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          style={{ transform: "translateZ(20px)" }}
        >
          <div className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-accent to-warning text-accent-foreground font-bold text-sm">+150 XP</div>
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
        whileHover={{ scale: 1.08, rotateX: 0, rotateY: 0, boxShadow: "0 25px 50px -12px hsl(var(--warning) / 0.25)" }}
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
  );
};

export default HeroCard;

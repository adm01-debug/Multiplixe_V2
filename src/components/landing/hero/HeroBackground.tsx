import { motion, type MotionValue } from "framer-motion";

interface HeroBackgroundProps {
  bgY: MotionValue<number>;
  mousePosition: { x: number; y: number };
  gridOpacity: MotionValue<number>;
}

const HeroBackground = ({ bgY, mousePosition, gridOpacity }: HeroBackgroundProps) => {
  return (
    <>
      {/* Animated Background with Parallax */}
      <motion.div className="absolute inset-0 -z-10" style={{ y: bgY }} aria-hidden="true">
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

      {/* Grid Pattern with fade on scroll */}
      <motion.div className="absolute inset-0 -z-10" style={{ opacity: gridOpacity }} aria-hidden="true">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />
      </motion.div>
    </>
  );
};

export default HeroBackground;

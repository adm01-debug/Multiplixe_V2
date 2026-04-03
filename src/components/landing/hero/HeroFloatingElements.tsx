import { motion, type MotionValue } from "framer-motion";
import { Zap, Trophy, Target } from "lucide-react";

interface HeroFloatingElementsProps {
  floatingY1: MotionValue<number>;
  floatingY2: MotionValue<number>;
  floatingY3: MotionValue<number>;
  mousePosition: { x: number; y: number };
}

const HeroFloatingElements = ({ floatingY1, floatingY2, floatingY3, mousePosition }: HeroFloatingElementsProps) => {
  return (
    <>
      <motion.div 
        className="absolute top-32 left-10 opacity-60"
        aria-hidden="true"
        style={{ y: floatingY1 }}
        animate={{ x: mousePosition.x * 15, y: mousePosition.y * 15 }}
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
        animate={{ x: mousePosition.x * -10, y: mousePosition.y * -10 }}
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
        animate={{ x: mousePosition.x * 20, y: mousePosition.y * 20 }}
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
    </>
  );
};

export default HeroFloatingElements;

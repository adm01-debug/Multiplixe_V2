import { motion, useScroll, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';

interface FloatingProgressProps {
  progress: number;
  lessonTitle: string;
  lessonNumber: number;
  totalLessons: number;
}

const FloatingProgress = ({ 
  progress, 
  lessonTitle, 
  lessonNumber, 
  totalLessons 
}: FloatingProgressProps) => {
  const { scrollY } = useScroll();
  const [showProgress, setShowProgress] = useState(false);
  
  // Show floating progress after scrolling 100px
  const opacity = useTransform(scrollY, [50, 100], [0, 1]);
  const y = useTransform(scrollY, [50, 100], [-20, 0]);

  useEffect(() => {
    const unsubscribe = scrollY.on('change', (latest) => {
      setShowProgress(latest > 80);
    });
    return () => unsubscribe();
  }, [scrollY]);

  if (!showProgress) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-[60] pointer-events-none"
      style={{ opacity, y }}
    >
      {/* Background blur bar */}
      <div className="absolute inset-x-0 top-0 h-1.5 bg-muted/80 backdrop-blur-sm" />
      
      {/* Progress bar */}
      <motion.div
        className="absolute top-0 left-0 h-1.5 bg-gradient-to-r from-primary via-accent to-primary rounded-r-full shadow-lg"
        style={{ width: `${progress}%` }}
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />
      
      {/* Glow effect on progress */}
      <motion.div
        className="absolute top-0 left-0 h-1.5 bg-gradient-to-r from-primary/50 to-accent/50 blur-sm"
        style={{ width: `${progress}%` }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />
      
      {/* Info badge - appears when scrolled */}
      <motion.div
        className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-auto"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <div className="flex items-center gap-3 px-4 py-2 bg-background/90 backdrop-blur-xl border border-border/50 rounded-full shadow-lg">
          <span className="text-xs font-medium text-muted-foreground">
            Aula {lessonNumber}/{totalLessons}
          </span>
          <div className="w-px h-4 bg-border" />
          <span className="text-xs font-semibold text-foreground max-w-[150px] truncate">
            {lessonTitle}
          </span>
          <div className="w-px h-4 bg-border" />
          <span className="text-xs font-bold text-primary">
            {Math.round(progress)}%
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FloatingProgress;

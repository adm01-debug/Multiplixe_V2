import { useEffect, useState, useRef } from 'react';
import { useNavigation, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const NavigationProgress = () => {
  const navigation = useNavigation();
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Limpar timers anteriores
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (navigation.state === 'loading') {
      setIsVisible(true);
      setProgress(0);
      
      // Simular progresso gradual
      let currentProgress = 0;
      intervalRef.current = setInterval(() => {
        currentProgress += Math.random() * 15;
        if (currentProgress > 90) currentProgress = 90;
        setProgress(currentProgress);
      }, 100);
    } else if (navigation.state === 'idle' && isVisible) {
      // Completar animação
      setProgress(100);
      
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
      }, 300);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [navigation.state, isVisible]);

  // Reset ao mudar de rota
  useEffect(() => {
    setProgress(0);
    setIsVisible(false);
  }, [location.pathname]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[9999] h-1"
        >
          {/* Background track */}
          <div className="absolute inset-0 bg-primary/10" />
          
          {/* Progress bar */}
          <motion.div
            className="h-full bg-gradient-to-r from-primary via-accent to-primary relative overflow-hidden"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ 
                duration: 1, 
                repeat: Infinity, 
                ease: 'linear' 
              }}
            />
          </motion.div>
          
          {/* Glow effect */}
          <motion.div
            className="absolute right-0 top-0 w-24 h-full bg-gradient-to-l from-primary/50 to-transparent blur-sm"
            style={{ right: `${100 - progress}%` }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NavigationProgress;

import { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const NavigationProgress = () => {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevPathRef = useRef(location.pathname);

  const clearTimers = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const startProgress = useCallback(() => {
    clearTimers();
    setIsVisible(true);
    setProgress(0);

    let currentProgress = 0;
    intervalRef.current = setInterval(() => {
      // Slow down as we approach 90%
      const increment = currentProgress < 50 
        ? Math.random() * 20 + 10
        : currentProgress < 80 
          ? Math.random() * 8 + 2
          : Math.random() * 2;
      
      currentProgress = Math.min(currentProgress + increment, 92);
      setProgress(currentProgress);
    }, 150);
  }, [clearTimers]);

  const completeProgress = useCallback(() => {
    clearTimers();
    setProgress(100);

    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
      // Reset after fade out
      setTimeout(() => setProgress(0), 300);
    }, 400);
  }, [clearTimers]);

  // Watch for route changes
  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      // Route is changing - start loading
      startProgress();
      
      // Complete after a short delay (simulating page load)
      timeoutRef.current = setTimeout(() => {
        completeProgress();
      }, 300);
      
      prevPathRef.current = location.pathname;
    }

    return clearTimers;
  }, [location.pathname, startProgress, completeProgress, clearTimers]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
          className="fixed top-0 left-0 right-0 z-[9999] h-[3px]"
        >
          {/* Background track */}
          <div className="absolute inset-0 bg-primary/10 backdrop-blur-sm" />
          
          {/* Progress bar */}
          <motion.div
            className="h-full bg-gradient-to-r from-primary via-accent to-primary relative overflow-hidden"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ 
                duration: 0.8, 
                repeat: Infinity, 
                ease: 'linear' 
              }}
            />
          </motion.div>
          
          {/* Leading glow effect */}
          <motion.div
            className="absolute top-0 h-full w-20 bg-gradient-to-l from-primary/60 to-transparent blur-md"
            style={{ left: `calc(${progress}% - 2rem)` }}
          />
          
          {/* Pulse dot at the end */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary shadow-lg shadow-primary/50"
            style={{ left: `calc(${progress}% - 4px)` }}
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [1, 0.8, 1]
            }}
            transition={{ 
              duration: 0.6, 
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NavigationProgress;
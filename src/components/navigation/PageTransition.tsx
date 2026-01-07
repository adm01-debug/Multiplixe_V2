import { motion, AnimatePresence, Variants } from "framer-motion";
import { useLocation } from "react-router-dom";
import { ReactNode, useRef, useEffect, useState } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

// Route hierarchy for determining transition direction
const routeOrder = [
  '/',
  '/auth',
  '/dashboard',
  '/catalogo',
  '/trilhas',
  '/ranking',
  '/perfil',
  '/admin',
];

const getRouteIndex = (path: string): number => {
  // Check exact match first
  const exactIndex = routeOrder.indexOf(path);
  if (exactIndex !== -1) return exactIndex;
  
  // Check for partial matches (e.g., /curso/slug)
  if (path.startsWith('/curso')) return 3.5;
  if (path.startsWith('/trilha')) return 4.5;
  
  return 99;
};

const PageTransition = ({ children }: PageTransitionProps) => {
  const location = useLocation();
  const prevPathRef = useRef(location.pathname);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  useEffect(() => {
    const prevIndex = getRouteIndex(prevPathRef.current);
    const currentIndex = getRouteIndex(location.pathname);
    
    setDirection(currentIndex >= prevIndex ? 'forward' : 'backward');
    prevPathRef.current = location.pathname;
  }, [location.pathname]);

  const pageVariants: Variants = {
    initial: (dir: 'forward' | 'backward') => ({
      opacity: 0,
      x: dir === 'forward' ? 20 : -20,
      scale: 0.98,
      filter: 'blur(4px)',
    }),
    animate: {
      opacity: 1,
      x: 0,
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        duration: 0.35,
        ease: [0.32, 0.72, 0, 1],
        opacity: { duration: 0.25 },
        filter: { duration: 0.2 },
      },
    },
    exit: (dir: 'forward' | 'backward') => ({
      opacity: 0,
      x: dir === 'forward' ? -20 : 20,
      scale: 0.98,
      filter: 'blur(4px)',
      transition: {
        duration: 0.25,
        ease: [0.32, 0.72, 0, 1],
      },
    }),
  };

  return (
    <AnimatePresence mode="wait" initial={false} custom={direction}>
      <motion.div
        key={location.pathname}
        custom={direction}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="min-h-screen"
        style={{ willChange: 'transform, opacity, filter' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default PageTransition;
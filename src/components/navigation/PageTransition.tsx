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
      x: dir === 'forward' ? 60 : -60,
      scale: 0.96,
      filter: 'blur(8px)',
    }),
    animate: {
      opacity: 1,
      x: 0,
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
        mass: 0.8,
        opacity: { duration: 0.3, ease: 'easeOut' },
        filter: { duration: 0.25, ease: 'easeOut' },
      },
    },
    exit: (dir: 'forward' | 'backward') => ({
      opacity: 0,
      x: dir === 'forward' ? -40 : 40,
      scale: 0.98,
      filter: 'blur(6px)',
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 35,
        opacity: { duration: 0.2, ease: 'easeIn' },
        filter: { duration: 0.15 },
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
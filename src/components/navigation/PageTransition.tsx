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

  // Skip initial entrance animation so first render isn't blank
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  const pageVariants: Variants = {
    initial: (dir: 'forward' | 'backward') => ({
      opacity: 0,
      x: dir === 'forward' ? 30 : -30,
    }),
    animate: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.2,
        ease: 'easeOut',
      },
    },
    exit: (dir: 'forward' | 'backward') => ({
      opacity: 0,
      x: dir === 'forward' ? -20 : 20,
      position: 'absolute',
      inset: 0,
      transition: {
        duration: 0.15,
        ease: 'easeIn',
      },
    }),
  };

  return (
    <div className="relative">
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={location.pathname}
          custom={direction}
          variants={pageVariants}
          initial={hasMounted ? 'initial' : false}
          animate="animate"
          exit="exit"
          className="min-h-screen w-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default PageTransition;
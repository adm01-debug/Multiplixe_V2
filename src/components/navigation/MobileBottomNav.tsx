import { useLocation } from 'react-router-dom';
import PrefetchLink, { usePrefetchQuery } from '@/components/PrefetchLink';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  BookOpen, 
  Trophy, 
  User,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserXP } from '@/hooks/useUserXP';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/catalogo', label: 'Cursos', icon: BookOpen },
  { path: '/onboarding', label: 'Onboarding', icon: Sparkles },
  { path: '/ranking', label: 'Ranking', icon: Trophy },
  { path: '/perfil', label: 'Perfil', icon: User },
];

const MobileBottomNav = () => {
  const location = useLocation();
  const { prefetchCatalog, prefetchLearningPaths, prefetchLeaderboard } = usePrefetchQuery();
  const { currentLevel } = useUserXP();

  const getPrefetchHandler = (path: string) => {
    switch (path) {
      case '/catalogo':
        return prefetchCatalog;
      case '/trilhas':
        return prefetchLearningPaths;
      case '/ranking':
        return prefetchLeaderboard;
      default:
        return undefined;
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Glass background with gradient border */}
      <div className="absolute inset-0 bg-background/90 backdrop-blur-2xl border-t border-gradient-to-r from-primary/20 via-accent/20 to-primary/20" />
      
      {/* Ambient glow */}
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-32 h-8 bg-primary/20 blur-2xl rounded-full" />
      
      {/* Safe area padding for iOS */}
      <div className="relative flex items-center justify-around px-2 pb-safe pt-2 h-[72px]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const prefetchHandler = getPrefetchHandler(item.path);

          return (
            <PrefetchLink
              key={item.path}
              to={item.path}
              prefetch="intent"
              onPrefetchData={prefetchHandler}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className="relative flex flex-col items-center justify-center flex-1 py-2 touch-manipulation"
            >
              <motion.div
                className="flex flex-col items-center relative"
                whileTap={{ scale: 0.85 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                {/* Active pill background */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="activePill"
                      className="absolute -inset-x-3 -inset-y-1 bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 rounded-2xl"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </AnimatePresence>

                {/* Active indicator line */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-gradient-to-r from-primary via-accent to-primary"
                      initial={{ opacity: 0, scaleX: 0 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      exit={{ opacity: 0, scaleX: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </AnimatePresence>

                {/* Icon container */}
                <motion.div
                  className={cn(
                    'relative flex items-center justify-center w-12 h-9 rounded-xl transition-all duration-300',
                    isActive && 'transform-gpu'
                  )}
                  animate={isActive ? { y: -2 } : { y: 0 }}
                >
                  <Icon 
                    className={cn(
                      'h-5 w-5 transition-all duration-300',
                      isActive 
                        ? 'text-primary drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]' 
                        : 'text-muted-foreground'
                    )} 
                  />
                  
                  {/* Sparkle effect for active */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        className="absolute -top-1 -right-1"
                      >
                        <Sparkles className="h-3 w-3 text-accent" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Label with animation */}
                <motion.span
                  className={cn(
                    'text-[10px] font-medium mt-0.5 transition-all duration-300',
                    isActive 
                      ? 'text-primary font-semibold' 
                      : 'text-muted-foreground'
                  )}
                  animate={isActive ? { scale: 1.05 } : { scale: 1 }}
                >
                  {item.label}
                </motion.span>

                {/* XP indicator on profile */}
                {item.path === '/perfil' && currentLevel > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-2 bg-gradient-to-r from-primary to-accent text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full"
                  >
                    Lv{currentLevel}
                  </motion.div>
                )}
              </motion.div>
            </PrefetchLink>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;

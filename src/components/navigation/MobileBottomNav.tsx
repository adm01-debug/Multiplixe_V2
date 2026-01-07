import { useLocation } from 'react-router-dom';
import PrefetchLink from '@/components/PrefetchLink';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  BookOpen, 
  Trophy, 
  User,
  Route
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/catalogo', label: 'Cursos', icon: BookOpen },
  { path: '/trilhas', label: 'Trilhas', icon: Route },
  { path: '/ranking', label: 'Ranking', icon: Trophy },
  { path: '/perfil', label: 'Perfil', icon: User },
];

const MobileBottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Glass background */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-t border-border/50" />
      
      {/* Safe area padding for iOS */}
      <div className="relative flex items-center justify-around px-2 pb-safe pt-2 h-[70px]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <PrefetchLink
              key={item.path}
              to={item.path}
              prefetch="intent"
              className="relative flex flex-col items-center justify-center flex-1 py-2 touch-manipulation"
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full bg-gradient-to-r from-primary to-accent"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}

              {/* Icon container */}
              <div
                className={cn(
                  'relative flex items-center justify-center w-12 h-8 rounded-xl transition-all duration-200',
                  isActive 
                    ? 'bg-primary/10 dark:bg-primary/20' 
                    : 'hover:bg-muted/50'
                )}
              >
                <Icon 
                  className={cn(
                    'h-5 w-5 transition-colors duration-200',
                    isActive 
                      ? 'text-primary' 
                      : 'text-muted-foreground'
                  )} 
                />
                
                {/* Glow effect for active */}
                {isActive && (
                  <div className="absolute inset-0 bg-primary/20 rounded-xl blur-lg" />
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  'text-[10px] font-medium mt-1 transition-colors duration-200',
                  isActive 
                    ? 'text-primary font-semibold' 
                    : 'text-muted-foreground'
                )}
              >
                {item.label}
              </span>
            </PrefetchLink>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;

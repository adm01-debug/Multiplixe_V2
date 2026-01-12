import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, X, ArrowRight } from "lucide-react";

const MobileStickyCTA = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if dismissed in session
    const dismissed = sessionStorage.getItem('mobile_cta_dismissed');
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    const handleScroll = () => {
      // Show after scrolling 300px
      const scrollY = window.scrollY;
      setIsVisible(scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('mobile_cta_dismissed', 'true');
  };

  if (isDismissed) return null;

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key="mobile-sticky-cta"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        >
          {/* Gradient border top */}
          <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          
          {/* Main CTA container */}
          <div className="relative bg-background/95 backdrop-blur-xl border-t border-border/50 px-4 py-3 safe-area-bottom">
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 opacity-50" />
            
            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="absolute -top-10 right-4 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
            
            {/* Content */}
            <div className="relative flex items-center gap-3">
              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  Comece sua jornada agora
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  Acesso 100% gratuito para colaboradores
                </p>
              </div>
              
              {/* CTA Button */}
              <Link to="/auth" className="shrink-0">
                <Button 
                  size="sm"
                  className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-semibold shadow-lg shadow-primary/25 group"
                >
                  <Sparkles className="w-4 h-4 mr-1.5 group-hover:rotate-12 transition-transform" />
                  Acessar
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
            </div>
            
            {/* Animated progress bar */}
            <motion.div 
              className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-primary to-accent"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 10, ease: "linear" }}
              onAnimationComplete={handleDismiss}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileStickyCTA;
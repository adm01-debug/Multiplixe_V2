import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleThemeChange = useCallback(() => {
    // Add transitioning class for smooth CSS transitions
    document.documentElement.classList.add('transitioning');
    
    setTheme(theme === "dark" ? "light" : "dark");
    
    // Remove transitioning class after animation completes
    setTimeout(() => {
      document.documentElement.classList.remove('transitioning');
    }, 500);
  }, [theme, setTheme]);

  if (!mounted) {
    return (
      <button
        className="inline-flex items-center justify-center rounded-xl h-11 w-11 bg-transparent hover:bg-muted/50 transition-colors"
        aria-label="Toggle theme"
      >
        <Sun className="h-5 w-5" />
      </button>
    );
  }

  return (
    <motion.button
      onClick={handleThemeChange}
      className="relative inline-flex items-center justify-center rounded-xl h-11 w-11 bg-transparent hover:bg-muted/50 transition-colors overflow-hidden"
      aria-label="Toggle theme"
      whileHover={{ 
        scale: 1.08,
        backgroundColor: "hsl(var(--muted) / 0.5)",
      }}
      whileTap={{ 
        scale: 0.92,
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 17,
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {theme === "dark" ? (
          <motion.div
            key="sun"
            initial={{ y: -20, opacity: 0, rotate: -90 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: 20, opacity: 0, rotate: 90 }}
            transition={{ 
              duration: 0.25, 
              ease: [0.32, 0.72, 0, 1],
              rotate: { type: "spring", stiffness: 200, damping: 15 }
            }}
          >
            <Sun className="h-5 w-5 text-accent" />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ y: -20, opacity: 0, rotate: 90 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: 20, opacity: 0, rotate: -90 }}
            transition={{ 
              duration: 0.25, 
              ease: [0.32, 0.72, 0, 1],
              rotate: { type: "spring", stiffness: 200, damping: 15 }
            }}
          >
            <Moon className="h-5 w-5 text-primary" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

export default ThemeToggle;
import { motion } from "framer-motion";
import { Search, Command } from "lucide-react";

interface GlobalSearchHintProps {
  onClick?: () => void;
  className?: string;
}

const GlobalSearchHint = ({ onClick, className = "" }: GlobalSearchHintProps) => {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  return (
    <motion.button
      onClick={onClick}
      className={`group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted/50 hover:bg-muted border border-border/50 hover:border-primary/30 transition-all duration-200 ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Search className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors hidden sm:inline">
        Busca rápida...
      </span>
      
      {/* Keyboard shortcut badge */}
      <div className="flex items-center gap-0.5 ml-auto">
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground bg-background border border-border rounded shadow-sm">
          {isMac ? (
            <>
              <Command className="w-2.5 h-2.5" />
              <span>K</span>
            </>
          ) : (
            <span>Ctrl+K</span>
          )}
        </kbd>
      </div>
      
      {/* Animated pulse indicator */}
      <motion.div
        className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [1, 0.7, 1] 
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity,
          ease: "easeInOut" 
        }}
      />
    </motion.button>
  );
};

export default GlobalSearchHint;

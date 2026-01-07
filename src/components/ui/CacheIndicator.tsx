import { motion, AnimatePresence } from "framer-motion";
import { Database, Cloud, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface CacheIndicatorProps {
  isStale: boolean;
  isFetching: boolean;
  className?: string;
  showLabel?: boolean;
}

const CacheIndicator = ({ 
  isStale, 
  isFetching, 
  className,
  showLabel = false 
}: CacheIndicatorProps) => {
  const getStatus = () => {
    if (isFetching) return { icon: RefreshCw, label: "Atualizando...", color: "text-primary" };
    if (isStale) return { icon: Database, label: "Cache", color: "text-muted-foreground" };
    return { icon: Cloud, label: "Atualizado", color: "text-emerald-500" };
  };

  const status = getStatus();
  const Icon = status.icon;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status.label}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "inline-flex items-center gap-1.5 text-xs",
          status.color,
          className
        )}
      >
        <Icon 
          className={cn(
            "h-3.5 w-3.5",
            isFetching && "animate-spin"
          )} 
        />
        {showLabel && (
          <span className="font-medium">{status.label}</span>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default CacheIndicator;

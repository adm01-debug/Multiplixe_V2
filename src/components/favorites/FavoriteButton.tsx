import { motion, AnimatePresence } from "framer-motion";
import { Heart, Loader2 } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface FavoriteButtonProps {
  courseId: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-12 h-12",
};

const iconSizes = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

const FavoriteButton = ({ courseId, className = "", size = "md" }: FavoriteButtonProps) => {
  const { isFavorite, toggleFavorite, isTogglingFavorite } = useFavorites();
  const isFav = isFavorite(courseId);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleFavorite(courseId);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            onClick={handleClick}
            disabled={isTogglingFavorite}
            className={`
              ${sizeClasses[size]} 
              rounded-full 
              flex items-center justify-center 
              backdrop-blur-sm
              transition-all duration-200
              ${isFav 
                ? "bg-rose-500/20 border-rose-500/50 text-rose-500 hover:bg-rose-500/30" 
                : "bg-card/80 border-border/50 text-muted-foreground hover:text-rose-500 hover:border-rose-500/50"
              }
              border
              shadow-lg
              ${className}
            `}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <AnimatePresence mode="wait">
              {isTogglingFavorite ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, rotate: 0 }}
                  animate={{ opacity: 1, rotate: 360 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, rotate: { repeat: Infinity, duration: 1 } }}
                >
                  <Loader2 className={iconSizes[size]} />
                </motion.div>
              ) : (
                <motion.div
                  key={isFav ? "filled" : "empty"}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                >
                  <Heart 
                    className={iconSizes[size]} 
                    fill={isFav ? "currentColor" : "none"}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default FavoriteButton;

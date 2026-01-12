import { useState } from "react";
import { motion } from "framer-motion";
import { LayoutGrid, List } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type ViewMode = "grid" | "list";

interface ViewToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
}

const ViewToggle = ({ value, onChange, className = "" }: ViewToggleProps) => {
  return (
    <TooltipProvider>
      <div className={`flex items-center gap-1 p-1 bg-muted/50 rounded-xl ${className}`}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => onChange("grid")}
              className={`relative p-2 rounded-lg transition-colors ${
                value === "grid" 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {value === "grid" && (
                <motion.div
                  layoutId="viewToggle"
                  className="absolute inset-0 bg-primary/10 border border-primary/30 rounded-lg"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <LayoutGrid className="h-4 w-4 relative z-10" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Visualização em grade</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => onChange("list")}
              className={`relative p-2 rounded-lg transition-colors ${
                value === "list" 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {value === "list" && (
                <motion.div
                  layoutId="viewToggle"
                  className="absolute inset-0 bg-primary/10 border border-primary/30 rounded-lg"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <List className="h-4 w-4 relative z-10" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Visualização em lista</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

export default ViewToggle;

// Hook to persist view preference
export function useViewMode(key: string = "catalog-view") {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem(key);
    return (saved as ViewMode) || "grid";
  });

  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(key, mode);
  };

  return [viewMode, handleViewChange] as const;
}

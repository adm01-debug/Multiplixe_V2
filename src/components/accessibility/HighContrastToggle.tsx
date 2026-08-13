import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Contrast } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

const HIGH_CONTRAST_KEY = "high-contrast-mode";

const HighContrastToggle = () => {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // Check saved preference
    const saved = localStorage.getItem(HIGH_CONTRAST_KEY);
    if (saved === "true") {
      setEnabled(true);
      applyHighContrast(true);
    }

    // Check system preference
    const mediaQuery = window.matchMedia("(prefers-contrast: more)");
    if (mediaQuery.matches && saved === null) {
      setEnabled(true);
      applyHighContrast(true);
    }
  }, []);

  const applyHighContrast = (enable: boolean) => {
    if (enable) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
  };

  const toggle = () => {
    const newValue = !enabled;
    setEnabled(newValue);
    applyHighContrast(newValue);
    localStorage.setItem(HIGH_CONTRAST_KEY, String(newValue));
    toast.success(newValue ? "Alto contraste ativado" : "Alto contraste desativado");
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={toggle}
            className={`rounded-xl border-border/50 transition-colors ${
              enabled
                ? "bg-foreground text-background hover:bg-foreground/90"
                : "hover:bg-primary/10 hover:text-primary hover:border-primary/50"
            }`}
            aria-label={enabled ? "Desativar alto contraste" : "Ativar alto contraste"}
            aria-pressed={enabled}
          >
            <motion.div
              initial={false}
              animate={{ rotate: enabled ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <Contrast className="h-4 w-4" />
            </motion.div>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{enabled ? "Desativar alto contraste" : "Ativar alto contraste"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default HighContrastToggle;

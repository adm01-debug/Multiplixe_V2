import { useState } from "react";
import { Accessibility } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import FontSizeControl from "@/components/accessibility/FontSizeControl";
import HighContrastToggle from "@/components/accessibility/HighContrastToggle";

const AccessibilityWidget = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-24 left-4 z-40 flex flex-col items-start gap-2 md:bottom-8">
      <div className={cn("flex flex-col items-start gap-2", !open && "hidden")}>
        <FontSizeControl />
        <HighContrastToggle />
      </div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setOpen((value) => !value)}
              aria-label="Opções de acessibilidade"
              aria-expanded={open}
              className={cn(
                "rounded-full border-border/50 bg-background/90 shadow-lg backdrop-blur transition-colors",
                open && "border-primary/50 text-primary"
              )}
            >
              <Accessibility className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Opções de acessibilidade</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default AccessibilityWidget;
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Info, AlertTriangle, CheckCircle, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type BannerType = "info" | "warning" | "success" | "promotion";

interface BannerProps {
  id: string;
  type: BannerType;
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  persistDismissal?: boolean;
  className?: string;
}

const Banner = ({
  id,
  type,
  title,
  message,
  action,
  dismissible = true,
  persistDismissal = true,
  className,
}: BannerProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (persistDismissal) {
      const dismissed = localStorage.getItem(`banner-dismissed-${id}`);
      if (dismissed) setIsVisible(false);
    }
  }, [id, persistDismissal]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (persistDismissal) {
      localStorage.setItem(`banner-dismissed-${id}`, "true");
    }
  };

  const styles: Record<BannerType, { bg: string; border: string; icon: React.ElementType; iconColor: string }> = {
    info: {
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      icon: Info,
      iconColor: "text-blue-500",
    },
    warning: {
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      icon: AlertTriangle,
      iconColor: "text-amber-500",
    },
    success: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      icon: CheckCircle,
      iconColor: "text-emerald-500",
    },
    promotion: {
      bg: "bg-gradient-to-r from-primary/10 to-accent/10",
      border: "border-primary/20",
      icon: Bell,
      iconColor: "text-primary",
    },
  };

  const style = styles[type];
  const Icon = style.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20, height: 0 }}
          className={cn(
            "relative px-4 py-3 border rounded-lg",
            style.bg,
            style.border,
            className
          )}
        >
          <div className="flex items-start gap-3">
            <Icon className={cn("w-5 h-5 flex-shrink-0 mt-0.5", style.iconColor)} />
            
            <div className="flex-1 min-w-0">
              {title && (
                <h4 className="font-semibold text-foreground mb-0.5">{title}</h4>
              )}
              <p className="text-sm text-muted-foreground">{message}</p>
              
              {action && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={action.onClick}
                  className="h-auto p-0 mt-1 text-primary"
                >
                  {action.label}
                </Button>
              )}
            </div>

            {dismissible && (
              <button
                onClick={handleDismiss}
                className="p-1 rounded-md hover:bg-foreground/10 transition-colors"
                aria-label="Fechar"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Fixed top banner that pushes content down
interface TopBannerProps extends Omit<BannerProps, "className"> {}

const TopBanner = (props: TopBannerProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (props.persistDismissal) {
      const dismissed = localStorage.getItem(`banner-dismissed-${props.id}`);
      if (dismissed) setIsVisible(false);
    }
  }, [props.id, props.persistDismissal]);

  if (!isVisible) return null;

  return (
    <div className="sticky top-0 z-50 w-full">
      <Banner {...props} className="rounded-none border-x-0 border-t-0" />
    </div>
  );
};

export { Banner, TopBanner };

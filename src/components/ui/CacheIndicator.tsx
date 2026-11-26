import { motion, AnimatePresence } from "framer-motion";
import { Database, Cloud, RefreshCw, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

interface CacheIndicatorProps {
  isStale: boolean;
  isFetching: boolean;
  className?: string;
  showLabel?: boolean;
  onRefresh?: () => void;
}

const CacheIndicator = ({ 
  isStale, 
  isFetching, 
  className,
  showLabel = false,
  onRefresh
}: CacheIndicatorProps) => {
  const isOnline = useOnlineStatus();
    const getStatus = () => {
      if (!isOnline) return { icon: WifiOff, label: "Offline", color: "text-amber-500", tooltip: "Sem conexão - exibindo dados salvos" };
    if (isFetching) return { icon: RefreshCw, label: "Atualizando...", color: "text-primary", tooltip: "Atualizando dados..." };
    if (isStale) return { icon: Database, label: "Cache", color: "text-muted-foreground", tooltip: "Dados em cache - clique para atualizar" };
    return { icon: Cloud, label: "Atualizado", color: "text-emerald-500", tooltip: "Dados atualizados" };
  };

  const status = getStatus();
  const Icon = status.icon;

  const handleClick = () => {
    if (!isFetching && onRefresh) {
      onRefresh();
    }
  };

  const content = (
    <motion.button
      key={status.label}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
      onClick={handleClick}
      disabled={isFetching || !onRefresh || !isOnline}
      className={cn(
        "inline-flex items-center gap-1.5 text-xs transition-colors",
        status.color,
        onRefresh && !isFetching && isOnline && "hover:text-primary cursor-pointer",
        isFetching && "cursor-wait",
        !onRefresh && "cursor-default",
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
    </motion.button>
  );

  if (!onRefresh) {
    return <AnimatePresence mode="wait">{content}</AnimatePresence>;
  }

  return (
    <AnimatePresence mode="wait">
      <Tooltip>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {status.tooltip}
        </TooltipContent>
      </Tooltip>
    </AnimatePresence>
  );
};

export default CacheIndicator;

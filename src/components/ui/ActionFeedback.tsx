import { motion } from "framer-motion";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

type LoadingState = "idle" | "loading" | "success" | "error";

interface ActionFeedbackProps {
  state: LoadingState;
  loadingText?: string;
  successText?: string;
  errorText?: string;
  onReset?: () => void;
  className?: string;
}

const ActionFeedback = ({
  state,
  loadingText = "Processando...",
  successText = "Concluído!",
  errorText = "Algo deu errado",
  onReset,
  className = "",
}: ActionFeedbackProps) => {
  if (state === "idle") return null;

  const content = {
    loading: {
      icon: <Loader2 className="w-5 h-5 animate-spin" />,
      text: loadingText,
      bgClass: "bg-primary/10 text-primary border-primary/20",
    },
    success: {
      icon: <CheckCircle className="w-5 h-5" />,
      text: successText,
      bgClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    },
    error: {
      icon: <XCircle className="w-5 h-5" />,
      text: errorText,
      bgClass: "bg-destructive/10 text-destructive border-destructive/20",
    },
  };

  const current = content[state];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${current.bgClass} ${className}`}
    >
      {current.icon}
      <span className="text-sm font-medium">{current.text}</span>
      
      {(state === "success" || state === "error") && onReset && (
        <button
          onClick={onReset}
          className="ml-auto text-xs underline opacity-70 hover:opacity-100 transition-opacity"
        >
          Fechar
        </button>
      )}
    </motion.div>
  );
};

interface InlineLoaderProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

export const InlineLoader = ({ 
  size = "md", 
  text,
  className = "" 
}: InlineLoaderProps) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <Loader2 className={`${sizeClasses[size]} text-primary`} />
      </motion.div>
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
};

interface PulseLoaderProps {
  className?: string;
}

export const PulseLoader = ({ className = "" }: PulseLoaderProps) => {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-primary"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [1, 0.5, 1],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15,
          }}
        />
      ))}
    </div>
  );
};

interface ProgressLoaderProps {
  progress: number;
  label?: string;
  className?: string;
}

export const ProgressLoader = ({ 
  progress, 
  label,
  className = "" 
}: ProgressLoaderProps) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium text-foreground">{Math.round(progress)}%</span>
        </div>
      )}
      <div className="relative h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
        
        {/* Shimmer effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </div>
    </div>
  );
};

interface ButtonLoadingProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
}

export const ButtonLoading = ({ 
  isLoading, 
  children, 
  loadingText = "Aguarde..." 
}: ButtonLoadingProps) => {
  if (isLoading) {
    return (
      <span className="inline-flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        {loadingText}
      </span>
    );
  }

  return <>{children}</>;
};

export default ActionFeedback;

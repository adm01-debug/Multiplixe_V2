import { motion } from "framer-motion";
import { Zap, TrendingUp, Sparkles } from "lucide-react";

interface XPGainAnimationProps {
  amount: number;
  onComplete?: () => void;
}

const XPGainAnimation = ({ amount, onComplete }: XPGainAnimationProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ 
        opacity: [0, 1, 1, 0], 
        y: [20, -10, -30, -50], 
        scale: [0.8, 1.1, 1, 0.9] 
      }}
      transition={{ 
        duration: 1.5, 
        ease: "easeOut",
        times: [0, 0.2, 0.6, 1]
      }}
      onAnimationComplete={onComplete}
      className="fixed z-50 pointer-events-none flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow-xl shadow-emerald-500/40"
      style={{ 
        left: "50%", 
        top: "50%", 
        transform: "translateX(-50%)" 
      }}
    >
      <Zap className="w-5 h-5" fill="currentColor" />
      <span className="text-lg">+{amount} XP</span>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <Sparkles className="w-4 h-4" />
      </motion.div>
    </motion.div>
  );
};

interface AnimatedXPCounterProps {
  value: number;
  className?: string;
}

export const AnimatedXPCounter = ({ value, className = "" }: AnimatedXPCounterProps) => {
  return (
    <motion.div
      key={value}
      initial={{ scale: 1.2, color: "hsl(var(--primary))" }}
      animate={{ scale: 1, color: "currentColor" }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={`font-bold ${className}`}
    >
      <motion.span
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {value.toLocaleString()}
      </motion.span>
    </motion.div>
  );
};

interface XPProgressRingProps {
  current: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export const XPProgressRing = ({ 
  current, 
  max, 
  size = 80, 
  strokeWidth = 8,
  className = "" 
}: XPProgressRingProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = (current / max) * 100;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#xpGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        
        {/* Gradient definition */}
        <defs>
          <linearGradient id="xpGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--accent))" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
        >
          <Zap className="w-5 h-5 text-primary" />
        </motion.div>
        <span className="text-xs font-bold text-foreground mt-0.5">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
};

interface FloatingBadgeProps {
  icon: React.ReactNode;
  label: string;
  color?: "primary" | "accent" | "warning" | "success";
  className?: string;
}

export const FloatingBadge = ({ 
  icon, 
  label, 
  color = "primary",
  className = "" 
}: FloatingBadgeProps) => {
  const colorClasses = {
    primary: "from-primary to-primary/80 shadow-primary/30",
    accent: "from-accent to-accent/80 shadow-accent/30",
    warning: "from-amber-500 to-orange-500 shadow-amber-500/30",
    success: "from-emerald-500 to-teal-500 shadow-emerald-500/30",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: 10 }}
      animate={{ 
        opacity: 1, 
        scale: 1, 
        y: [0, -4, 0],
      }}
      transition={{
        opacity: { duration: 0.3 },
        scale: { type: "spring", stiffness: 400, damping: 20 },
        y: { duration: 2, repeat: Infinity, ease: "easeInOut" }
      }}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r ${colorClasses[color]} text-white text-xs font-semibold shadow-lg ${className}`}
    >
      {icon}
      {label}
    </motion.div>
  );
};

interface PulsatingIconProps {
  icon: React.ReactNode;
  color?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const PulsatingIcon = ({ 
  icon, 
  color = "primary",
  size = "md",
  className = "" 
}: PulsatingIconProps) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  return (
    <motion.div
      className={`relative ${className}`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Pulsating ring */}
      <motion.div
        className={`absolute inset-0 rounded-full bg-${color}/20`}
        animate={{ 
          scale: [1, 1.4, 1],
          opacity: [0.5, 0, 0.5]
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity, 
          ease: "easeOut" 
        }}
      />
      
      {/* Icon container */}
      <div 
        className={`relative ${sizeClasses[size]} rounded-full bg-gradient-to-br from-${color} to-${color}/80 flex items-center justify-center shadow-lg shadow-${color}/30`}
      >
        {icon}
      </div>
    </motion.div>
  );
};

interface StreakFlameProps {
  streak: number;
  isActive?: boolean;
  size?: "sm" | "md" | "lg";
}

export const StreakFlame = ({ 
  streak, 
  isActive = true,
  size = "md" 
}: StreakFlameProps) => {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  };

  return (
    <motion.div
      className="relative inline-flex items-center gap-1"
      animate={isActive ? {
        scale: [1, 1.05, 1],
      } : {}}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <motion.span
        className={sizeClasses[size]}
        animate={isActive ? {
          rotate: [-5, 5, -5],
          y: [0, -2, 0],
        } : {}}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        🔥
      </motion.span>
      <motion.span
        key={streak}
        initial={{ scale: 1.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`font-bold ${isActive ? "text-orange-500" : "text-muted-foreground"}`}
      >
        {streak}
      </motion.span>
      
      {/* Sparks effect when active */}
      {isActive && (
        <>
          <motion.div
            className="absolute -top-1 left-1/2 w-1 h-1 rounded-full bg-orange-400"
            animate={{
              y: [-10, -20],
              x: [-5, 5],
              opacity: [1, 0],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: 0.2,
            }}
          />
          <motion.div
            className="absolute -top-1 left-1/2 w-1 h-1 rounded-full bg-yellow-400"
            animate={{
              y: [-10, -25],
              x: [5, -5],
              opacity: [1, 0],
            }}
            transition={{
              duration: 0.9,
              repeat: Infinity,
              delay: 0.4,
            }}
          />
        </>
      )}
    </motion.div>
  );
};

export default XPGainAnimation;

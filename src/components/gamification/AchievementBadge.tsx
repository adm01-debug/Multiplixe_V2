import { motion } from "framer-motion";
import { Star, Lock, Sparkles, CheckCircle } from "lucide-react";

interface AchievementBadgeProps {
  name: string;
  icon: string;
  gradient: string;
  isUnlocked: boolean;
  xpReward: number;
  description?: string;
  onClick?: () => void;
}

const AchievementBadge = ({
  name,
  icon,
  gradient,
  isUnlocked,
  xpReward,
  description,
  onClick,
}: AchievementBadgeProps) => {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.05, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={`relative cursor-pointer group`}
    >
      {/* Glow effect for unlocked */}
      {isUnlocked && (
        <motion.div
          className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradient} blur-xl opacity-30`}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Main badge container */}
      <div
        className={`relative p-4 rounded-2xl border transition-all duration-300 ${
          isUnlocked
            ? `bg-gradient-to-br ${gradient} border-white/20 shadow-lg`
            : "bg-muted/50 border-border/50 grayscale"
        }`}
      >
        {/* Lock overlay for locked achievements */}
        {!isUnlocked && (
          <div className="absolute inset-0 rounded-2xl bg-background/60 backdrop-blur-[2px] flex items-center justify-center z-10">
            <motion.div
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Lock className="w-6 h-6 text-muted-foreground" />
            </motion.div>
          </div>
        )}

        {/* Badge content */}
        <div className="relative z-0">
          {/* Icon */}
          <div className="flex items-center justify-center mb-2">
            <motion.span
              className="text-3xl"
              animate={isUnlocked ? { 
                rotate: [0, -5, 5, 0],
                scale: [1, 1.1, 1],
              } : {}}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
              }}
            >
              {icon}
            </motion.span>
          </div>

          {/* Name */}
          <p
            className={`text-sm font-semibold text-center line-clamp-1 ${
              isUnlocked ? "text-white" : "text-muted-foreground"
            }`}
          >
            {name}
          </p>

          {/* XP reward */}
          <div className="flex items-center justify-center gap-1 mt-1">
            <Star
              className={`w-3 h-3 ${
                isUnlocked ? "text-yellow-300" : "text-muted-foreground"
              }`}
              fill={isUnlocked ? "currentColor" : "none"}
            />
            <span
              className={`text-xs font-medium ${
                isUnlocked ? "text-white/80" : "text-muted-foreground"
              }`}
            >
              {xpReward} XP
            </span>
          </div>
        </div>

        {/* Unlocked checkmark */}
        {isUnlocked && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg"
          >
            <CheckCircle className="w-4 h-4 text-white" />
          </motion.div>
        )}

        {/* Shimmer effect on hover */}
        <motion.div
          className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
          />
        </motion.div>
      </div>

      {/* Tooltip on hover */}
      {description && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          whileHover={{ opacity: 1, y: 0, scale: 1 }}
          className="absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 rounded-xl bg-popover border border-border shadow-xl text-xs max-w-[200px] pointer-events-none"
        >
          <p className="text-foreground font-medium mb-1">{name}</p>
          <p className="text-muted-foreground">{description}</p>
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-2 h-2 bg-popover border-r border-b border-border rotate-45 -mt-1" />
        </motion.div>
      )}
    </motion.div>
  );
};

interface AchievementProgressProps {
  current: number;
  target: number;
  label: string;
  gradient?: string;
}

export const AchievementProgress = ({
  current,
  target,
  label,
  gradient = "from-primary to-accent",
}: AchievementProgressProps) => {
  const progress = Math.min((current / target) * 100, 100);
  const isComplete = current >= target;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-semibold ${isComplete ? "text-emerald-500" : "text-foreground"}`}>
          {current} / {target}
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${gradient}`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        
        {/* Shimmer on progress bar */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
        />
        
        {/* Completion sparkle */}
        {isComplete && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute right-0 top-1/2 -translate-y-1/2"
          >
            <Sparkles className="w-4 h-4 text-yellow-400" />
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AchievementBadge;

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shimmer?: boolean;
}

function Skeleton({ className, shimmer = true, ...props }: SkeletonProps) {
  return (
    <div 
      className={cn(
        "relative rounded-md bg-muted overflow-hidden",
        shimmer && "animate-pulse",
        className
      )} 
      {...props}
    >
      {shimmer && (
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite]">
          <div className="h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
      )}
    </div>
  );
}

// Shimmer overlay for custom skeleton layouts
function ShimmerOverlay({ className }: { className?: string }) {
  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      <motion.div
        className="absolute inset-0 -translate-x-full"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)"
        }}
        animate={{ translateX: ["-100%", "100%"] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.5 }}
      />
    </div>
  );
}

// Wave skeleton with sequential delay animations
function WaveSkeleton({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      className={cn("relative overflow-hidden rounded-md bg-muted", className)}
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay }}
    >
      <ShimmerOverlay />
    </motion.div>
  );
}

export { Skeleton, ShimmerOverlay, WaveSkeleton };

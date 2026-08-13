import { motion, HTMLMotionProps, Variants } from "framer-motion";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

// Animation Variants
export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
};

export const slideInLeft: Variants = {
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 30 },
};

export const slideInRight: Variants = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
};

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

// Hover animations
export const hoverScale = {
  scale: 1.02,
  transition: { duration: 0.2 },
};

export const hoverLift = {
  y: -4,
  transition: { duration: 0.2 },
};

export const tapScale = {
  scale: 0.98,
};

// Motion Components

interface MotionDivProps extends HTMLMotionProps<"div"> {
  className?: string;
}

export const MotionDiv = forwardRef<HTMLDivElement, MotionDivProps>(
  ({ className, ...props }, ref) => (
    <motion.div ref={ref} className={cn(className)} {...props} />
  )
);
MotionDiv.displayName = "MotionDiv";

// FadeIn Component
interface FadeInProps extends HTMLMotionProps<"div"> {
  delay?: number;
  duration?: number;
  className?: string;
}

export const FadeIn = forwardRef<HTMLDivElement, FadeInProps>(
  ({ delay = 0, duration = 0.4, className, children, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration, delay, ease: "easeOut" }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  )
);
FadeIn.displayName = "FadeIn";

// Scale component
interface ScaleInProps extends HTMLMotionProps<"div"> {
  delay?: number;
  duration?: number;
  className?: string;
}

export const ScaleIn = forwardRef<HTMLDivElement, ScaleInProps>(
  ({ delay = 0, duration = 0.3, className, children, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration, delay, ease: "easeOut" }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  )
);
ScaleIn.displayName = "ScaleIn";

// SlideIn Component
interface SlideInProps extends HTMLMotionProps<"div"> {
  direction?: "left" | "right" | "up" | "down";
  delay?: number;
  duration?: number;
  className?: string;
}

export const SlideIn = forwardRef<HTMLDivElement, SlideInProps>(
  ({ direction = "left", delay = 0, duration = 0.4, className, children, ...props }, ref) => {
    const directionMap = {
      left: { x: -30, y: 0 },
      right: { x: 30, y: 0 },
      up: { x: 0, y: 30 },
      down: { x: 0, y: -30 },
    };
    
    const offset = directionMap[direction];
    
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, ...offset }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        exit={{ opacity: 0, ...offset }}
        transition={{ duration, delay, ease: "easeOut" }}
        className={cn(className)}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
SlideIn.displayName = "SlideIn";

// Stagger Container
interface StaggerContainerProps extends HTMLMotionProps<"div"> {
  staggerDelay?: number;
  className?: string;
}

export const StaggerContainer = forwardRef<HTMLDivElement, StaggerContainerProps>(
  ({ staggerDelay = 0.1, className, children, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={{
        initial: {},
        animate: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  )
);
StaggerContainer.displayName = "StaggerContainer";

// Stagger Item
export const StaggerItem = forwardRef<HTMLDivElement, HTMLMotionProps<"div">>(
  ({ className, children, ...props }, ref) => (
    <motion.div
      ref={ref}
      variants={staggerItem}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  )
);
StaggerItem.displayName = "StaggerItem";

// Hover Card
interface HoverCardProps extends HTMLMotionProps<"div"> {
  hoverEffect?: "scale" | "lift" | "both";
  className?: string;
}

export const HoverCard = forwardRef<HTMLDivElement, HoverCardProps>(
  ({ hoverEffect = "both", className, children, ...props }, ref) => {
    const whileHover = 
      hoverEffect === "scale" ? hoverScale :
      hoverEffect === "lift" ? hoverLift :
      { ...hoverScale, ...hoverLift };

    return (
      <motion.div
        ref={ref}
        whileHover={whileHover}
        whileTap={tapScale}
        className={cn(className)}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
HoverCard.displayName = "HoverCard";

// Pulse Animation
export const PulseAnimation = forwardRef<HTMLDivElement, HTMLMotionProps<"div">>(
  ({ className, children, ...props }, ref) => (
    <motion.div
      ref={ref}
      animate={{
        scale: [1, 1.05, 1],
        opacity: [1, 0.8, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  )
);
PulseAnimation.displayName = "PulseAnimation";

// Float Animation
export const FloatAnimation = forwardRef<HTMLDivElement, HTMLMotionProps<"div"> & { delay?: number }>(
  ({ className, children, delay = 0, ...props }, ref) => (
    <motion.div
      ref={ref}
      animate={{
        y: [-5, 5, -5],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  )
);
FloatAnimation.displayName = "FloatAnimation";

// Shimmer effect for loading states
export const ShimmerEffect = ({ className }: { className?: string }) => (
  <div className={cn("relative overflow-hidden", className)}>
    <motion.div
      className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
      animate={{ x: ["0%", "200%"] }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  </div>
);

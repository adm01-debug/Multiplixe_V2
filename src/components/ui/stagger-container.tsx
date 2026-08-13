import * as React from "react";
import { motion, Variants, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

// Enhanced stagger animation variants
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const staggerItemVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 24,
    scale: 0.96,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
    },
  },
};

// Faster stagger for smaller items
export const fastStaggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

export const fastStaggerItemVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 16,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
};

// Slide-in stagger (from left)
export const slideInContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.15,
    },
  },
};

export const slideInItemVariants: Variants = {
  hidden: { 
    opacity: 0, 
    x: -30,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20,
    },
  },
};

// Scale-up stagger (for grid items)
export const scaleUpContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.1,
    },
  },
};

export const scaleUpItemVariants: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.85,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 280,
      damping: 22,
    },
  },
};

// Pop-in stagger (bouncy effect)
export const popInContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.08,
    },
  },
};

export const popInItemVariants: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.6,
    y: 30,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 15,
      mass: 0.8,
    },
  },
};

interface StaggerContainerProps extends Omit<HTMLMotionProps<"div">, "variants"> {
  variant?: "default" | "fast" | "slide" | "scale" | "pop";
  viewportOnce?: boolean;
  viewportMargin?: string;
  children: React.ReactNode;
}

interface StaggerItemProps extends Omit<HTMLMotionProps<"div">, "variants"> {
  variant?: "default" | "fast" | "slide" | "scale" | "pop";
  children: React.ReactNode;
}

const containerVariantsMap = {
  default: staggerContainerVariants,
  fast: fastStaggerContainerVariants,
  slide: slideInContainerVariants,
  scale: scaleUpContainerVariants,
  pop: popInContainerVariants,
};

const itemVariantsMap = {
  default: staggerItemVariants,
  fast: fastStaggerItemVariants,
  slide: slideInItemVariants,
  scale: scaleUpItemVariants,
  pop: popInItemVariants,
};

export const StaggerContainer = React.forwardRef<HTMLDivElement, StaggerContainerProps>(
  ({ 
    className, 
    variant = "default", 
    viewportOnce = true, 
    viewportMargin = "-50px",
    children, 
    ...props 
  }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(className)}
        variants={containerVariantsMap[variant]}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: viewportOnce, margin: viewportMargin }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
StaggerContainer.displayName = "StaggerContainer";

export const StaggerItem = React.forwardRef<HTMLDivElement, StaggerItemProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(className)}
        variants={itemVariantsMap[variant]}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
StaggerItem.displayName = "StaggerItem";

// Animated list component for common use cases
interface AnimatedListProps {
  items: React.ReactNode[];
  variant?: "default" | "fast" | "slide" | "scale" | "pop";
  className?: string;
  itemClassName?: string;
  viewportOnce?: boolean;
}

export const AnimatedList: React.FC<AnimatedListProps> = ({
  items,
  variant = "default",
  className,
  itemClassName,
  viewportOnce = true,
}) => {
  return (
    <StaggerContainer 
      variant={variant} 
      className={className}
      viewportOnce={viewportOnce}
    >
      {items.map((item, index) => (
        <StaggerItem 
          key={index} 
          variant={variant}
          className={itemClassName}
        >
          {item}
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
};

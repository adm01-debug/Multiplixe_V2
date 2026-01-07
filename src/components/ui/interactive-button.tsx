import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, HTMLMotionProps } from "framer-motion";

import { cn } from "@/lib/utils";

const interactiveButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 select-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30",
        destructive: "bg-destructive text-destructive-foreground shadow-lg shadow-destructive/25 hover:shadow-xl hover:shadow-destructive/30",
        outline: "border-2 border-primary/50 bg-background hover:bg-primary/5 hover:border-primary text-primary",
        secondary: "bg-secondary text-secondary-foreground shadow-md hover:shadow-lg",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        glow: "bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/40 hover:shadow-xl hover:shadow-primary/50",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        xl: "h-14 px-10 text-lg",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface InteractiveButtonProps
  extends Omit<HTMLMotionProps<"button">, "children">,
    VariantProps<typeof interactiveButtonVariants> {
  asChild?: boolean;
  children?: React.ReactNode;
  enableHaptic?: boolean;
}

const InteractiveButton = React.forwardRef<HTMLButtonElement, InteractiveButtonProps>(
  ({ className, variant, size, asChild = false, enableHaptic = true, children, ...props }, ref) => {
    
    // Haptic feedback for mobile devices
    const handleTap = React.useCallback(() => {
      if (enableHaptic && 'vibrate' in navigator) {
        navigator.vibrate(10);
      }
    }, [enableHaptic]);

    if (asChild) {
      return (
        <Slot 
          className={cn(interactiveButtonVariants({ variant, size, className }))} 
          ref={ref as React.Ref<HTMLElement>}
        >
          {children}
        </Slot>
      );
    }

    return (
      <motion.button
        className={cn(interactiveButtonVariants({ variant, size, className }))}
        ref={ref}
        whileHover={{ 
          scale: 1.02,
          transition: { duration: 0.2, ease: "easeOut" }
        }}
        whileTap={{ 
          scale: 0.97,
          transition: { duration: 0.1, ease: "easeIn" }
        }}
        onTap={handleTap}
        {...props}
      >
        {children}
      </motion.button>
    );
  },
);
InteractiveButton.displayName = "InteractiveButton";

export { InteractiveButton, interactiveButtonVariants };
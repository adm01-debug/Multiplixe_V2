import { useState, useEffect, memo } from "react";

interface CountUpProps {
  target: number;
}

const CountUp = memo(({ target }: CountUpProps) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const duration = 1500;
    const startTime = Date.now();
    const startDelay = 800;
    
    const timeout = setTimeout(() => {
      const animate = () => {
        const elapsed = Date.now() - startTime - startDelay;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        setCount(Math.floor(easeOut * target));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    }, startDelay);
    
    return () => clearTimeout(timeout);
  }, [target]);
  
  return <>{count}</>;
});

CountUp.displayName = "CountUp";

export default CountUp;

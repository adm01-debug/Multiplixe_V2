import { useState, useRef, useEffect, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface LazyComponentProps {
  children: ReactNode;
  placeholder?: ReactNode;
  className?: string;
  threshold?: number;
  rootMargin?: string;
}

const LazyComponent = ({
  children,
  placeholder,
  className,
  threshold = 0.1,
  rootMargin = '50px',
}: LazyComponentProps) => {
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  const defaultPlaceholder = (
    <div className="w-full h-32 bg-muted/30 animate-pulse rounded-lg" />
  );

  return (
    <div ref={containerRef} className={cn(className)}>
      {isInView ? children : (placeholder || defaultPlaceholder)}
    </div>
  );
};

export default LazyComponent;

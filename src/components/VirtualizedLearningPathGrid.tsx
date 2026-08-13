import { useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion } from 'framer-motion';
import { LearningPathCard } from '@/components/learning-paths/LearningPathCard';
import { LearningPath, UserLearningPathProgress } from '@/hooks/useLearningPaths';

interface VirtualizedLearningPathGridProps {
  learningPaths: LearningPath[];
  userProgress: Record<string, UserLearningPathProgress>;
  columns?: number;
  gap?: number;
  estimatedCardHeight?: number;
}

const VirtualizedLearningPathGrid = ({ 
  learningPaths, 
  userProgress,
  columns = 3,
  gap = 24,
  estimatedCardHeight = 380
}: VirtualizedLearningPathGridProps) => {
  const parentRef = useRef<HTMLDivElement>(null);

  // Dividir trilhas em linhas baseado no número de colunas
  const rows = useMemo(() => {
    const result: LearningPath[][] = [];
    for (let i = 0; i < learningPaths.length; i += columns) {
      result.push(learningPaths.slice(i, i + columns));
    }
    return result;
  }, [learningPaths, columns]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimatedCardHeight + gap,
    overscan: 2,
  });

  const items = virtualizer.getVirtualItems();

  return (
    <div 
      ref={parentRef} 
      className="h-[calc(100vh-400px)] overflow-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
      style={{ contain: 'strict' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {items.map((virtualRow) => {
          const rowPaths = rows[virtualRow.index];
          
          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div 
                className="grid gap-6"
                style={{ 
                  gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                }}
              >
                {rowPaths.map((path, colIndex) => (
                  <motion.div
                    key={path.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      duration: 0.3, 
                      delay: colIndex * 0.05,
                      ease: 'easeOut'
                    }}
                  >
                    <LearningPathCard
                      learningPath={path}
                      progress={userProgress[path.id]}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VirtualizedLearningPathGrid;

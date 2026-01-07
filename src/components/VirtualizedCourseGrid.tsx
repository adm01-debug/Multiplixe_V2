import { useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion } from 'framer-motion';
import CourseCard from '@/components/catalog/CourseCard';

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  duration_minutes: number;
  level: string;
  instructor_name: string | null;
  total_lessons: number;
  is_featured: boolean;
  categories?: {
    name: string;
    color: string | null;
  } | null;
  progress?: number;
}

interface VirtualizedCourseGridProps {
  courses: Course[];
  columns?: number;
  gap?: number;
  estimatedCardHeight?: number;
}

const VirtualizedCourseGrid = ({ 
  courses, 
  columns = 4,
  gap = 24,
  estimatedCardHeight = 420
}: VirtualizedCourseGridProps) => {
  const parentRef = useRef<HTMLDivElement>(null);

  // Dividir cursos em linhas baseado no número de colunas
  const rows = useMemo(() => {
    const result: Course[][] = [];
    for (let i = 0; i < courses.length; i += columns) {
      result.push(courses.slice(i, i + columns));
    }
    return result;
  }, [courses, columns]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimatedCardHeight + gap,
    overscan: 2, // Renderizar 2 linhas extras acima e abaixo
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
          const rowCourses = rows[virtualRow.index];
          
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
                {rowCourses.map((course, colIndex) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      duration: 0.3, 
                      delay: colIndex * 0.05,
                      ease: 'easeOut'
                    }}
                  >
                    <CourseCard
                      id={course.id}
                      slug={course.slug}
                      title={course.title}
                      description={course.description}
                      thumbnailUrl={course.thumbnail_url}
                      durationMinutes={course.duration_minutes}
                      level={course.level}
                      instructorName={course.instructor_name}
                      totalLessons={course.total_lessons}
                      categoryName={course.categories?.name}
                      categoryColor={course.categories?.color || undefined}
                      isFeatured={course.is_featured}
                      progress={course.progress}
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

export default VirtualizedCourseGrid;

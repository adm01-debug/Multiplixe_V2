import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";

// Efeito shimmer otimizado com gradiente animado
const ShimmerOverlay = () => (
  <motion.div
    className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
    animate={{ translateX: ["−100%", "100%"] }}
    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
  />
);

// Animação de entrada staggered
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.3, ease: "easeOut" }
  }
};

// Course Card Skeleton otimizado - simula o layout real
export const CourseCardSkeleton = () => (
  <motion.div 
    className="relative rounded-3xl bg-card/50 border border-border/50 overflow-hidden"
    variants={itemVariants}
  >
    {/* Thumbnail area */}
    <div className="relative aspect-[16/10] overflow-hidden">
      <Skeleton className="absolute inset-0 w-full h-full" />
      {/* Decorative blur circles */}
      <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-primary/5 blur-xl" />
      <div className="absolute bottom-4 left-4 w-12 h-12 rounded-full bg-accent/5 blur-xl" />
      <ShimmerOverlay />
    </div>
    
    {/* Content area */}
    <div className="p-5 space-y-4">
      {/* Title */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-[85%]" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[60%]" />
      </div>
      
      {/* Meta badges */}
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-7 w-[72px] rounded-full" />
        <Skeleton className="h-7 w-[68px] rounded-full" />
        <Skeleton className="h-7 w-[88px] rounded-full" />
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border/30">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  </motion.div>
);

// Course Grid Skeleton otimizado com stagger rápido
export const CourseGridSkeleton = ({ count = 8 }: { count?: number }) => (
  <motion.div 
    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
    initial="hidden"
    animate="visible"
    variants={containerVariants}
  >
    {[...Array(count)].map((_, i) => (
      <CourseCardSkeleton key={i} />
    ))}
  </motion.div>
);

// Dashboard Stats Skeleton with pulse animation
export const DashboardStatsSkeleton = () => (
  <motion.div 
    className="grid grid-cols-2 lg:grid-cols-4 gap-4"
    initial="hidden"
    animate="visible"
    variants={{
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
      }
    }}
  >
    {[...Array(4)].map((_, i) => (
      <motion.div 
        key={i} 
        className="p-6 rounded-2xl bg-card border border-border/50"
        variants={{
          hidden: { opacity: 0, scale: 0.9 },
          visible: { opacity: 1, scale: 1 }
        }}
      >
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </motion.div>
    ))}
  </motion.div>
);

// Learning Path Card Skeleton otimizado
export const LearningPathCardSkeleton = () => (
  <motion.div 
    className="relative rounded-2xl bg-card/50 border border-border/50 overflow-hidden"
    variants={itemVariants}
  >
    {/* Thumbnail */}
    <div className="relative aspect-video overflow-hidden">
      <Skeleton className="absolute inset-0 w-full h-full" />
      <div className="absolute top-3 left-3">
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <ShimmerOverlay />
    </div>
    
    {/* Content */}
    <div className="p-4 space-y-3">
      {/* Badge */}
      <Skeleton className="h-5 w-24 rounded-full" />
      
      {/* Title & description */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-[90%]" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[70%]" />
      </div>
      
      {/* Meta info */}
      <div className="flex items-center gap-4 pt-1">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-14" />
      </div>
    </div>
    
    {/* Footer */}
    <div className="border-t border-border/50 px-4 py-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded" />
      </div>
    </div>
  </motion.div>
);

// Learning Path Grid Skeleton otimizado
export const LearningPathGridSkeleton = ({ count = 6 }: { count?: number }) => (
  <motion.div 
    className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
    initial="hidden"
    animate="visible"
    variants={containerVariants}
  >
    {[...Array(count)].map((_, i) => (
      <LearningPathCardSkeleton key={i} />
    ))}
  </motion.div>
);

// Hero Section Skeleton
export const HeroSkeleton = () => (
  <motion.div 
    className="relative p-8 md:p-12 rounded-[2rem] overflow-hidden bg-gradient-to-br from-primary/5 to-accent/5 border border-border/30"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
  >
    <div className="space-y-6">
      <Skeleton className="h-8 w-40 rounded-full" />
      <Skeleton className="h-12 w-3/4" />
      <Skeleton className="h-6 w-1/2" />
      <div className="flex gap-4 mt-6">
        <Skeleton className="h-16 w-40 rounded-2xl" />
        <Skeleton className="h-16 w-40 rounded-2xl" />
      </div>
    </div>
  </motion.div>
);

// Daily Challenge Skeleton
export const DailyChallengeSkeleton = () => (
  <motion.div 
    className="p-4 rounded-xl bg-card border border-border/50"
    variants={itemVariants}
  >
    <div className="flex items-center gap-4">
      <Skeleton className="h-12 w-12 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-3 w-48" />
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
      <Skeleton className="h-8 w-16 rounded-lg" />
    </div>
  </motion.div>
);

// Streak Display Skeleton
export const StreakSkeleton = () => (
  <motion.div 
    className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50"
    variants={itemVariants}
  >
    <Skeleton className="h-14 w-14 rounded-xl" />
    <div className="space-y-2">
      <Skeleton className="h-6 w-20" />
      <Skeleton className="h-4 w-32" />
    </div>
  </motion.div>
);

// XP Chart Skeleton
export const XPChartSkeleton = () => (
  <motion.div 
    className="p-6 rounded-2xl bg-card border border-border/50"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
  >
    <Skeleton className="h-6 w-40 mb-4" />
    <div className="h-64 flex items-end justify-between gap-2">
      {[...Array(7)].map((_, i) => (
        <Skeleton 
          key={i} 
          className="flex-1 rounded-t-lg" 
          style={{ height: `${30 + Math.random() * 60}%` }}
        />
      ))}
    </div>
    <div className="flex justify-between mt-4">
      {[...Array(7)].map((_, i) => (
        <Skeleton key={i} className="h-3 w-8" />
      ))}
    </div>
  </motion.div>
);

// Profile Skeleton
export const ProfileSkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-6">
      <Skeleton className="h-24 w-24 rounded-2xl" />
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
    <div className="grid grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="p-4 rounded-xl bg-muted/50">
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  </div>
);

// Leaderboard Skeleton
export const LeaderboardSkeleton = () => (
  <div className="space-y-4">
    {[...Array(10)].map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-6 w-20" />
      </div>
    ))}
  </div>
);

// Certificate Card Skeleton
export const CertificateCardSkeleton = () => (
  <div className="p-6 rounded-2xl bg-card border border-border/50 space-y-4">
    <div className="flex items-start justify-between">
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-12 w-12 rounded-xl" />
    </div>
    <Skeleton className="h-10 w-full rounded-lg" />
  </div>
);

// Achievement Card Skeleton
export const AchievementCardSkeleton = () => (
  <div className="p-4 rounded-xl bg-muted/50 space-y-3">
    <div className="flex items-center gap-3">
      <Skeleton className="h-12 w-12 rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  </div>
);

// Achievements Grid Skeleton
export const AchievementsGridSkeleton = ({ count = 8 }: { count?: number }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {[...Array(count)].map((_, i) => (
      <AchievementCardSkeleton key={i} />
    ))}
  </div>
);

// Table Skeleton
export const TableSkeleton = ({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) => (
  <div className="border border-border rounded-lg overflow-hidden">
    <div className="bg-muted/50 p-4 flex gap-4">
      {[...Array(cols)].map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="p-4 flex gap-4 border-t border-border">
        {[...Array(cols)].map((_, j) => (
          <Skeleton key={j} className="h-4 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

// Discussion Thread Skeleton
export const DiscussionThreadSkeleton = () => (
  <div className="space-y-4">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="p-4 rounded-xl bg-card border border-border/50 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex gap-3 pt-2">
          <Skeleton className="h-8 w-16 rounded-lg" />
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
      </div>
    ))}
  </div>
);

// Quiz Skeleton
export const QuizSkeleton = () => (
  <div className="space-y-6 max-w-2xl mx-auto">
    <Skeleton className="h-8 w-3/4 mx-auto" />
    <Skeleton className="h-4 w-1/2 mx-auto" />
    <div className="space-y-4 mt-8">
      <Skeleton className="h-6 w-full" />
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </div>
    <div className="flex justify-between pt-4">
      <Skeleton className="h-10 w-24 rounded-lg" />
      <Skeleton className="h-10 w-24 rounded-lg" />
    </div>
  </div>
);

// Video Player Skeleton
export const VideoPlayerSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="aspect-video w-full rounded-2xl" />
    <div className="flex items-center gap-4">
      <Skeleton className="h-10 w-10 rounded-full" />
      <Skeleton className="h-2 flex-1 rounded-full" />
      <Skeleton className="h-4 w-16" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  </div>
);

// Notification List Skeleton
export const NotificationListSkeleton = () => (
  <div className="space-y-2">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-start gap-3 p-3 rounded-lg">
        <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

// Chart Skeleton
export const ChartSkeleton = ({ height = 300 }: { height?: number }) => (
  <div className="w-full rounded-xl bg-muted/30 border border-border/50 p-4" style={{ height }}>
    <div className="flex items-end justify-between h-full gap-4 pb-8">
      {[...Array(7)].map((_, i) => (
        <div key={i} className="flex-1 flex flex-col justify-end">
          <Skeleton 
            className="w-full rounded-t-lg" 
            style={{ height: `${30 + Math.random() * 50}%` }} 
          />
        </div>
      ))}
    </div>
    <div className="flex justify-between pt-2">
      {[...Array(7)].map((_, i) => (
        <Skeleton key={i} className="h-3 w-8" />
      ))}
    </div>
  </div>
);

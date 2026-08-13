import { Skeleton, ShimmerOverlay, WaveSkeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { cn } from "@/lib/utils";

// Efeito de pulso suave para elementos importantes
const PulseGlow = ({ color = "primary" }: { color?: string }) => (
  <motion.div
    className={cn(
      "absolute inset-0 rounded-inherit opacity-0",
      color === "primary" && "bg-primary/10",
      color === "accent" && "bg-accent/10",
      color === "emerald" && "bg-emerald-500/10"
    )}
    animate={{ opacity: [0, 0.5, 0] }}
    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
  />
);

// Animação de entrada staggered otimizada
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.96 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
  }
};

// Variante para cards com efeito de elevação
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.94 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      duration: 0.5, 
      ease: [0.25, 0.46, 0.45, 0.94],
      opacity: { duration: 0.3 }
    }
  }
};

// Course Card Skeleton avançado - simula o layout real com animações ricas
export const CourseCardSkeleton = ({ index = 0 }: { index?: number }) => (
  <motion.div 
    className="relative rounded-3xl bg-card/50 border border-border/50 overflow-hidden backdrop-blur-sm"
    variants={cardVariants}
    custom={index}
  >
    {/* Thumbnail area com animação */}
    <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-muted to-muted/50">
      <ShimmerOverlay />
      
      {/* Decorative animated blur circles */}
      <motion.div 
        className="absolute top-4 right-4 w-20 h-20 rounded-full bg-primary/10 blur-2xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute bottom-4 left-4 w-16 h-16 rounded-full bg-accent/10 blur-xl"
        animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />
      
      {/* Badge placeholder com pulso */}
      <motion.div 
        className="absolute top-4 left-4"
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <Skeleton className="h-6 w-20 rounded-full" />
      </motion.div>
      
      {/* Play button skeleton */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="w-14 h-14 rounded-full bg-background/30 backdrop-blur-sm"
          animate={{ scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
    
    {/* Content area com animações sequenciais */}
    <div className="p-5 space-y-4">
      {/* Title com efeito de onda */}
      <div className="space-y-2">
        <WaveSkeleton className="h-5 w-[85%]" delay={0} />
        <WaveSkeleton className="h-4 w-full" delay={0.1} />
        <WaveSkeleton className="h-4 w-[60%]" delay={0.2} />
      </div>
      
      {/* Meta badges com animação staggered */}
      <div className="flex flex-wrap gap-2">
        <WaveSkeleton className="h-7 w-[72px] rounded-full" delay={0.3} />
        <WaveSkeleton className="h-7 w-[68px] rounded-full" delay={0.35} />
        <WaveSkeleton className="h-7 w-[88px] rounded-full" delay={0.4} />
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border/30">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
          >
            <Skeleton className="h-8 w-8 rounded-full" />
          </motion.div>
          <WaveSkeleton className="h-4 w-24" delay={0.5} />
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
      <CourseCardSkeleton key={i} index={i} />
    ))}
  </motion.div>
);

// Dashboard Stats Skeleton com animações individuais
export const DashboardStatsSkeleton = () => (
  <motion.div 
    className="grid grid-cols-2 lg:grid-cols-4 gap-4"
    initial="hidden"
    animate="visible"
    variants={{
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { staggerChildren: 0.12 }
      }
    }}
  >
    {[...Array(4)].map((_, i) => (
      <motion.div 
        key={i} 
        className="relative p-6 rounded-2xl bg-card border border-border/50 overflow-hidden"
        variants={{
          hidden: { opacity: 0, scale: 0.9, y: 20 },
          visible: { 
            opacity: 1, 
            scale: 1, 
            y: 0,
            transition: { duration: 0.4, ease: "easeOut" }
          }
        }}
      >
        <ShimmerOverlay />
        <div className="flex items-center gap-4">
          <motion.div
            animate={{ 
              boxShadow: [
                "0 0 0 0 rgba(var(--primary), 0)",
                "0 0 20px 4px rgba(var(--primary), 0.1)",
                "0 0 0 0 rgba(var(--primary), 0)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Skeleton className="h-12 w-12 rounded-xl" />
          </motion.div>
          <div className="space-y-2">
            <WaveSkeleton className="h-6 w-16" delay={i * 0.1} />
            <WaveSkeleton className="h-4 w-24" delay={i * 0.1 + 0.1} />
          </div>
        </div>
      </motion.div>
    ))}
  </motion.div>
);

// Learning Path Card Skeleton avançado
export const LearningPathCardSkeleton = ({ index = 0 }: { index?: number }) => (
  <motion.div 
    className="relative rounded-2xl bg-card/50 border border-border/50 overflow-hidden backdrop-blur-sm"
    variants={cardVariants}
    custom={index}
  >
    {/* Thumbnail com animações */}
    <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-muted to-muted/50">
      <ShimmerOverlay />
      
      {/* Animated glow effect */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Badge placeholder */}
      <motion.div 
        className="absolute top-3 left-3"
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <Skeleton className="h-6 w-20 rounded-full" />
      </motion.div>
      
      {/* Trophy icon placeholder */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="w-16 h-16 rounded-full bg-background/20 backdrop-blur-sm"
          animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
    
    {/* Content com animações sequenciais */}
    <div className="p-4 space-y-3">
      {/* Badge */}
      <WaveSkeleton className="h-5 w-24 rounded-full" delay={0.1} />
      
      {/* Title & description */}
      <div className="space-y-2">
        <WaveSkeleton className="h-5 w-[90%]" delay={0.2} />
        <WaveSkeleton className="h-4 w-full" delay={0.25} />
        <WaveSkeleton className="h-4 w-[70%]" delay={0.3} />
      </div>
      
      {/* Meta info */}
      <div className="flex items-center gap-4 pt-1">
        <WaveSkeleton className="h-4 w-16" delay={0.35} />
        <WaveSkeleton className="h-4 w-12" delay={0.4} />
        <WaveSkeleton className="h-4 w-14" delay={0.45} />
      </div>
    </div>
    
    {/* Footer */}
    <div className="border-t border-border/50 px-4 py-3">
      <div className="flex items-center justify-between">
        <WaveSkeleton className="h-4 w-24" delay={0.5} />
        <motion.div
          animate={{ x: [0, 4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Skeleton className="h-4 w-4 rounded" />
        </motion.div>
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
      <LearningPathCardSkeleton key={i} index={i} />
    ))}
  </motion.div>
);

// Hero Section Skeleton avançado
export const HeroSkeleton = () => (
  <motion.div 
    className="relative p-8 md:p-12 rounded-[2rem] overflow-hidden bg-gradient-to-br from-primary/5 to-accent/5 border border-border/30"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <ShimmerOverlay />
    
    {/* Animated background glow */}
    <motion.div 
      className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-primary/10 blur-3xl"
      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.div 
      className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-accent/10 blur-2xl"
      animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
    />
    
    <div className="relative space-y-6">
      <WaveSkeleton className="h-8 w-40 rounded-full" delay={0} />
      <WaveSkeleton className="h-12 w-3/4 rounded-lg" delay={0.1} />
      <WaveSkeleton className="h-6 w-1/2 rounded-lg" delay={0.2} />
      <div className="flex gap-4 mt-6">
        <motion.div
          animate={{ scale: [0.98, 1.02, 0.98] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Skeleton className="h-16 w-40 rounded-2xl" />
        </motion.div>
        <motion.div
          animate={{ scale: [0.98, 1.02, 0.98] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
        >
          <Skeleton className="h-16 w-40 rounded-2xl" />
        </motion.div>
      </div>
    </div>
  </motion.div>
);

// Daily Challenge Skeleton avançado
export const DailyChallengeSkeleton = () => (
  <motion.div 
    className="relative p-4 rounded-xl bg-card border border-border/50 overflow-hidden"
    variants={itemVariants}
  >
    <ShimmerOverlay />
    <div className="flex items-center gap-4">
      <motion.div
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <Skeleton className="h-12 w-12 rounded-xl" />
      </motion.div>
      <div className="flex-1 space-y-2">
        <WaveSkeleton className="h-5 w-32" delay={0.1} />
        <WaveSkeleton className="h-3 w-48" delay={0.2} />
        <motion.div 
          className="relative h-2 w-full rounded-full bg-muted overflow-hidden"
          initial={{ opacity: 0.5 }}
        >
          <motion.div
            className="absolute inset-y-0 left-0 bg-primary/30 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: ["0%", "60%", "0%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </div>
      <WaveSkeleton className="h-8 w-16 rounded-lg" delay={0.3} />
    </div>
  </motion.div>
);

// Streak Display Skeleton avançado
export const StreakSkeleton = () => (
  <motion.div 
    className="relative flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50 overflow-hidden"
    variants={itemVariants}
  >
    <ShimmerOverlay />
    <motion.div
      className="relative"
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
    >
      <Skeleton className="h-14 w-14 rounded-xl" />
      <motion.div
        className="absolute -inset-1 rounded-xl bg-orange-500/20 blur-md"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
    <div className="space-y-2">
      <WaveSkeleton className="h-6 w-20" delay={0.1} />
      <WaveSkeleton className="h-4 w-32" delay={0.2} />
    </div>
  </motion.div>
);

// XP Chart Skeleton avançado
export const XPChartSkeleton = () => {
  const barHeights = [45, 60, 35, 75, 55, 80, 65]; // Fixed heights for consistency
  
  return (
    <motion.div 
      className="relative p-6 rounded-2xl bg-card border border-border/50 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <ShimmerOverlay />
      <WaveSkeleton className="h-6 w-40 mb-4 rounded-lg" delay={0} />
      
      <div className="h-64 flex items-end justify-between gap-3">
        {barHeights.map((height, i) => (
          <motion.div
            key={i}
            className="flex-1 bg-muted rounded-t-lg relative overflow-hidden"
            initial={{ height: 0 }}
            animate={{ height: `${height}%` }}
            transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }}
            />
          </motion.div>
        ))}
      </div>
      
      <div className="flex justify-between mt-4">
        {barHeights.map((_, i) => (
          <WaveSkeleton key={i} className="h-3 w-8 rounded" delay={0.7 + i * 0.05} />
        ))}
      </div>
    </motion.div>
  );
};

// Profile Skeleton avançado
export const ProfileSkeleton = () => (
  <motion.div 
    className="space-y-6"
    initial="hidden"
    animate="visible"
    variants={containerVariants}
  >
    <motion.div className="flex items-center gap-6" variants={itemVariants}>
      <motion.div
        className="relative"
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <Skeleton className="h-24 w-24 rounded-2xl" />
        <motion.div
          className="absolute -inset-1 rounded-2xl bg-primary/10 blur-md"
          animate={{ opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
      <div className="space-y-3">
        <WaveSkeleton className="h-8 w-48" delay={0.1} />
        <WaveSkeleton className="h-4 w-32" delay={0.2} />
        <WaveSkeleton className="h-4 w-24" delay={0.3} />
      </div>
    </motion.div>
    
    <motion.div className="grid grid-cols-3 gap-4" variants={containerVariants}>
      {[...Array(3)].map((_, i) => (
        <motion.div 
          key={i} 
          className="relative p-4 rounded-xl bg-muted/50 overflow-hidden"
          variants={itemVariants}
        >
          <ShimmerOverlay />
          <WaveSkeleton className="h-8 w-16 mb-2" delay={0.4 + i * 0.1} />
          <WaveSkeleton className="h-4 w-20" delay={0.5 + i * 0.1} />
        </motion.div>
      ))}
    </motion.div>
  </motion.div>
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

// Generic List Skeleton (linhas verticais, ex: playbooks, notificações longas)
export const ListSkeleton = ({ count = 6, className }: { count?: number; className?: string }) => (
  <div className={cn("space-y-3", className)} role="status" aria-label="Carregando lista">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-start gap-4 p-4 rounded-xl border border-border/50 bg-card/40">
        <Skeleton className="h-12 w-12 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/5" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full hidden sm:block" />
      </div>
    ))}
  </div>
);

// Alias semântico para grids de cards (usa CourseGridSkeleton sob o capô)
export const CardGridSkeleton = ({ count = 8 }: { count?: number }) => (
  <CourseGridSkeleton count={count} />
);

// Detail Hero Skeleton (página de detalhe: curso, trilha, playbook)
export const DetailHeroSkeleton = () => (
  <div className="relative rounded-2xl border border-border/50 bg-card/40 p-8 overflow-hidden">
    <ShimmerOverlay />
    <div className="relative space-y-4 max-w-3xl">
      <Skeleton className="h-6 w-28 rounded-full" />
      <Skeleton className="h-10 w-3/4" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-2/3" />
      <div className="flex gap-3 pt-2">
        <Skeleton className="h-12 w-36 rounded-xl" />
        <Skeleton className="h-12 w-36 rounded-xl" />
      </div>
    </div>
  </div>
);

// Stats Grid Skeleton (alias semântico)
export const StatsGridSkeleton = () => <DashboardStatsSkeleton />;

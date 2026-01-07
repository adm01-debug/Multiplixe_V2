import { Skeleton } from "@/components/ui/skeleton";

// Course Card Skeleton
export const CourseCardSkeleton = () => (
  <div className="rounded-3xl bg-card/50 border border-border/50 overflow-hidden">
    <Skeleton className="aspect-[16/10] w-full" />
    <div className="p-5 space-y-4">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  </div>
);

// Course Grid Skeleton
export const CourseGridSkeleton = ({ count = 8 }: { count?: number }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {[...Array(count)].map((_, i) => (
      <CourseCardSkeleton key={i} />
    ))}
  </div>
);

// Dashboard Stats Skeleton
export const DashboardStatsSkeleton = () => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="p-6 rounded-2xl bg-card border border-border/50">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Learning Path Card Skeleton
export const LearningPathCardSkeleton = () => (
  <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
    <Skeleton className="aspect-video w-full" />
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
    </div>
  </div>
);

// Learning Path Grid Skeleton
export const LearningPathGridSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
    {[...Array(count)].map((_, i) => (
      <LearningPathCardSkeleton key={i} />
    ))}
  </div>
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

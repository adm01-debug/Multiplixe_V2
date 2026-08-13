import { Skeleton } from "@/components/ui/skeleton";

const PlaybookDetailSkeleton = () => (
  <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6" aria-busy="true" aria-label="Carregando playbook">
    <Skeleton className="h-10 w-32" />
    <div className="space-y-3">
      <div className="flex gap-2">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-32" />
      </div>
      <Skeleton className="h-12 w-3/4" />
      <Skeleton className="h-6 w-1/2" />
      <div className="flex gap-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-5 w-16" />
        ))}
      </div>
    </div>
    <Skeleton className="h-64 w-full" />
    <Skeleton className="h-32 w-full" />
    <div className="space-y-3 pt-8 border-t border-border">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  </div>
);

export default PlaybookDetailSkeleton;

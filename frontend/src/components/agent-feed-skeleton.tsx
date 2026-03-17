import { Skeleton } from "@/components/ui/skeleton";

export function AgentFeedSkeleton() {
  return (
    <div className="flex flex-col gap-3 min-w-0 flex-1">
      {/* Feed Header Skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="w-2 h-2 rounded-full" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-8 ml-auto" />
      </div>

      {/* Card Display Skeleton */}
      <div className="relative" style={{ minHeight: 460 }}>
        <div className="bg-white rounded-2xl border border-gray-200 p-6 h-full">
          {/* Header section */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-16 h-6 rounded-full" />
              <Skeleton className="w-20 h-6 rounded-full" />
              <Skeleton className="w-12 h-6 rounded-full" />
            </div>
            <Skeleton className="w-12 h-4" />
          </div>

          {/* Competitor VS Bar */}
          <div className="mb-4">
            <Skeleton className="w-3/4 h-8 rounded-full" />
          </div>
          
          {/* Tweet Content */}
          <div className="mb-4 space-y-2">
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-5/6 h-4" />
            <Skeleton className="w-4/5 h-4" />
          </div>

          {/* Signal Tags */}
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="w-20 h-6 rounded-full" />
            <Skeleton className="w-12 h-6 rounded-full" />
          </div>

          {/* Character Bar */}
          <div className="mb-6">
            <Skeleton className="w-full h-1 rounded-full" />
            <div className="flex justify-between mt-1">
              <Skeleton className="w-12 h-3" />
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Skeleton className="w-20 h-10 rounded-full" />
            <Skeleton className="w-20 h-10 rounded-full" />
            <Skeleton className="w-32 h-10 rounded-full" />
          </div>
        </div>
      </div>

      {/* Navigation Arrows Skeleton */}
      <div className="flex items-center justify-center gap-4 mt-1">
        <Skeleton className="w-9 h-9 rounded-full" />
        <Skeleton className="w-9 h-9 rounded-full" />
      </div>
    </div>
  );
}
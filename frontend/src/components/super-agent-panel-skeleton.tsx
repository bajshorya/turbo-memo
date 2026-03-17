import { Skeleton } from "@/components/ui/skeleton";

export function SuperAgentPanelSkeleton() {
  return (
    <div className="w-1/3 shrink-0 flex flex-col">
      {/* Header */}
      <div className="bg-[#1a1a3e] rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Skeleton className="w-2 h-2 rounded-full bg-green-400/20" />
          <Skeleton className="h-4 w-20 bg-white/20" />
        </div>
        <Skeleton className="h-3 w-48 bg-white/10" />
      </div>

      {/* Card area skeleton */}
      <div className="flex-1 relative" style={{ minHeight: 460 }}>
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
            <Skeleton className="w-3/4 h-4" />
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

      {/* Card counter skeleton */}
      <div className="text-center mt-2">
        <Skeleton className="w-8 h-3 mx-auto" />
      </div>
    </div>
  );
}
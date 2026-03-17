import { Skeleton } from "@/components/ui/skeleton";

export function SuperAgentPanelSkeleton() {
  return (
    <div className="w-1/3 shrink-0 flex flex-col">
      {/* Card area skeleton */}
      <div className="flex-1 relative" style={{ minHeight: 460 }}>
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden w-full">
          {/* Header — Category badges */}
          <div className="px-5 pt-5 pb-3 flex items-center gap-2 flex-wrap">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full bg-gray-800/10" />
          </div>

          {/* Metric */}
          <div className="px-5 pb-3">
            <Skeleton className="h-3 w-12 mb-1" />
            <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2">
              <Skeleton className="h-4 w-32" />
            </div>
          </div>

          {/* Insight */}
          <div className="px-5 pb-3">
            <Skeleton className="h-3 w-12 mb-1" />
            <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </div>
          </div>

          {/* Suggested Tweet */}
          <div className="px-5 pb-3">
            <Skeleton className="h-3 w-20 mb-1" />
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex flex-col leading-tight">
                  <Skeleton className="h-2 w-20" />
                </div>
              </div>
              <div className="space-y-2 mb-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/4" />
              </div>

              {/* Character bar */}
              <div className="mt-3">
                <Skeleton className="w-full h-1 rounded-full" />
                <Skeleton className="h-2 w-8 mt-0.5" />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-5 pb-5 flex items-center gap-2">
            <Skeleton className="h-7 w-12 rounded-full" />
            <Skeleton className="h-7 w-20 rounded-full" />
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
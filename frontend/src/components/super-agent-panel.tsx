"use client";

import { useDashboardStore } from "@/lib/store";
import { AgentCard } from "./agent-card";
import { SuperAgentPanelSkeleton } from "./super-agent-panel-skeleton";

export function  SuperAgentPanel() {
  const { superAgentFeed, volumeFeed, categoryFeed, feesFeed, assetFeed } = useDashboardStore();
  const { data, currentIndex, loading, error } = superAgentFeed;
  const currentItem = data[currentIndex] ?? null;

  // Check if all sub-agent feeds are done loading
  const allSubAgentsLoaded = !volumeFeed.loading && !categoryFeed.loading && !feesFeed.loading && !assetFeed.loading;

  // Show skeleton when loading OR when sub-agents aren't loaded yet
  if (loading || !allSubAgentsLoaded) {
    return <SuperAgentPanelSkeleton />;
  }

  return (
    <div className="w-1/3 shrink-0 flex flex-col">
      {/* Card area */}
      <div className="flex-1 relative" style={{ minHeight: 460 }}>
        {error && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="bg-red-50 text-red-600 text-xs rounded-xl px-4 py-3 border border-red-200">
              {error}
            </div>
          </div>
        )}

        {!error && !currentItem && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center">
                <span className="text-2xl">?</span>
              </div>
              <span className="text-xs">Waiting for data…</span>
            </div>
          </div>
        )}

        {currentItem && (
          <AgentCard item={currentItem} />
        )}
      </div>

      {/* Card counter */}
      {data.length > 0 && (
        <div className="text-center mt-2">
          <span className="text-xs text-gray-400">
            {currentIndex + 1} / {data.length}
          </span>
        </div>
      )}
    </div>
  );
}

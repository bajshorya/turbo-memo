"use client";

import { useDashboardStore } from "@/lib/store";
import { AgentCard } from "./agent-card";

export function SuperAgentPanel() {
  const { superAgentFeed } = useDashboardStore();
  const { data, currentIndex, loading, error } = superAgentFeed;
  const currentItem = data[currentIndex] ?? null;

  return (
    <div className="w-1/2 shrink-0 flex flex-col">
      {/* Header */}
      <div className="bg-[#1a1a3e] rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <h3 className="text-sm font-semibold text-white">Super Agent</h3>
        </div>
        <p className="text-xs text-gray-300">
          Aggregated insights from all sub-agents.
        </p>
      </div>

      {/* Card area */}
      <div className="flex-1 relative" style={{ minHeight: 460 }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-[#1a1a3e] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-gray-500">Loading…</span>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="bg-red-50 text-red-600 text-xs rounded-xl px-4 py-3 border border-red-200">
              {error}
            </div>
          </div>
        )}

        {!loading && !error && !currentItem && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center">
                <span className="text-2xl">?</span>
              </div>
              <span className="text-xs">Waiting for data…</span>
            </div>
          </div>
        )}

        {currentItem && !loading && (
          <AgentCard item={currentItem} />
        )}
      </div>

      {/* Card counter */}
      {data.length > 0 && !loading && (
        <div className="text-center mt-2">
          <span className="text-xs text-gray-400">
            {currentIndex + 1} / {data.length}
          </span>
        </div>
      )}
    </div>
  );
}

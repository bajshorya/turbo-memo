"use client";

import { useDashboardStore } from "@/lib/store";

export function SuperAgentPanel() {
  const { volumeFeed, categoryFeed, feesFeed } = useDashboardStore();

  // Aggregate: take the top card from each feed
  const topCards = [
    { agent: "Volume Analyzer", item: volumeFeed.data[0] ?? null },
    { agent: "Category Volume", item: categoryFeed.data[0] ?? null },
    { agent: "Fees Analyzer", item: feesFeed.data[0] ?? null },
  ];

  const allLoading =
    volumeFeed.loading && categoryFeed.loading && feesFeed.loading;

  return (
    <div className="w-80 min-w-72 space-y-4 shrink-0">
      {/* Header */}
      <div className="bg-[#1a1a3e] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <h3 className="text-sm font-semibold text-white">Super Agent</h3>
        </div>
        <p className="text-xs text-gray-300">
          Aggregated view of the top card from each sub-agent feed.
        </p>
      </div>

      {/* Aggregated cards */}
      {allLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-[#1a1a3e] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {topCards.map(({ agent, item }) => (
            <div
              key={agent}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-purple-100 rounded-full px-2.5 py-0.5">
                  <span className="text-[10px] font-semibold text-purple-700">
                    {agent}
                  </span>
                </div>
              </div>

              {item ? (
                <>
                  <p className="text-xs font-medium text-[#1a1a3e] mb-1">
                    {item.metric}
                  </p>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] text-gray-400">
                      {item.category}
                    </span>
                    <span className="text-[10px] font-semibold text-[#1a1a3e] ml-auto bg-gray-100 rounded-full px-2 py-0.5">
                      {item.value}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed line-clamp-3">
                    {item.insight}
                  </p>

                  {/* Quick tweet preview */}
                  <div className="mt-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-[11px] text-[#1a1a3e] whitespace-pre-line line-clamp-3 leading-relaxed">
                      {item.suggested_tweet}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-xs text-gray-400">Loading…</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <h4 className="text-xs font-semibold text-[#1a1a3e] mb-3">
          Feed Stats
        </h4>
        <div className="space-y-2">
          {[
            { label: "Volume", count: volumeFeed.data.length },
            { label: "Category", count: categoryFeed.data.length },
            { label: "Fees", count: feesFeed.data.length },
          ].map(({ label, count }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-[11px] text-gray-500">{label}</span>
              <span className="text-[11px] font-semibold text-[#1a1a3e]">
                {count} cards
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

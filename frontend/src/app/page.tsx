"use client";

import { Header } from "@/components/header";
import { Controls } from "@/components/controls";
import { AgentFeed } from "@/components/agent-feed";
import { SuperAgentPanel } from "@/components/super-agent-panel";
import { useDashboardStore } from "@/lib/store";
import { useEffect } from "react";

export default function Home() {
  const {
    volumeFeed,
    categoryFeed,
    feesFeed,
    assetFeed,
    fetchAllFeeds,
    advanceVolume,
    advanceCategory,
    advanceFees,
    advanceAsset,
  } = useDashboardStore();

  // ✅ LOAD ALL ON START
  useEffect(() => {
    fetchAllFeeds();
  }, [fetchAllFeeds]);

  return (
    <div className="min-h-screen bg-[#e4ebf2]">
      <Header />
      <Controls />

      <div className="flex gap-6 p-6">
        {/* Left — 4 Sub-Agent Feeds */}
        <div className="flex-1 flex gap-5 min-w-0">
          <AgentFeed
            title="Volume Analyzer"
            data={volumeFeed.data}
            loading={volumeFeed.loading}
            error={volumeFeed.error}
            onSwipe={advanceVolume}
          />
          <AgentFeed
            title="Category Volume"
            data={categoryFeed.data}
            loading={categoryFeed.loading}
            error={categoryFeed.error}
            onSwipe={advanceCategory}
          />
          <AgentFeed
            title="Fees Analyzer"
            data={feesFeed.data}
            loading={feesFeed.loading}
            error={feesFeed.error}
            onSwipe={advanceFees}
          />
          <AgentFeed
            title="Asset Analyzer"
            data={assetFeed.data}
            loading={assetFeed.loading}
            error={assetFeed.error}
            onSwipe={advanceAsset}
          />
        </div>

        {/* Right — Super Agent */}
        <SuperAgentPanel />
      </div>
    </div>
  );
}

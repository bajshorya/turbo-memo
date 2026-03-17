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
    nextVolume,
    prevVolume,
    nextCategory,
    prevCategory,
    nextFees,
    prevFees,
    nextAsset,
    prevAsset,
  } = useDashboardStore();

  // Load all on start
  useEffect(() => {
    fetchAllFeeds();
  }, [fetchAllFeeds]);

  return (
    <div className="min-h-screen bg-[#e4ebf2]">
      <Header />
      <Controls />

      <div className="flex gap-6 p-6 min-h-[calc(100vh-120px)]">
        {/* Left — Sub-Agent Feeds */}
        <div className="w-1/2 grid grid-cols-2 gap-4">
          <AgentFeed
            title="Volume Analyzer"
            data={volumeFeed.data}
            currentIndex={volumeFeed.currentIndex}
            loading={volumeFeed.loading}
            error={volumeFeed.error}
            onNext={nextVolume}
            onPrev={prevVolume}
          />
          <AgentFeed
            title="Category Volume"
            data={categoryFeed.data}
            currentIndex={categoryFeed.currentIndex}
            loading={categoryFeed.loading}
            error={categoryFeed.error}
            onNext={nextCategory}
            onPrev={prevCategory}
          />
          <AgentFeed
            title="Fees Analyzer"
            data={feesFeed.data}
            currentIndex={feesFeed.currentIndex}
            loading={feesFeed.loading}
            error={feesFeed.error}
            onNext={nextFees}
            onPrev={prevFees}
          />
          <AgentFeed
            title="Asset Analyzer"
            data={assetFeed.data}
            currentIndex={assetFeed.currentIndex}
            loading={assetFeed.loading}
            error={assetFeed.error}
            onNext={nextAsset}
            onPrev={prevAsset}
          />
        </div>

        {/* Right — Super Agent (full right half) */}
        <SuperAgentPanel />
      </div>
    </div>
  );
}

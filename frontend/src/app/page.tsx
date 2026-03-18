"use client";

import { Header } from "@/components/header";
import { Controls } from "@/components/controls";
import { AgentFeed } from "@/components/agent-feed";
import { SuperAgentPanel } from "@/components/super-agent-panel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDashboardStore } from "@/lib/store";
import { useEffect } from "react";

export default function Home() {
  const {
    volumeFeed,
    categoryFeed,
    feesFeed,
    assetFeed,
    competitorFeed,
    superAgentFeed,
    fetchAllFeeds,
    fetchSuperAgentData,
    nextVolume,
    prevVolume,
    nextCategory,
    prevCategory,
    nextFees,
    prevFees,
    nextAsset,
    prevAsset,
    nextCompetitor,
    prevCompetitor,
  } = useDashboardStore();

  // Load all on start
  useEffect(() => {
    fetchAllFeeds();
  }, [fetchAllFeeds]);

  // Check if all sub-agent feeds are done loading
  const allSubAgentsLoaded =
    !volumeFeed.loading &&
    !categoryFeed.loading &&
    !feesFeed.loading &&
    !assetFeed.loading &&
    !competitorFeed.loading;

  // Fetch super agent data once all sub-agents are loaded
  useEffect(() => {
    if (
      allSubAgentsLoaded &&
      volumeFeed.data.length > 0 &&
      categoryFeed.data.length > 0 &&
      feesFeed.data.length > 0 &&
      assetFeed.data.length > 0 &&
      competitorFeed.data.length > 0
    ) {
      fetchSuperAgentData();
    }
  }, [
    allSubAgentsLoaded,
    volumeFeed.data.length,
    categoryFeed.data.length,
    feesFeed.data.length,
    assetFeed.data.length,
    competitorFeed.data.length,
    fetchSuperAgentData,
  ]);

  return (
    <div className="max-h-screen bg-[#e4ebf2] px-10 overflow-hidden">
      <Header />
      <Controls />

      <div className="flex gap-6 p-6 min-h-[calc(100vh-120px)]">
        {/* Left — Super Agent Panel (1/3 width) */}
        <SuperAgentPanel />

        {/* Right — Agent Feeds (2/3 width) */}
        <div className="w-2/3 relative">
          <ScrollArea className="h-[calc(100vh-180px)] pr-4 ">
            <div className="grid grid-cols-2 gap-4 pb-[100px]">
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
              <AgentFeed
                title="Competitor Analysis"
                data={competitorFeed.data}
                currentIndex={competitorFeed.currentIndex}
                loading={competitorFeed.loading}
                error={competitorFeed.error}
                onNext={nextCompetitor}
                onPrev={prevCompetitor}
              />
            </div>

            {/* Bottom gradient overlay */}
            <div
              className="absolute bottom-0 left-0 right-0 pointer-events-none z-20"
              style={{
                height: "160px",
                background:
                  "linear-gradient(to top, #e4ebf2 0%, rgba(228, 235, 242, 0.8) 30%, transparent 100%)",
              }}
            />

            {/* Fixed scroll indicator at bottom - Always show */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30">
              <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full px-4 py-2 shadow-lg">
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <svg
                    className="w-4 h-4 animate-bounce"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                  Scroll to view more agents
                </p>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

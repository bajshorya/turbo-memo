"use client";

import { Header } from "@/components/header";
import { Controls } from "@/components/controls";
import { AgentFeed } from "@/components/agent-feed";
import { SuperAgentPanel } from "@/components/super-agent-panel";
import { useDashboardStore } from "@/lib/store";
import { useEffect } from "react";

export default function Home() {
  const {
<<<<<<< HEAD
    volumeFeed,
    categoryFeed,
    feesFeed,
    assetFeed,
    fetchAllFeeds,
    advanceVolume,
    advanceCategory,
    advanceFees,
    advanceAsset,
=======
    tweetSuggestions,
    approveTweet,
    rejectTweet,
    expandToThread,
    fetchVolumeData,
    fetchCategoryData,
>>>>>>> aa8ae4d71b9c59d5fca782e3a2e5e304ed34b4d7
  } = useDashboardStore();

  // ✅ LOAD BOTH ON START
  useEffect(() => {
<<<<<<< HEAD
    fetchAllFeeds();
  }, [fetchAllFeeds]);
=======
    fetchVolumeData();
    fetchCategoryData();
  }, []);
>>>>>>> aa8ae4d71b9c59d5fca782e3a2e5e304ed34b4d7

  return (
    <div className="min-h-screen bg-[#e4ebf2]">
      <Header />
      <Controls />

<<<<<<< HEAD
      <div className="flex gap-6 p-6">
        {/* Left — 3 Sub-Agent Feeds */}
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
=======
      <div className="flex gap-6 p-6 mx-auto">
        <Sidebar />

        <div className="flex-1 relative">
          <ScrollArea className="h-[calc(100vh-180px)] pr-4">
            {tweetSuggestions.length > 0 ? (
              <div className="grid grid-cols-2 gap-6">
                {tweetSuggestions.map((suggestion) => (
                  <TweetCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    onApprove={approveTweet}
                    onReject={rejectTweet}
                    onExpand={expandToThread}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  Loading AI suggestions...
                </p>
              </div>
            )}
          </ScrollArea>

          {tweetSuggestions.length > 0 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <Button
                variant="outline"
                className="bg-white shadow-lg border-gray-300"
              >
                <ChevronDown className="w-4 h-4 mr-2" />
                Scroll down
              </Button>
            </div>
          )}
        </div>
>>>>>>> aa8ae4d71b9c59d5fca782e3a2e5e304ed34b4d7
      </div>
    </div>
  );
}

"use client";

import { Header } from "@/components/header";
import { Controls } from "@/components/controls";
import { Sidebar } from "@/components/sidebar";
import { TweetCard } from "@/components/tweet-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDashboardStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { useEffect } from "react";
export default function Home() {
  const {
    tweetSuggestions,
    selectedExchange,
    searchQuery,
    approveTweet,
    rejectTweet,
    expandToThread,
  } = useDashboardStore();
  const { fetchVolumeData } = useDashboardStore();

  useEffect(() => {
    fetchVolumeData();
  }, []);

  // Filter tweets based on selected exchange and search query
  const filteredTweets = tweetSuggestions.filter((tweet) => {
    const matchesExchange =
      selectedExchange === "all-dex" || tweet.exchange === selectedExchange;
    const matchesSearch =
      searchQuery === "" ||
      tweet.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tweet.agentType.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesExchange && matchesSearch;
  });

  return (
    <div className="max-h-screen bg-[#e4ebf2]">
      <Header />
      <Controls />

      <div className="flex gap-6 p-6 mx-auto">
        {/* Left Sidebar */}
        <div className="h-full">
          <Sidebar />
        </div>

        {/* Main Content */}
        <div className="flex-1 relative">
          <div className="relative">
            <ScrollArea className="h-[calc(100vh-180px)]">
              <div className="pr-4">
                {/* Main Feed - Two Column Grid */}
                {filteredTweets.length > 0 ? (
                  <div className="grid grid-cols-2 gap-6 auto-rows-max">
                    {filteredTweets.map((suggestion) => (
                      <div key={suggestion.id} className="w-full">
                        <TweetCard
                          suggestion={suggestion}
                          onApprove={approveTweet}
                          onReject={rejectTweet}
                          onExpand={expandToThread}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 col-span-2">
                    <p className="text-gray-500 text-lg">
                      No tweets found for the selected filters.
                    </p>
                    <p className="text-gray-400 text-sm mt-2">
                      Try adjusting your search or exchange selection.
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Bottom Gradient */}
            <div
              className="absolute bottom-0 left-0 right-0 pointer-events-none z-20"
              style={{
                height: "160px",
                background:
                  "linear-gradient(to top, #e4ebf2 0%, transparent 100%)",
              }}
            />
          </div>

          {/* Load More - Fixed at bottom of screen */}
          {filteredTweets.length > 0 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30">
              <Button
                variant="outline"
                className="text-[#1a1a3e] border-gray-300 hover:bg-white shadow-lg bg-white"
              >
                <ChevronDown className="w-4 h-4 mr-2" />
                Scroll down to view more
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

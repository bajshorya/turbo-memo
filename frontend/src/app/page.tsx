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
    approveTweet,
    rejectTweet,
    expandToThread,
    fetchVolumeData,
    fetchCategoryData,
  } = useDashboardStore();

  // ✅ LOAD BOTH ON START
  useEffect(() => {
    fetchVolumeData();
    fetchCategoryData();
  }, []);

  return (
    <div className="max-h-screen bg-[#e4ebf2]">
      <Header />
      <Controls />

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
      </div>
    </div>
  );
}

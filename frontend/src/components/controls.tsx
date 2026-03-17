"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useDashboardStore } from "@/lib/store";

export function Controls() {
  const { fetchAllFeeds } = useDashboardStore();

  return (
    <div className="border-b border-gray-200 bg-[#e4ebf2]">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Left */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="h-10 bg-[#f8f8f8] text-[#473c75] border-gray-200 hover:bg-gray-50 rounded-full px-4 font-medium"
          >
            All Agents
          </Button>

          <div className="flex items-center gap-2">
            {["Volume", "Category", "Fees"].map((label) => (
              <div
                key={label}
                className="h-8 flex items-center rounded-full px-3 bg-white border border-gray-200 text-xs font-medium text-[#1a1a3e]"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5" />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Right */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fetchAllFeeds()}
          className="h-10 bg-[#f8f8f8] text-[#473c75] hover:bg-gray-50 rounded-full px-4 font-medium"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh All
        </Button>
      </div>
    </div>
  );
}

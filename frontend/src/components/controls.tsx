"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useDashboardStore } from "@/lib/store";

const COOLDOWN_MS = 15_000;

export function Controls() {
  const { fetchAllFeeds, lastRefreshTime, isRefreshing } = useDashboardStore();
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (lastRefreshTime === 0) return;

    const tick = () => {
      const elapsed = Date.now() - lastRefreshTime;
      const left = Math.max(0, COOLDOWN_MS - elapsed);
      setRemaining(left);
    };

    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [lastRefreshTime]);

  const onRefresh = useCallback(() => {
    if (remaining > 0 || isRefreshing) return;
    fetchAllFeeds();
  }, [remaining, isRefreshing, fetchAllFeeds]);

  const disabled = remaining > 0 || isRefreshing;
  const seconds = Math.ceil(remaining / 1000);

  return (
    <div className="border-b border-gray-200 bg-[#EBF0F5] rounded-[20px]">
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
            {["Volume", "Category", "Fees", "Asset"].map((label) => (
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
          onClick={onRefresh}
          disabled={disabled}
          className="h-10 bg-[#f8f8f8] text-[#473c75] hover:bg-gray-50 rounded-full px-4 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : disabled && remaining > 0 ? `Refresh (${seconds}s)` : "Refresh All"}
        </Button>
      </div>
    </div>
  );
}

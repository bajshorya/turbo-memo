"use client";

import type { AgentDataItem } from "@/lib/store";
import { Copy } from "lucide-react";

interface AgentCardProps {
  item: AgentDataItem;
}

export function AgentCard({ item }: AgentCardProps) {
  return (
    <div className="bg-[#eff4f9] rounded-[20px] border border-white/60 hover:border-[#fc79c1] overflow-hidden w-full select-none transition-all ease-in-out duration-200">
      {/* Header — Category badge */}
      <div className="px-5 pt-5 pb-3 flex items-center gap-2 flex-wrap">
        <div className="bg-pink-100 border border-pink-200 rounded-full px-3 py-1">
          <span className="text-xs font-semibold text-pink-700">
            {item.category}
          </span>
        </div>
        <div className="bg-[#1a1a3e] rounded-full px-3 py-1">
          <span className="text-xs font-semibold text-white">{item.value}</span>
        </div>
      </div>

      {/* Metric */}
      <div className="px-5 pb-3">
        <p className="text-xs text-gray-500 mb-1">Metric</p>
        <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2">
          <p className="text-sm font-medium text-[#1a1a3e]">{item.metric}</p>
        </div>
      </div>

      {/* Insight */}
      <div className="px-5 pb-3">
        <p className="text-xs text-gray-500 mb-1">Insight</p>
        <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
          <p className="text-sm text-[#1a1a3e] ">
            {item.insight}
          </p>
        </div>
      </div>

      {/* Suggested Tweet */}
      <div className="px-5 pb-3">
        <p className="text-xs text-gray-500 mb-1">Suggested Tweet</p>
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
          
            <div className="flex flex-col leading-tight">
              
              <span className="text-[10px] text-gray-400">@garden_finance</span>
            </div>
          </div>
          <p className="text-sm text-[#1a1a3e] ">
            {item.suggested_tweet}
          </p>

          {/* Character bar */}
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div
                className="h-1 rounded-full transition-all"
                style={{
                  width: `${Math.min((item.suggested_tweet.length / 280) * 100, 100)}%`,
                  background:
                    item.suggested_tweet.length > 280
                      ? "#ef4444"
                      : item.suggested_tweet.length > 240
                        ? "#f59e0b"
                        : "#22c55e",
                }}
              />
            </div>
            <span className="text-[10px] text-gray-400 mt-0.5 block">
              {item.suggested_tweet.length}/280
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 pb-5 flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(item.suggested_tweet);
          }}
          className="text-xs px-3 py-1.5 rounded-full border border-gray-200 hover:bg-pink-100 hover:text-pink-900 hover:border-pink-200 bg-white text-[#1a1a3e] transition-colors cursor-pointer"
        >
          <Copy className="size-3 m-0.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(item.suggested_tweet)}`;
            window.open(url, "_blank");
          }}
          className="text-xs px-3 py-1.5 rounded-full bg-[#1da1f2] text-white hover:bg-[#1a8cd8] transition-colors cursor-pointer"
        >
          Post to X
        </button>
      </div>
    </div>
  );
}

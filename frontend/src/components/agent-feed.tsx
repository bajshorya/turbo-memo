"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { AgentCard } from "./agent-card";
import type { AgentDataItem } from "@/lib/store";

interface AgentFeedProps {
  title: string;
  data: AgentDataItem[];
  currentIndex: number;
  loading: boolean;
  error: string | null;
  onNext: () => void;
  onPrev: () => void;
}

const MAX_CARDS = 5;

export function AgentFeed({
  title,
  data,
  currentIndex,
  loading,
  error,
  onNext,
  onPrev,
}: AgentFeedProps) {
  const maxIndex = Math.min(data.length - 1, MAX_CARDS - 1);
  const currentItem = data[currentIndex] ?? null;
  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex < maxIndex && data.length > 0;

  return (
    <div className="flex flex-col gap-3 min-w-0 flex-1">
      {/* Feed Header */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <h3 className="text-sm font-semibold text-[#1a1a3e] truncate">
          {title}
        </h3>
        <span className="text-xs text-gray-400 ml-auto">
          {data.length > 0 ? `${currentIndex + 1} / ${Math.min(data.length, MAX_CARDS)}` : "0"}
        </span>
      </div>

      {/* Card Display */}
      <div className="relative" style={{ minHeight: 460 }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-[#1a1a3e] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-gray-500">Loading…</span>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="bg-red-50 text-red-600 text-xs rounded-xl px-4 py-3 border border-red-200">
              {error}
            </div>
          </div>
        )}

        {!loading && !error && data.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs text-gray-400">No data available</span>
          </div>
        )}

        {currentItem && !loading && (
          <AgentCard item={currentItem} />
        )}
      </div>

      {/* Navigation Arrows */}
      {data.length > 1 && !loading && (
        <div className="flex items-center justify-center gap-4 mt-1">
          <button
            onClick={onPrev}
            disabled={!canGoBack}
            className="w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-[#1a1a3e]" />
          </button>
          <button
            onClick={onNext}
            disabled={!canGoForward}
            className="w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 text-[#1a1a3e]" />
          </button>
        </div>
      )}
    </div>
  );
}

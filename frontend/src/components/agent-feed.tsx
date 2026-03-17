"use client";

import { useState } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
  type PanInfo,
} from "motion/react";
import { AgentCard } from "./agent-card";
import type { AgentDataItem } from "@/lib/store";

interface AgentFeedProps {
  title: string;
  data: AgentDataItem[];
  loading: boolean;
  error: string | null;
  onSwipe: () => void;
}

const SWIPE_THRESHOLD = 100;
const VISIBLE_CARDS = 3;

export function AgentFeed({
  title,
  data,
  loading,
  error,
  onSwipe,
}: AgentFeedProps) {
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(
    null,
  );
  const [swiping, setSwiping] = useState(false);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const offset = info.offset.x;
    if (Math.abs(offset) > SWIPE_THRESHOLD) {
      setExitDirection(offset > 0 ? "right" : "left");
      setSwiping(true);

      // After animation completes, advance and reset
      setTimeout(() => {
        onSwipe();
        setSwiping(false);
        setExitDirection(null);
      }, 300);
    }
  };

  // Stack: show top 3 cards
  const visibleCards = data.slice(0, VISIBLE_CARDS);

  return (
    <div className="flex flex-col gap-3 min-w-0 flex-1">
      {/* Feed Header */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <h3 className="text-sm font-semibold text-[#1a1a3e] truncate">
          {title}
        </h3>
        <span className="text-xs text-gray-400 ml-auto">
          {data.length} cards
        </span>
      </div>

      {/* Card Stack */}
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

        <AnimatePresence mode="popLayout">
          {visibleCards.map((item, index) => {
            const isTop = index === 0;
            return (
              <SwipeableCard
                key={`${item.id}-${item.category}-${index}`}
                item={item}
                index={index}
                isTop={isTop && !swiping}
                exitDirection={isTop ? exitDirection : null}
                onDragEnd={isTop ? handleDragEnd : undefined}
              />
            );
          })}
        </AnimatePresence>

        {/* Swipe hint */}
        {data.length > 1 && !loading && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1 text-[10px] text-gray-400">
            <span>← swipe →</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Individual swipeable card ──────────────────────
function SwipeableCard({
  item,
  index,
  isTop,
  exitDirection,
  onDragEnd,
}: {
  item: AgentDataItem;
  index: number;
  isTop: boolean;
  exitDirection: "left" | "right" | null;
  onDragEnd?: (_: any, info: PanInfo) => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const cardOpacity = useTransform(
    x,
    [-200, -100, 0, 100, 200],
    [0.5, 0.8, 1, 0.8, 0.5],
  );

  // Stack offset: cards behind get progressively smaller + lower
  const scale = 1 - index * 0.04;
  const yOffset = index * 8;

  return (
    <motion.div
      className="absolute top-0 left-0 right-0"
      style={{
        x: isTop ? x : 0,
        rotate: isTop ? rotate : 0,
        scale,
        y: yOffset,
        zIndex: 10 - index,
        cursor: isTop ? "grab" : "default",
        opacity: isTop ? cardOpacity : 1 - index * 0.15,
      }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={onDragEnd}
      animate={
        exitDirection && isTop
          ? { x: exitDirection === "left" ? -500 : 500, opacity: 0 }
          : {}
      }
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      whileTap={isTop ? { scale: scale * 0.98 } : undefined}
    >
      <AgentCard item={item} />
    </motion.div>
  );
}

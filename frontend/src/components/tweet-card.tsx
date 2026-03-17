import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Check, X, MoreHorizontal } from "lucide-react";
import { TweetSuggestion } from "@/lib/store";

interface TweetCardProps {
  suggestion: TweetSuggestion;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onExpand: (id: string) => void;
}

export function TweetCard({
  suggestion,
  onApprove,
  onReject,
  onExpand,
}: TweetCardProps) {
  return (
    <Card className="bg-[#eff4f9] border-0 shadow-sm rounded-2xl overflow-hidden">
      <CardContent className="p-6">
        {/* Header with Sub Agent and Performance */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-white border border-gray-200 rounded-full px-3 py-1">
              <span className="text-sm font-medium text-[#1a1a3e]">
                Sub Agent
              </span>
            </div>
            <div className="bg-white border border-gray-200 rounded-full px-3 py-1">
              <span className="text-sm font-medium text-[#1a1a3e]">
                {suggestion.agentType}
              </span>
            </div>
            {suggestion.performance && (
              <div className="bg-white border border-gray-200 rounded-full px-3 py-1 flex items-center gap-2">
                <span className="text-sm font-medium text-[#1a1a3e]">
                  {suggestion.performance}%
                </span>
              </div>
            )}
          </div>
          <span className="text-sm text-gray-500">{suggestion.timestamp}</span>
        </div>
        {/* Metric + Value */}
        {suggestion.metric && suggestion.value && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1 px-1">
              <span>Metric</span>
              <span>Value</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="bg-white border border-gray-200 rounded-full px-3 py-1">
                <span className="text-xs font-medium text-[#1a1a3e]">
                  {suggestion.metric}
                </span>
              </div>

              <div className="bg-[#1a1a3e] rounded-full px-3 py-1">
                <span className="text-xs font-semibold text-white">
                  {suggestion.value}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Insight */}
        <div className="mb-4">
          <div className="text-xs text-gray-500 mb-1 px-1">Insight</div>

          <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
            <p className="text-sm text-[#1a1a3e] leading-relaxed">
              {suggestion.insight}
            </p>
          </div>
        </div>

        {/* Suggested Tweet */}
        <div className="mb-4">
          <div className="text-xs text-gray-500 mb-2 px-1">
            Suggested Content
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-[#1da1f2] flex items-center justify-center text-white text-xs font-bold">
                G
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold text-[#1a1a3e]">
                  Garden Finance
                </span>
                <span className="text-xs text-gray-500">@garden_finance</span>
              </div>
            </div>

            {/* Tweet Content */}
            <p className="text-[#1a1a3e] text-sm whitespace-pre-line leading-relaxed">
              {suggestion.content}
            </p>

            {/* Action Row (NEW 🔥) */}
            <div className="flex items-center justify-between mt-4">
              {/* REAL ACTIONS */}
              <div className="flex items-center gap-2">
                {/* Copy Button */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(suggestion.content);
                  }}
                  className="text-xs px-3 py-1 rounded-full border border-gray-200 hover:bg-gray-100 text-[#1a1a3e]"
                >
                  Copy
                </button>

                {/* Post to X Button */}
                <button
                  onClick={() => {
                    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                      suggestion.content,
                    )}`;
                    window.open(url, "_blank");
                  }}
                  className="text-xs px-3 py-1 rounded-full bg-[#1da1f2] text-white hover:bg-[#1a8cd8]"
                >
                  Post it to X
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Signal Tags */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {suggestion.category && (
            <div className="bg-purple-100 border border-purple-200 rounded-full px-3 py-1">
              <span className="text-xs font-medium text-purple-700">
                {suggestion.category}
              </span>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-full px-3 py-1">
            <span className="text-xs font-medium text-[#1a1a3e]">
              {suggestion.agentType}
            </span>
          </div>

          {suggestion.performance && (
            <div className="bg-white border border-gray-200 rounded-full px-3 py-1">
              <span className="text-xs font-medium text-[#1a1a3e]">
                {suggestion.performance}% score
              </span>
            </div>
          )}
        </div>

        {/* Character Bar */}
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div
              className="bg-green-500 h-1 rounded-full"
              style={{
                width: `${Math.min((suggestion.content.length / 280) * 100, 100)}%`,
              }}
            ></div>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">
              {suggestion.content.length}/280
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button
            onClick={() => onApprove(suggestion.id)}
            className="bg-green-500 hover:bg-green-600 text-white rounded-full px-6 py-2 font-medium shadow-none border-0 flex items-center gap-2"
            disabled={suggestion.status !== "pending"}
          >
            <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
              <Check className="w-2.5 h-2.5 text-green-500" />
            </div>
            approve
          </Button>

          <Button
            onClick={() => onReject(suggestion.id)}
            className="bg-amber-400 hover:bg-amber-500 text-white rounded-full px-6 py-2 font-medium shadow-none border-0 flex items-center gap-2"
            disabled={suggestion.status !== "pending"}
          >
            <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
              <X className="w-2.5 h-2.5 text-amber-400" />
            </div>
            reject
          </Button>

          <Button
            onClick={() => onExpand(suggestion.id)}
            className="bg-slate-400 hover:bg-slate-500 text-white rounded-full px-6 py-2 font-medium shadow-none border-0 flex items-center gap-2"
          >
            <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
              <MoreHorizontal className="w-2.5 h-2.5 text-slate-400" />
            </div>
            expand to thread
          </Button>
        </div>

        {/* Status indicator */}
        {suggestion.status !== "pending" && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Badge
              variant={
                suggestion.status === "approved" ? "default" : "destructive"
              }
              className={`rounded-full ${suggestion.status === "approved" ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"}`}
            >
              {suggestion.status}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

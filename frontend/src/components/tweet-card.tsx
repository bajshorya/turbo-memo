import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Check, X, MoreHorizontal } from "lucide-react"
import { TweetSuggestion } from "@/lib/store"

interface TweetCardProps {
  suggestion: TweetSuggestion
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onExpand: (id: string) => void
}

export function TweetCard({ suggestion, onApprove, onReject, onExpand }: TweetCardProps) {
  return (
    <Card className="bg-[#eff4f9] border-0 shadow-sm rounded-2xl overflow-hidden">
      <CardContent className="p-6">
        {/* Header with Sub Agent and Performance */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-white border border-gray-200 rounded-full px-3 py-1">
              <span className="text-sm font-medium text-[#1a1a3e]">Sub Agent</span>
            </div>
            <div className="bg-white border border-gray-200 rounded-full px-3 py-1">
              <span className="text-sm font-medium text-[#1a1a3e]">{suggestion.agentType}</span>
            </div>
            {suggestion.performance && (
              <div className="bg-white border border-gray-200 rounded-full px-3 py-1 flex items-center gap-2">
                <span className="text-sm font-medium text-[#1a1a3e]">{suggestion.performance}%</span>
              </div>
            )}
          </div>
          <span className="text-sm text-gray-500">{suggestion.timestamp}</span>
        </div>

        {/* Competitor VS Bar */}
        <div className="mb-4">
          <div className="bg-white border border-gray-200 rounded-full px-4 py-2 inline-block">
            <span className="text-sm font-medium text-[#1a1a3e]">
              Designers: $4.2B. That's what happens when you build a protocol people actually want to use.
            </span>
          </div>
        </div>
        
        {/* Tweet Content */}
        <div className="mb-4">
          <p className="text-[#1a1a3e] leading-relaxed text-base font-normal">
            {suggestion.content}
          </p>
        </div>

        {/* Signal Tags */}
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-white border border-gray-200 rounded-full px-3 py-1">
            <span className="text-xs font-medium text-[#1a1a3e]">Volume Agent</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-full px-3 py-1">
            <span className="text-xs font-medium text-[#1a1a3e]">18%</span>
          </div>
        </div>

        {/* Character Bar */}
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div 
              className="bg-green-500 h-1 rounded-full" 
              style={{ width: `${Math.min((suggestion.content.length / 280) * 100, 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">{suggestion.content.length}/280</span>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button
            onClick={() => onApprove(suggestion.id)}
            className="bg-green-500 hover:bg-green-600 text-white rounded-full px-6 py-2 font-medium shadow-none border-0 flex items-center gap-2"
            disabled={suggestion.status !== 'pending'}
          >
            <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
              <Check className="w-2.5 h-2.5 text-green-500" />
            </div>
            approve
          </Button>
          
          <Button
            onClick={() => onReject(suggestion.id)}
            className="bg-amber-400 hover:bg-amber-500 text-white rounded-full px-6 py-2 font-medium shadow-none border-0 flex items-center gap-2"
            disabled={suggestion.status !== 'pending'}
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
        {suggestion.status !== 'pending' && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Badge 
              variant={suggestion.status === 'approved' ? 'default' : 'destructive'}
              className={`rounded-full ${suggestion.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}
            >
              {suggestion.status}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
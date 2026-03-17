import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

export function Sidebar() {
  const suggestedTweets = [
    "Suggested tweet from the agent with the collective feed",
    "Suggested tweet from the agent with the collective feed", 
    "Suggested tweet from the agent with the collective feed",
    "Suggested tweet from the agent with the collective feed"
  ]

  return (
    <div className="w-80 space-y-6 bg-[#ebf0f5] p-4 rounded-2xl h-fit">
      {/* Running Status */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        Running...
      </div>

      {/* Suggested Tweets */}
      <Card className="border-gray-200 bg-white rounded-2xl shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-[#1a1a3e]">Suggested Tweets</CardTitle>
            <Button variant="ghost" size="sm" className="text-[#1a1a3e] hover:bg-gray-50 rounded-full">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-white border border-gray-200 rounded-full px-3 py-1">
              <span className="text-sm font-medium text-[#1a1a3e]">Super Agent</span>
            </div>
            <div className="bg-white border border-gray-200 rounded-full px-3 py-1">
              <span className="text-sm font-medium text-[#1a1a3e]">20</span>
            </div>
          </div>
          
          {suggestedTweets.map((tweet, index) => (
            <div key={index} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-sm text-[#1a1a3e]">{tweet}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
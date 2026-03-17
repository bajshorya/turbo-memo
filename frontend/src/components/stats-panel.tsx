import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { FinancialMetric, AgentPerformance } from "@/lib/store"

interface StatsPanelProps {
  financialMetrics: FinancialMetric[]
  agentPerformance: AgentPerformance[]
}

export function StatsPanel({ financialMetrics, agentPerformance }: StatsPanelProps) {
  return (
    <div className="w-80 space-y-6">
      {/* Financial Metrics */}
      <Card className="border-gray-200 bg-white rounded-2xl shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 gap-6">
            {financialMetrics.map((metric, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl font-bold text-[#1a1a3e] mb-1">
                  {metric.value}
                </div>
                <div className="text-sm text-gray-600">
                  {metric.label}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Agent Performance */}
      <Card className="border-gray-200 bg-white rounded-2xl shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-[#1a1a3e] mb-4">Agent Performance</h3>
          <div className="space-y-4">
            {agentPerformance.map((agent, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-gray-600">{agent.type}</div>
                    <div className="font-semibold text-[#1a1a3e]">{agent.name}</div>
                  </div>
                  <div className="text-lg font-bold text-[#1a1a3e]">
                    {agent.percentage}%
                  </div>
                </div>
                <Progress value={agent.percentage} className="h-2 bg-gray-200" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, RefreshCw } from "lucide-react";
import {
  Combobox,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox";

import { useState } from "react";
import { useDashboardStore } from "@/lib/store";
export function Controls() {
  const {
    fetchVolumeData,
    fetchCategoryData,
    nextVolumeItem,
    nextCategoryItem,
  } = useDashboardStore();
  const [selectedAgent, setSelectedAgent] = useState("");
  const [selectedFeed, setSelectedFeed] = useState("all-feed");
  const agents = [
    {
      value: "volume-analyser",
      label: "Volume Analyser",
      category: "Volume Analyser",
    },
    {
      value: "category-volume-analyzer",
      label: "Category Volume",
      category: "Category Volume",
    },
    { value: "tvl-agent", label: "TVL Agent", category: "TVL Agent" },
    { value: "super-agent", label: "Super Agent", category: "Super Agent" },
  ];

  const handleAgentChange = (value: string | null) => {
    setSelectedAgent(value || "");

    if (value === "volume-analyser") {
      fetchVolumeData();
    }

    if (value === "category-volume-analyzer") {
      fetchCategoryData();
    }
  };

  return (
    <div className="border-b border-gray-200 bg-[#e4ebf2]">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Left side controls */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="h-12 min-h-12 bg-[#f8f8f8] text-[#473c75] border-gray-200 hover:bg-gray-50 rounded-full px-4"
          >
            For AI Agents
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant={selectedFeed === "all-feed" ? "default" : "outline"}
              onClick={() => setSelectedFeed("all-feed")}
              className={`h-12 min-h-12 rounded-full px-4 font-medium ${
                selectedFeed === "all-feed"
                  ? "bg-[#473c75] text-[#e8e6ee] hover:bg-[#473c75]/90"
                  : "bg-[#f8f8f8] text-[#473c75] border-gray-200 hover:bg-gray-50"
              }`}
            >
              All Feed
            </Button>

            {/* Sub-Agents Combobox */}
            <Combobox value={selectedAgent} onValueChange={handleAgentChange}>
              <ComboboxTrigger
                className={`h-12 min-h-12 border-gray-200 rounded-full px-4 font-medium ${
                  selectedAgent
                    ? "bg-[#473c75] text-[#e8e6ee]"
                    : "bg-[#f8f8f8] text-[#473c75] hover:bg-gray-50"
                }`}
              >
                <ComboboxValue placeholder="Select a sub agent" />
              </ComboboxTrigger>
              <ComboboxContent className="bg-white border-gray-200 rounded-xl shadow-lg">
                <ComboboxList>
                  {agents.map((agent) => (
                    <ComboboxItem
                      key={agent.value}
                      value={agent.value}
                      className="text-[#473c75] focus:bg-gray-50"
                    >
                      <div>
                        <div className="font-medium">{agent.label}</div>
                        <div className="text-xs text-gray-500">
                          {agent.category}
                        </div>
                      </div>
                    </ComboboxItem>
                  ))}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="h-12 min-h-12 bg-[#f8f8f8] text-[#473c75] border-gray-200 hover:bg-gray-50 rounded-full px-4"
          >
            Today
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (selectedAgent === "volume-analyser") {
                nextVolumeItem();
              } else if (selectedAgent === "category-volume-analyzer") {
                nextCategoryItem();
              }
            }}
            className="h-12 min-h-12 bg-[#f8f8f8] text-[#473c75] hover:bg-gray-50 rounded-full px-4"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
}

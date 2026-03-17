import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useDashboardStore } from "@/lib/store";

export function Controls() {
  const {
    nextVolumeItem,
    nextCategoryItem,
    fetchVolumeData,
    fetchCategoryData,
    apiData,
    apiDataCategory,
  } = useDashboardStore();

  return (
    <div className="border-b border-gray-200 bg-[#e4ebf2]">
      <div className="flex justify-end px-6 py-3">
        <Button
          onClick={() => {
            if (!apiData.length) fetchVolumeData();
            else nextVolumeItem();

            if (!apiDataCategory.length) fetchCategoryData();
            else nextCategoryItem();
          }}
          className="h-12 bg-[#f8f8f8] text-[#473c75] rounded-full px-4"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>
    </div>
  );
}

"use client"

import { Search } from "lucide-react"
import Image from "next/image"
import { useDashboardStore } from "@/lib/store"

export function Header() {
  const { searchQuery, setSearchQuery } = useDashboardStore()

  return (
    <header className="border-b border-gray-200 sticky top-0 z-50 bg-[#e4ebf2]">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-2">
          <Image
            src="/garden-logo.svg"
            alt="Garden Finance Logo"
            width={32}
            height={32}
            className="w-[124px] h-[34px]"
          />
          <span className="font-semibold text-[24px] text-[#1a1a3e] tracking-tight mb-1">x Turbomemo</span>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 flex-1 max-w-md mx-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by keywords"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#1a1a3e] focus:border-transparent bg-white text-[#1a1a3e]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2" />
      </div>
    </header>
  )
}
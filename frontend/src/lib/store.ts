import { create } from "zustand";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

export interface AgentDataItem {
  id: number;
  category: string;
  metric: string;
  value: string;
  raw_value: number;
  insight: string;
  suggested_tweet: string;
}

interface AgentFeedState {
  data: AgentDataItem[];
  currentIndex: number;
  loading: boolean;
  error: string | null;
}

interface DashboardState {
  volumeFeed: AgentFeedState;
  categoryFeed: AgentFeedState;
  feesFeed: AgentFeedState;
  assetFeed: AgentFeedState;
  superAgentFeed: AgentFeedState;

  // Global loading state
  isRefreshing: boolean;

  // Refresh cooldown
  lastRefreshTime: number;

  // Fetch actions
  fetchVolumeData: () => Promise<void>;
  fetchCategoryData: () => Promise<void>;
  fetchFeesData: () => Promise<void>;
  fetchAssetData: () => Promise<void>;
  fetchSuperAgentData: () => Promise<void>;
  fetchAllFeeds: () => Promise<void>;

  // Navigate actions (forward/backward) — sub agents only
  nextVolume: () => void;
  prevVolume: () => void;
  nextCategory: () => void;
  prevCategory: () => void;
  nextFees: () => void;
  prevFees: () => void;
  nextAsset: () => void;
  prevAsset: () => void;

  // Check if all sub-agents are at max
  allSubAgentsAtMax: () => boolean;

  // Search / filter
  selectedExchange: string;
  searchQuery: string;
  setSelectedExchange: (exchange: string) => void;
  setSearchQuery: (query: string) => void;
}

const defaultFeed: AgentFeedState = {
  data: [],
  currentIndex: 0,
  loading: false,
  error: null,
};

const MAX_CARDS = 5;
const REFRESH_COOLDOWN = 15_000; // 15 seconds
const LOADING_DURATION_MIN = 10_000; // 10 seconds
const LOADING_DURATION_MAX = 15_000; // 15 seconds

async function fetchFeed(endpoint: string): Promise<AgentDataItem[]> {
  // Add artificial delay for skeleton loading
  const loadingTime = Math.random() * (LOADING_DURATION_MAX - LOADING_DURATION_MIN) + LOADING_DURATION_MIN;
  
  await new Promise(resolve => setTimeout(resolve, loadingTime));
  
  const res = await fetch(`${BASE_URL}${endpoint}`);
  if (!res.ok) throw new Error(`Failed to fetch ${endpoint}`);
  const data: AgentDataItem[] = await res.json();
  return data;
}

function isAtMax(feed: AgentFeedState): boolean {
  if (feed.data.length === 0) return false;
  const maxIndex = Math.min(feed.data.length - 1, MAX_CARDS - 1);
  return feed.currentIndex >= maxIndex;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  selectedExchange: "all-dex",
  searchQuery: "",
  lastRefreshTime: 0,
  isRefreshing: false,

  volumeFeed: { ...defaultFeed },
  categoryFeed: { ...defaultFeed },
  feesFeed: { ...defaultFeed },
  assetFeed: { ...defaultFeed },
  superAgentFeed: { ...defaultFeed },

  // ── Fetch ──────────────────────────────────────────
  fetchVolumeData: async () => {
    set({ volumeFeed: { ...defaultFeed, loading: true } });
    try {
      const data = await fetchFeed("/agent/volume-analyzer");
      set({ volumeFeed: { data, currentIndex: 0, loading: false, error: null } });
    } catch (e: any) {
      set({ volumeFeed: { ...defaultFeed, loading: false, error: e.message } });
    }
  },

  fetchCategoryData: async () => {
    set({ categoryFeed: { ...defaultFeed, loading: true } });
    try {
      const data = await fetchFeed("/agent/category-volume-analyzer");
      set({ categoryFeed: { data, currentIndex: 0, loading: false, error: null } });
    } catch (e: any) {
      set({ categoryFeed: { ...defaultFeed, loading: false, error: e.message } });
    }
  },

  fetchFeesData: async () => {
    set({ feesFeed: { ...defaultFeed, loading: true } });
    try {
      const data = await fetchFeed("/agent/fees-analyzer");
      set({ feesFeed: { data, currentIndex: 0, loading: false, error: null } });
    } catch (e: any) {
      set({ feesFeed: { ...defaultFeed, loading: false, error: e.message } });
    }
  },

  fetchAssetData: async () => {
    set({ assetFeed: { ...defaultFeed, loading: true } });
    try {
      const data = await fetchFeed("/agent/asset-analyzer");
      set({ assetFeed: { data, currentIndex: 0, loading: false, error: null } });
    } catch (e: any) {
      set({ assetFeed: { ...defaultFeed, loading: false, error: e.message } });
    }
  },

  fetchSuperAgentData: async () => {
    set({ superAgentFeed: { ...defaultFeed, loading: true } });
    try {
      const data = await fetchFeed("/agent/super-agent");
      set({ superAgentFeed: { data, currentIndex: 0, loading: false, error: null } });
    } catch (e: any) {
      set({ superAgentFeed: { ...defaultFeed, loading: false, error: e.message } });
    }
  },

  fetchAllFeeds: async () => {
    const now = Date.now();
    const { lastRefreshTime } = get();
    // Enforce 15s cooldown (skip on first load when lastRefreshTime is 0)
    if (lastRefreshTime > 0 && now - lastRefreshTime < REFRESH_COOLDOWN) {
      return;
    }
    
    set({ lastRefreshTime: now, isRefreshing: true });
    
    const { fetchVolumeData, fetchCategoryData, fetchFeesData, fetchAssetData } = get();
    
    try {
      // Only fetch sub-agent data, not super agent
      await Promise.all([
        fetchVolumeData(), 
        fetchCategoryData(), 
        fetchFeesData(), 
        fetchAssetData()
      ]);
    } finally {
      set({ isRefreshing: false });
    }
  },

  // ── Navigate (next/prev with max 5 cap) ───────────
  nextVolume: () => {
    const state = get();
    const { volumeFeed } = state;
    if (!volumeFeed.data.length) return;
    const maxIndex = Math.min(volumeFeed.data.length - 1, MAX_CARDS - 1);
    if (volumeFeed.currentIndex < maxIndex) {
      const updated = { ...volumeFeed, currentIndex: volumeFeed.currentIndex + 1 };
      set({ volumeFeed: updated });
      // Check if all at max after update
      if (isAtMax(updated) && isAtMax(state.categoryFeed) && isAtMax(state.feesFeed) && isAtMax(state.assetFeed)) {
        get().fetchAllFeeds();
      }
    }
  },
  prevVolume: () => {
    const { volumeFeed } = get();
    if (volumeFeed.currentIndex > 0) {
      set({ volumeFeed: { ...volumeFeed, currentIndex: volumeFeed.currentIndex - 1 } });
    }
  },

  nextCategory: () => {
    const state = get();
    const { categoryFeed } = state;
    if (!categoryFeed.data.length) return;
    const maxIndex = Math.min(categoryFeed.data.length - 1, MAX_CARDS - 1);
    if (categoryFeed.currentIndex < maxIndex) {
      const updated = { ...categoryFeed, currentIndex: categoryFeed.currentIndex + 1 };
      set({ categoryFeed: updated });
      if (isAtMax(state.volumeFeed) && isAtMax(updated) && isAtMax(state.feesFeed) && isAtMax(state.assetFeed)) {
        get().fetchAllFeeds();
      }
    }
  },
  prevCategory: () => {
    const { categoryFeed } = get();
    if (categoryFeed.currentIndex > 0) {
      set({ categoryFeed: { ...categoryFeed, currentIndex: categoryFeed.currentIndex - 1 } });
    }
  },

  nextFees: () => {
    const state = get();
    const { feesFeed } = state;
    if (!feesFeed.data.length) return;
    const maxIndex = Math.min(feesFeed.data.length - 1, MAX_CARDS - 1);
    if (feesFeed.currentIndex < maxIndex) {
      const updated = { ...feesFeed, currentIndex: feesFeed.currentIndex + 1 };
      set({ feesFeed: updated });
      if (isAtMax(state.volumeFeed) && isAtMax(state.categoryFeed) && isAtMax(updated) && isAtMax(state.assetFeed)) {
        get().fetchAllFeeds();
      }
    }
  },
  prevFees: () => {
    const { feesFeed } = get();
    if (feesFeed.currentIndex > 0) {
      set({ feesFeed: { ...feesFeed, currentIndex: feesFeed.currentIndex - 1 } });
    }
  },

  nextAsset: () => {
    const state = get();
    const { assetFeed } = state;
    if (!assetFeed.data.length) return;
    const maxIndex = Math.min(assetFeed.data.length - 1, MAX_CARDS - 1);
    if (assetFeed.currentIndex < maxIndex) {
      const updated = { ...assetFeed, currentIndex: assetFeed.currentIndex + 1 };
      set({ assetFeed: updated });
      if (isAtMax(state.volumeFeed) && isAtMax(state.categoryFeed) && isAtMax(state.feesFeed) && isAtMax(updated)) {
        get().fetchAllFeeds();
      }
    }
  },
  prevAsset: () => {
    const { assetFeed } = get();
    if (assetFeed.currentIndex > 0) {
      set({ assetFeed: { ...assetFeed, currentIndex: assetFeed.currentIndex - 1 } });
    }
  },

  allSubAgentsAtMax: () => {
    const { volumeFeed, categoryFeed, feesFeed, assetFeed } = get();
    return isAtMax(volumeFeed) && isAtMax(categoryFeed) && isAtMax(feesFeed) && isAtMax(assetFeed);
  },

  // ── Filter ────────────────────────────────────────
  setSelectedExchange: (exchange) => set({ selectedExchange: exchange }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));

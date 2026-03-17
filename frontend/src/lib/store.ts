import { create } from "zustand";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

// Fisher-Yates shuffle
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

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
  // Per-agent feed state
  volumeFeed: AgentFeedState;
  categoryFeed: AgentFeedState;
  feesFeed: AgentFeedState;

  // Fetch actions
  fetchVolumeData: () => Promise<void>;
  fetchCategoryData: () => Promise<void>;
  fetchFeesData: () => Promise<void>;
  fetchAllFeeds: () => Promise<void>;

  // Swipe / advance actions
  advanceVolume: () => void;
  advanceCategory: () => void;
  advanceFees: () => void;

  // Search / filter (kept from original)
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

async function fetchFeed(endpoint: string): Promise<AgentDataItem[]> {
  const res = await fetch(`${BASE_URL}${endpoint}`);
  if (!res.ok) throw new Error(`Failed to fetch ${endpoint}`);
  const data: AgentDataItem[] = await res.json();
  return shuffle(data);
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  selectedExchange: "all-dex",
  searchQuery: "",

  volumeFeed: { ...defaultFeed },
  categoryFeed: { ...defaultFeed },
  feesFeed: { ...defaultFeed },

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

  fetchAllFeeds: async () => {
    const { fetchVolumeData, fetchCategoryData, fetchFeesData } = get();
    await Promise.all([fetchVolumeData(), fetchCategoryData(), fetchFeesData()]);
  },

  // ── Advance (swipe) ───────────────────────────────
  advanceVolume: () => {
    const { volumeFeed } = get();
    if (!volumeFeed.data.length) return;
    // Move the front card to the back of the deck
    const newData = [...volumeFeed.data.slice(1), volumeFeed.data[0]];
    set({ volumeFeed: { ...volumeFeed, data: newData } });
  },

  advanceCategory: () => {
    const { categoryFeed } = get();
    if (!categoryFeed.data.length) return;
    const newData = [...categoryFeed.data.slice(1), categoryFeed.data[0]];
    set({ categoryFeed: { ...categoryFeed, data: newData } });
  },

  advanceFees: () => {
    const { feesFeed } = get();
    if (!feesFeed.data.length) return;
    const newData = [...feesFeed.data.slice(1), feesFeed.data[0]];
    set({ feesFeed: { ...feesFeed, data: newData } });
  },

  // ── Filter ────────────────────────────────────────
  setSelectedExchange: (exchange) => set({ selectedExchange: exchange }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));

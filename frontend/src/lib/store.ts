import { create } from "zustand";

export interface TweetSuggestion {
  id: string;
  agent: string;
  content: string;
  timestamp: string;
  status: "pending" | "approved" | "rejected";
  agentType: string;
  performance?: number;
  exchange?: string;
  category?: string;
  metric?: string;
  value?: string;
  insight?: string;
}

export interface FinancialMetric {
  label: string;
  value: string;
  change?: string;
}

export interface AgentPerformance {
  name: string;
  percentage: number;
  type: string;
}

interface DashboardState {
  tweetSuggestions: TweetSuggestion[];

  // ✅ Volume Agent
  apiData: any[];
  currentIndex: number;
  fetchVolumeData: () => Promise<void>;
  nextVolumeItem: () => void;

  // ✅ Category Agent
  apiDataCategory: any[];
  currentIndexCategory: number;
  fetchCategoryData: () => Promise<void>;
  nextCategoryItem: () => void;

  // ✅ shared helper
  setTweetFromApi: (data: any, type: "volume" | "category") => void;

  selectedExchange: string;
  searchQuery: string;

  approveTweet: (id: string) => void;
  rejectTweet: (id: string) => void;
  expandToThread: (id: string) => void;
  setSelectedExchange: (exchange: string) => void;
  setSearchQuery: (query: string) => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  selectedExchange: "all-dex",
  searchQuery: "",

  tweetSuggestions: [],

  // =========================
  // ✅ VOLUME AGENT
  // =========================
  apiData: [],
  currentIndex: 0,

  fetchVolumeData: async () => {
    const res = await fetch("http://localhost:3001/agent/volume-analyzer");
    const data = await res.json();

    set({
      apiData: data,
      currentIndex: 0,
    });

    if (data.length > 0) {
      get().setTweetFromApi(data[0], "volume");
    }
  },

  nextVolumeItem: () => {
    const { currentIndex, apiData } = get();
    if (!apiData.length) return;

    const nextIndex = (currentIndex + 1) % apiData.length;

    set({ currentIndex: nextIndex });
    get().setTweetFromApi(apiData[nextIndex], "volume");
  },

  // =========================
  // ✅ CATEGORY AGENT
  // =========================
  apiDataCategory: [],
  currentIndexCategory: 0,

  fetchCategoryData: async () => {
    const res = await fetch(
      "http://localhost:3001/agent/category-volume-analyzer",
    );
    const data = await res.json();

    set({
      apiDataCategory: data,
      currentIndexCategory: 0,
    });

    if (data.length > 0) {
      get().setTweetFromApi(data[0], "category");
    }
  },

  nextCategoryItem: () => {
    const { currentIndexCategory, apiDataCategory } = get();
    if (!apiDataCategory.length) return;

    const nextIndex = (currentIndexCategory + 1) % apiDataCategory.length;

    set({ currentIndexCategory: nextIndex });
    get().setTweetFromApi(apiDataCategory[nextIndex], "category");
  },

  // =========================
  // ✅ COMMON MAPPER
  // =========================
  setTweetFromApi: (data, type) => {
    if (!data) return;

    const tweet: TweetSuggestion = {
      id: type === "category" ? `cat-${data.id}` : `vol-${data.id}`,

      agent: type === "category" ? "Category Volume Agent" : "Volume Agent",

      agentType: type === "category" ? "Category Volume" : "Volume Agent",

      content: data.suggested_tweet,
      timestamp: "just now",
      status: "pending",
      performance: Math.floor(Math.random() * 100),
      exchange: "garden",

      category: data.category,
      metric: data.metric,
      value: data.value,
      insight: data.insight,
    };

    set({
      tweetSuggestions: [tweet], // always 1 card
    });
  },

  // =========================
  // ✅ ACTIONS
  // =========================
  approveTweet: (id) =>
    set((state) => ({
      tweetSuggestions: state.tweetSuggestions.map((tweet) =>
        tweet.id === id ? { ...tweet, status: "approved" } : tweet,
      ),
    })),

  rejectTweet: (id) =>
    set((state) => ({
      tweetSuggestions: state.tweetSuggestions.map((tweet) =>
        tweet.id === id ? { ...tweet, status: "rejected" } : tweet,
      ),
    })),

  expandToThread: (id) => {
    console.log("Expanding tweet to thread:", id);
  },

  setSelectedExchange: (exchange) =>
    set(() => ({ selectedExchange: exchange })),

  setSearchQuery: (query) => set(() => ({ searchQuery: query })),
}));

import { create } from "zustand";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

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

interface DashboardState {
  tweetSuggestions: TweetSuggestion[];

  apiData: any[];
  apiDataCategory: any[];

  currentIndex: number;
  currentIndexCategory: number;

  fetchVolumeData: () => Promise<void>;
  fetchCategoryData: () => Promise<void>;

  nextVolumeItem: () => void;
  nextCategoryItem: () => void;

  setTweetFromApi: (data: any, type: "volume" | "category") => void;

  approveTweet: (id: string) => void;
  rejectTweet: (id: string) => void;
  expandToThread: (id: string) => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  tweetSuggestions: [],

  apiData: [],
  apiDataCategory: [],

  currentIndex: 0,
  currentIndexCategory: 0,

  // =========================
  // FETCH VOLUME
  // =========================
  fetchVolumeData: async () => {
    try {
      const res = await fetch(`${BASE_URL}/agent/volume-analyzer`);
      const data = await res.json();

      set({
        apiData: data,
        currentIndex: 0,
      });

      if (data.length > 0) {
        get().setTweetFromApi(data[0], "volume");
      }
    } catch (err) {
      console.error("Volume fetch error:", err);
    }
  },

  // =========================
  // FETCH CATEGORY
  // =========================
  fetchCategoryData: async () => {
    try {
      const res = await fetch(`${BASE_URL}/agent/category-volume-analyzer`);
      const data = await res.json();

      set({
        apiDataCategory: data,
        currentIndexCategory: 0,
      });

      if (data.length > 0) {
        get().setTweetFromApi(data[0], "category");
      }
    } catch (err) {
      console.error("Category fetch error:", err);
    }
  },

  // =========================
  // NEXT ITEM (ROTATION)
  // =========================
  nextVolumeItem: () => {
    const { apiData, currentIndex } = get();
    if (!apiData.length) return;

    const nextIndex = (currentIndex + 1) % apiData.length;

    set({ currentIndex: nextIndex });
    get().setTweetFromApi(apiData[nextIndex], "volume");
  },

  nextCategoryItem: () => {
    const { apiDataCategory, currentIndexCategory } = get();
    if (!apiDataCategory.length) return;

    const nextIndex = (currentIndexCategory + 1) % apiDataCategory.length;

    set({ currentIndexCategory: nextIndex });
    get().setTweetFromApi(apiDataCategory[nextIndex], "category");
  },

  // =========================
  // KEEP ONLY 2 CARDS
  // =========================
  setTweetFromApi: (data, type) => {
    if (!data) return;

    const tweet: TweetSuggestion = {
      id: type === "category" ? `cat-${data.id}` : `vol-${data.id}`,
      agent: type === "category" ? "Category Volume Agent" : "Volume Agent",
      agentType: type === "category" ? "Category Volume" : "Volume",
      content: data.suggested_tweet,
      timestamp: new Date().toISOString(),
      status: "pending",
      performance: Math.floor(Math.random() * 100),
      exchange: "garden",
      category: data.category,
      metric: data.metric,
      value: data.value,
      insight: data.insight,
    };

    set((state) => {
      const filtered = state.tweetSuggestions.filter((t) =>
        type === "volume" ? !t.id.startsWith("vol-") : !t.id.startsWith("cat-"),
      );

      return {
        tweetSuggestions: [tweet, ...filtered],
      };
    });
  },

  // =========================
  // ACTIONS
  // =========================
  approveTweet: (id) =>
    set((state) => ({
      tweetSuggestions: state.tweetSuggestions.map((t) =>
        t.id === id ? { ...t, status: "approved" } : t,
      ),
    })),

  rejectTweet: (id) =>
    set((state) => ({
      tweetSuggestions: state.tweetSuggestions.map((t) =>
        t.id === id ? { ...t, status: "rejected" } : t,
      ),
    })),

  expandToThread: (id) => {
    console.log("Expand:", id);
  },
}));

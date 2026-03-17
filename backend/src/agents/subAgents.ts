// src/agents/subAgents.ts
// All five sub-agents with hardcoded data sources.
// When you're ready for real APIs, only fetchData() needs to change.

import { BaseAgent } from "../baseAgent.js";
import type {
  VolumeData,
  QuoteData,
  PartnerData,
  CompetitorData,
  TrendData,
} from "../types.js";

// ── 1. Volume Agent ───────────────────────────────────────────────────────────

export class VolumeAgent extends BaseAgent<VolumeData> {
  constructor() {
    super(
      "VolumeAgent",
      "swap_volume",
      `You are a DeFi data analyst for garden.finance, a cross-chain swap protocol.
Your job is to analyze swap volume data and extract key positive highlights.
Focus on growth, records, milestones, and trends. Be factual and specific with numbers.
Never fabricate numbers. If data shows a decline, frame it neutrally — do not call it negative.`,
    );
  }

  async fetchData(): Promise<VolumeData> {
    // 🔧 Replace this return with an axios/fetch call when real API is ready
    return {
      date: new Date().toISOString().split("T")[0],
      volume_24h_usd: 4_200_000,
      swap_count_24h: 1_847,
      unique_users_24h: 634,
      volume_7d_usd: 27_500_000,
      volume_change_pct: 18.4,
      top_pairs: [
        { pair: "BTC/ETH", volume_usd: 1_200_000 },
        { pair: "BTC/USDC", volume_usd: 980_000 },
        { pair: "ETH/USDC", volume_usd: 640_000 },
      ],
    };
  }
}

// ── 2. Quote Agent ────────────────────────────────────────────────────────────

export class QuoteAgent extends BaseAgent<QuoteData> {
  constructor() {
    super(
      "QuoteAgent",
      "quote_analysis",
      `You are a DeFi trading analyst for garden.finance.
Analyze quote data to highlight competitive pricing, low slippage, and favorable rates.
Focus on what makes garden's quotes stand out. Be specific and factual with basis points.`,
    );
  }

  async fetchData(): Promise<QuoteData> {
    // 🔧 Replace this return with an axios/fetch call when real API is ready
    return {
      timestamp: new Date().toISOString(),
      avg_slippage_bps: 12,
      avg_spread_bps: 8,
      quote_count_24h: 9_200,
      avg_execution_time_ms: 420,
      best_rate_pairs: ["BTC/ETH", "BTC/USDC", "ETH/ARB"],
    };
  }
}

// ── 3. Partner Agent ──────────────────────────────────────────────────────────

export class PartnerAgent extends BaseAgent<PartnerData> {
  constructor() {
    super(
      "PartnerAgent",
      "partner_integrations",
      `You are a business development analyst for garden.finance.
Analyze data about partner integrations and ecosystem growth.
Highlight new integrations, volume driven by partners, and ecosystem expansion milestones.
Frame everything positively and factually.`,
    );
  }

  async fetchData(): Promise<PartnerData> {
    // 🔧 Replace this return with an axios/fetch call when real API is ready
    return {
      timestamp: new Date().toISOString(),
      active_partners: 14,
      partner_volume_24h_usd: 1_800_000,
      partner_volume_share_pct: 43,
      new_integrations_7d: [
        { name: "Phantom Wallet", date: "2025-03-14", type: "wallet" },
        { name: "OKX Web3", date: "2025-03-16", type: "wallet" },
      ],
      top_partners_by_volume: ["Phantom", "Exodus", "OKX Web3"],
    };
  }
}

// ── 4. Competitor Agent ───────────────────────────────────────────────────────

export class CompetitorAgent extends BaseAgent<CompetitorData> {
  constructor() {
    super(
      "CompetitorAgent",
      "competitor_landscape",
      `You are a competitive intelligence analyst for garden.finance.
Analyze competitor data to find areas where garden.finance leads or has advantages.
IMPORTANT: Only surface positive comparisons for garden.finance.
Do NOT generate content that criticizes competitors by name.
Focus on garden's strengths: better rates, faster execution, more chain support, lower fees.`,
    );
  }

  async fetchData(): Promise<CompetitorData> {
    // 🔧 Replace this return with DeFiLlama or your own tracking when ready
    return {
      timestamp: new Date().toISOString(),
      garden_tvl_usd: 38_000_000,
      garden_chains_supported: 9,
      garden_avg_fee_bps: 10,
      garden_avg_execution_ms: 420,
      market_context: [
        { name: "Protocol A", avg_fee_bps: 25, chains: 5 },
        { name: "Protocol B", avg_fee_bps: 18, chains: 7 },
        { name: "Protocol C", avg_fee_bps: 30, chains: 4 },
      ],
    };
  }
}

// ── 5. Trend Agent ────────────────────────────────────────────────────────────

export class TrendAgent extends BaseAgent<TrendData> {
  constructor() {
    super(
      "TrendAgent",
      "community_trends",
      `You are a community and social analyst for garden.finance.
Analyze social and community data to identify positive trends, organic mentions, and growth signals.
Only surface positive or neutral developments. Highlight community enthusiasm and organic reach.`,
    );
  }

  async fetchData(): Promise<TrendData> {
    // 🔧 Replace this return with Twitter API v2 / Discord stats when ready
    return {
      timestamp: new Date().toISOString(),
      twitter_mentions_24h: 312,
      positive_sentiment_pct: 78,
      discord_active_users_24h: 890,
      trending_topics: [
        "BTC swaps",
        "Phantom integration",
        "low fees",
        "cross-chain",
      ],
      top_tweets: [
        {
          text: "Just swapped BTC→ETH via garden in under 10 seconds, no KYC",
          likes: 142,
        },
        {
          text: "Garden Finance quietly becoming the best cross-chain swap out there",
          likes: 89,
        },
      ],
    };
  }
}

// types.ts — shared types across the entire system

export interface AgentOutput {
  agent: string;
  topic: string;
  timestamp: string;
  summary: string;
  highlights: string[];
  sentiment: "positive" | "neutral";
  metrics: Record<string, number | string>;
  rawData?: Record<string, unknown>;
}

export interface Tweet {
  id: string;
  type: "standalone" | "thread";
  content: string;
  data_source: string;
  confidence: "high" | "medium";
  tags: string[];
}

export interface ThreadTweet {
  position: number;
  content: string;
}

export interface Thread {
  topic: string;
  tweets: ThreadTweet[];
}

export interface ContentIdea {
  format: "blog" | "infographic" | "space" | "newsletter";
  title: string;
  angle: string;
  key_data_points: string[];
}

export interface MetricHighlight {
  label: string;
  value: string;
  context: string;
}

export interface SuperAgentResult {
  run_timestamp: string;
  data_summary: string;
  tweets: Tweet[];
  thread: Thread;
  content_ideas: ContentIdea[];
  top_metrics_to_highlight: MetricHighlight[];
  agent_sources?: string[];
  input_record_count?: number;
}

export interface SuperAgentRun {
  id: number;
  timestamp: string;
  result: SuperAgentResult;
}

// Hardcoded data shapes per agent
export interface VolumeData {
  date: string;
  volume_24h_usd: number;
  swap_count_24h: number;
  unique_users_24h: number;
  volume_7d_usd: number;
  volume_change_pct: number;
  top_pairs: Array<{ pair: string; volume_usd: number }>;
}

export interface QuoteData {
  timestamp: string;
  avg_slippage_bps: number;
  avg_spread_bps: number;
  quote_count_24h: number;
  avg_execution_time_ms: number;
  best_rate_pairs: string[];
}

export interface PartnerData {
  timestamp: string;
  active_partners: number;
  partner_volume_24h_usd: number;
  partner_volume_share_pct: number;
  new_integrations_7d: Array<{ name: string; date: string; type: string }>;
  top_partners_by_volume: string[];
}

export interface CompetitorData {
  timestamp: string;
  garden_tvl_usd: number;
  garden_chains_supported: number;
  garden_avg_fee_bps: number;
  garden_avg_execution_ms: number;
  market_context: Array<{ name: string; avg_fee_bps: number; chains: number }>;
}

export interface TrendData {
  timestamp: string;
  twitter_mentions_24h: number;
  positive_sentiment_pct: number;
  discord_active_users_24h: number;
  trending_topics: string[];
  top_tweets: Array<{ text: string; likes: number }>;
}

export type AnyAgentData =
  | VolumeData
  | QuoteData
  | PartnerData
  | CompetitorData
  | TrendData;

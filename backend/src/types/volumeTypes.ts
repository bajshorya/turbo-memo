// src/types/volumeTypes.ts

// ── Raw JSON data shapes (matches your volume.json file) ─────────────────────

export interface VolumeSource {
  source_type: string | { Referrer: { platform: string } };
  url: string;
}

export interface RawVolumeEntry {
  source: VolumeSource;
  orders?: string[];
  total_volume: number;
  total_order_count: number;
  timestamp: string;
}

export interface SourceBreakdown {
  source_type: string;
  total_volume: number;
  total_order_count: number;
}

export interface RawVolumeData {
  volumes: RawVolumeEntry[];
  metadata: {
    total_volume: number;
    total_order_count: number;
    total_volume_by_source: SourceBreakdown[];
  };
}

// ── Processed / aggregated shapes (what we compute before sending to Claude) ──

export interface DailySnapshot {
  date: string; // "2026-01-01"
  total_volume_usd: number;
  total_orders: number;
  sources_active: number;
}

export interface IntegratorStat {
  name: string;
  total_volume: number;
  total_orders: number;
  volume_share_pct: number;
  avg_order_size: number;
}

export interface TimeframeStats {
  label: string; // "last_7d" | "last_30d" | "last_90d" | "last_180d"
  from: string;
  to: string;
  total_volume: number;
  total_orders: number;
  avg_daily_volume: number;
  peak_day: { date: string; volume: number };
  low_day: { date: string; volume: number };
  growth_pct_vs_prior_period: number | null;
}

export interface VolumeSignal {
  type:
    | "all_time_high"
    | "growth_streak"
    | "integrator_milestone"
    | "volume_spike"
    | "new_integrator"
    | "user_milestone"
    | "record_single_day";
  description: string;
  value: number | string;
  date?: string;
}

// ── What Claude returns after analyzing the processed data ────────────────────

export interface VolumeAnalysis {
  summary: string;
  highlights: string[];
  sentiment: "positive" | "neutral";
  signals: VolumeSignal[];
  timeframe_stats: TimeframeStats[];
  top_integrators: IntegratorStat[];
  metrics: {
    total_volume_all_time: number;
    total_orders_all_time: number;
    avg_daily_volume_30d: number;
    peak_daily_volume: number;
    peak_daily_volume_date: string;
    top_integrator_name: string;
    top_integrator_volume_share_pct: number;
    volume_growth_30d_pct: number | null;
    volume_growth_7d_pct: number | null;
  };
  tweet_data_points: string[]; // ready-to-use facts for the super agent
  content_angles: string[]; // narrative angles the super agent can use
}
// backend/src/types/competitorTypes.ts

export interface CompetitorSignal {
  type: string;
  description: string;
  value: string | number;
  competitor?: string;
  date?: string;
}
// Add to src/types/volumeTypes.ts

export interface CategoryVolumeSignal {
  type: string;
  description: string;
  value: number | string;
  date?: string;
}

export interface CategoryVolumeAnalysis {
  summary: string;
  highlights: string[];
  sentiment: "positive" | "neutral";
  signals: CategoryVolumeSignal[];
  metrics: {
    total_volume_all_time: number;
    total_orders_all_time: number;
    total_categories: number;
    dominant_category_name: string;
    dominant_category_volume_share_pct: number;
    category_diversity_index: number;
    volume_growth_30d_pct: number | null;
    volume_growth_7d_pct: number | null;
    avg_daily_volume_30d: number;
    peak_daily_volume: number;
    peak_daily_volume_date: string;
  };
  tweet_data_points: string[];
  content_angles: string[];
}
export interface CompetitorMetrics {
  garden_total_volume: number;
  garden_total_volume_fmt: string;
  competitor_total_volume: number;
  competitor_total_volume_fmt: string;
  garden_market_share_pct: number;
  competitor_market_share_pct: number;
  volume_ratio_garden_to_competitor: number;
  garden_growth_30d_pct: number;
  competitor_growth_30d_pct: number;
  growth_differential_pct: number;
  garden_peak_volume: number;
  competitor_peak_volume: number;
  btc_price: number;
  btc_price_change_30d_pct: number;
  market_correlation_score: number;
}

export interface CompetitorAnalysis {
  summary: string;
  highlights: string[];
  sentiment: "positive" | "neutral" | "cautious";
  signals: CompetitorSignal[];
  metrics: CompetitorMetrics;
  tweet_data_points: string[];
  content_angles: string[];
  strategic_recommendations: string[];
}

// ── MongoDB document shape ────────────────────────────────────────────────────

export interface VolumeAgentDocument {
  agent: "VolumeAgent";
  topic: "swap_volume";
  analyzed_at: Date;
  data_from: string; // ISO date of earliest entry in JSON
  data_to: string; // ISO date of latest entry in JSON
  analysis: VolumeAnalysis;
  raw_summary: {
    total_entries: number;
    unique_sources: number;
    date_range_days: number;
  };
}

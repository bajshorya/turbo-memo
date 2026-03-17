// backend/src/types/feesTypes.ts

export interface RawFeesEntry {
  timestamp: string;
  date: string;
  total_fees_usd: number;
  total_volume_usd: number;
  fees_by_source: Array<{
    source_type: string;
    fees_usd: number;
    volume_usd: number;
    order_count: number;
  }>;
  fees_by_token?: Array<{
    token: string;
    fees_usd: number;
    volume_usd: number;
  }>;
}

export interface RawFeesData {
  fees: RawFeesEntry[];
  metadata: {
    total_fees_all_time: number;
    total_volume_all_time: number;
    total_orders_all_time: number;
    first_data_date: string;
    last_data_date: string;
    average_fee_rate_pct: number;
  };
}

export interface DailyFeesSnapshot {
  date: string;
  total_fees_usd: number;
  total_volume_usd: number;
  total_orders: number;
  avg_fee_per_order_usd: number;
  fee_rate_pct: number; // (fees / volume) * 100
  sources_active: number;
}

export interface FeesBySource {
  name: string;
  total_fees_usd: number;
  total_volume_usd: number;
  total_orders: number;
  fees_share_pct: number;
  volume_share_pct: number;
  avg_fee_per_order_usd: number;
  avg_fee_rate_pct: number;
}

export interface FeesTimeframeStats {
  label: string; // "last_7d", "last_30d", "last_90d", "last_180d"
  from: string;
  to: string;
  total_fees_usd: number;
  total_volume_usd: number;
  total_orders: number;
  avg_daily_fees_usd: number;
  avg_fee_rate_pct: number;
  peak_day: {
    date: string;
    fees_usd: number;
    volume_usd: number;
  };
  growth_pct_vs_prior_period: number | null; // fee growth percentage
}

export interface FeesSignal {
  type:
    | "fee_all_time_high"
    | "revenue_milestone"
    | "fee_rate_spike"
    | "source_milestone"
    | "growth_acceleration"
    | "record_single_day"
    | "profitability_milestone";
  description: string;
  value: string;
  date?: string;
}

export interface FeesAnalysis {
  summary: string;
  highlights: string[];
  sentiment: "positive" | "neutral";
  signals: FeesSignal[];
  metrics: {
    total_fees_all_time: number;
    total_volume_all_time: number;
    total_orders_all_time: number;
    avg_daily_fees_30d: number;
    avg_fee_rate_pct: number;
    peak_daily_fees: number;
    peak_daily_fees_date: string;
    peak_daily_volume: number;
    peak_daily_volume_date: string;
    top_fee_source_name: string;
    top_fee_source_share_pct: number;
    fees_growth_30d_pct: number;
    fees_growth_7d_pct: number;
    estimated_annual_fees_runrate: number;
    fees_per_order_avg_usd: number;
  };
  tweet_data_points: string[];
  content_angles: string[];
}

// backend/src/types/competitorTypes.ts

export interface CompetitorSignal {
  type: string;
  description: string;
  value: string | number;
  competitor?: string;
  date?: string;
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

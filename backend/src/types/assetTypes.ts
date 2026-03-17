// backend/src/types/assetTypes.ts

export interface AssetSignal {
  type: string;
  description: string;
  value: string | number;
  asset?: string;
  date?: string;
}

export interface AssetMetrics {
  total_volume_all_time: number;
  total_orders_all_time: number;
  total_unique_wallets: number;
  total_assets: number;
  avg_order_size_usd: number;
  dominant_asset_name: string;
  dominant_asset_volume_share_pct: number;
  top3_assets_concentration_pct: number;
  top5_assets_concentration_pct: number;
  diversity_index: number;
  source_volume_pct: number;
  destination_volume_pct: number;
  most_active_asset_by_wallets: string;
  most_active_asset_wallet_count: number;
  highest_order_asset: string;
  highest_order_count: number;
}

export interface AssetAnalysis {
  summary: string;
  highlights: string[];
  sentiment: "positive" | "neutral";
  signals: AssetSignal[];
  metrics: AssetMetrics;
  tweet_data_points: string[];
  content_angles: string[];
}

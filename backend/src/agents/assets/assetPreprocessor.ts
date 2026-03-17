import fs from "fs";
import path from "path";

export interface AssetEntry {
  asset: string;
  total_volume: number;
  source_volume: number;
  destination_volume: number;
  unique_wallets: number;
  total_orders: number;
  double_counted_volume: number;
}

export interface RawAssetsData {
  volumes: AssetEntry[];
  total_volume: number;
  source_volume: number;
  destination_volume: number;
  unique_wallets: number;
  total_orders: number;
  double_counted_volume: number;
}

// ── Types for preprocessed data ──────────────────────────────────────────────

export interface AssetStat {
  name: string;
  total_volume: number;
  source_volume: number;
  destination_volume: number;
  unique_wallets: number;
  total_orders: number;
  volume_share_pct: number;
  avg_order_size: number;
  wallets_per_order: number;
  source_destination_ratio: number; // source/destination
  is_primary_source: boolean; // true if source_volume > destination_volume * 0.8
  is_primary_destination: boolean; // true if destination_volume > source_volume * 0.8
  double_counted_volume: number;
}

export interface AssetDailyTrend {
  date: string; // Will be "All-time" since we don't have time series
  total_volume: number;
  asset_count: number;
  dominant_asset: string;
  top_asset_pct: number;
  diversity_index: number;
}

export interface TimeframeStats {
  label: string;
  total_volume: number;
  total_orders: number;
  avg_daily_volume: number;
  peak_day: {
    date: string;
    volume: number;
  };
  low_day: {
    date: string;
    volume: number;
  };
  growth_pct_vs_prior_period: number | null;
}

export interface PreprocessedAssetData {
  // Date range (all-time since no timestamps)
  data_from: string;
  data_to: string;
  total_days: number;

  // All-time totals
  all_time_volume: number;
  all_time_orders: number;
  all_time_volume_fmt: string;
  all_time_source_volume: number;
  all_time_destination_volume: number;
  all_time_unique_wallets: number;
  all_time_double_counted_volume: number;
  total_assets: number;

  // Asset breakdown
  asset_stats: AssetStat[];

  // Timeframe stats (all-time only since no time series)
  timeframes: TimeframeStats[];

  // Peak stats
  top_asset_by_volume: AssetStat;
  top_asset_by_orders: AssetStat;
  top_asset_by_wallets: AssetStat;

  // Averages
  avg_order_size_all: number;
  avg_wallets_per_asset: number;
  avg_orders_per_asset: number;

  // Asset daily trends (simplified, all-time)
  asset_daily_trends: AssetDailyTrend[];

  // Diversity metrics
  diversity_index: number;
  concentration_ratio: {
    top1_pct: number;
    top3_pct: number;
    top5_pct: number;
  };

  // Flow metrics
  total_source_flow_pct: number;
  total_destination_flow_pct: number;
  primary_source_assets: AssetStat[];
  primary_destination_assets: AssetStat[];

  // Data summary
  total_entries: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatUSD(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatUSDShort(n: number): string {
  if (n >= 1_000_000_000) {
    return `$${(n / 1_000_000_000).toFixed(2)}B`;
  } else if (n >= 1_000_000) {
    return `$${(n / 1_000_000).toFixed(2)}M`;
  } else if (n >= 1_000) {
    return `$${(n / 1_000).toFixed(2)}K`;
  }
  return `$${n.toFixed(2)}`;
}

function calculateDiversityIndex(
  assetVolumeMap: Map<string, number>,
  totalVolume: number,
): number {
  // Herfindahl index: 1 - sum(share^2)
  let sumSquares = 0;
  for (const vol of assetVolumeMap.values()) {
    const share = vol / totalVolume;
    sumSquares += share * share;
  }
  return Math.max(0, Math.min(1, 1 - sumSquares));
}

// ── Main preprocessor class ───────────────────────────────────────────────────

export class AssetPreprocessor {
  private dataPath: string;

  constructor(dataFileName = "assets.json") {
    this.dataPath = path.join(process.cwd(), "data", dataFileName);
  }

  load(): RawAssetsData {
    if (!fs.existsSync(this.dataPath)) {
      throw new Error(
        `Assets data file not found at: ${this.dataPath}\n` +
          `Please place your assets.json inside a /data folder at the project root.`,
      );
    }
    const raw = fs.readFileSync(this.dataPath, "utf-8");
    return JSON.parse(raw) as RawAssetsData;
  }

  process(): PreprocessedAssetData {
    const raw = this.load();
    const entries = raw.volumes;
    const metadata = raw;

    console.log(`[AssetPreprocessor] Loaded ${entries.length} asset entries`);
    if (entries.length > 0) {
      console.log(
        "[AssetPreprocessor] Sample entry:",
        JSON.stringify(entries[0], null, 2),
      );
    }

    // ── 1. Sort entries by volume (highest first) ────────────────────────────
    const sortedEntries = [...entries].sort(
      (a, b) => b.total_volume - a.total_volume,
    );

    // ── 2. Build asset stats ─────────────────────────────────────────────────
    const assetVolumeMap = new Map<string, number>();
    sortedEntries.forEach((entry) => {
      assetVolumeMap.set(entry.asset, entry.total_volume);
    });

    const asset_stats: AssetStat[] = sortedEntries.map((entry) => {
      const sourceDestRatio =
        entry.destination_volume > 0
          ? entry.source_volume / entry.destination_volume
          : entry.source_volume > 0
            ? Infinity
            : 0;

      const isPrimarySource =
        entry.source_volume > entry.destination_volume * 0.8;
      const isPrimaryDestination =
        entry.destination_volume > entry.source_volume * 0.8;

      return {
        name: entry.asset,
        total_volume: entry.total_volume,
        source_volume: entry.source_volume,
        destination_volume: entry.destination_volume,
        unique_wallets: entry.unique_wallets,
        total_orders: entry.total_orders,
        volume_share_pct: parseFloat(
          ((entry.total_volume / metadata.total_volume) * 100).toFixed(2),
        ),
        avg_order_size:
          entry.total_orders > 0 ? entry.total_volume / entry.total_orders : 0,
        wallets_per_order:
          entry.total_orders > 0
            ? entry.unique_wallets / entry.total_orders
            : 0,
        source_destination_ratio: sourceDestRatio,
        is_primary_source: isPrimarySource,
        is_primary_destination: isPrimaryDestination,
        double_counted_volume: entry.double_counted_volume,
      };
    });

    // ── 3. Identify primary source/destination assets ────────────────────────
    const primary_source_assets = asset_stats
      .filter((a) => a.is_primary_source)
      .sort((a, b) => b.source_volume - a.source_volume);

    const primary_destination_assets = asset_stats
      .filter((a) => a.is_primary_destination)
      .sort((a, b) => b.destination_volume - a.destination_volume);

    // ── 4. Calculate concentration ratios ────────────────────────────────────
    const top1_pct = asset_stats[0]?.volume_share_pct || 0;
    const top3_pct = asset_stats
      .slice(0, 3)
      .reduce((sum, a) => sum + a.volume_share_pct, 0);
    const top5_pct = asset_stats
      .slice(0, 5)
      .reduce((sum, a) => sum + a.volume_share_pct, 0);

    // ── 5. Calculate diversity index ─────────────────────────────────────────
    const diversity_index = calculateDiversityIndex(
      assetVolumeMap,
      metadata.total_volume,
    );

    // ── 6. Create simplified daily trends (all-time) ─────────────────────────
    const asset_daily_trends: AssetDailyTrend[] = [
      {
        date: "All-time",
        total_volume: metadata.total_volume,
        asset_count: entries.length,
        dominant_asset: asset_stats[0]?.name || "N/A",
        top_asset_pct: top1_pct,
        diversity_index,
      },
    ];

    // ── 7. Create timeframe stats (all-time only) ───────────────────────────
    const timeframes: TimeframeStats[] = [
      {
        label: "all_time",
        total_volume: metadata.total_volume,
        total_orders: metadata.total_orders,
        avg_daily_volume: metadata.total_volume, // Not meaningful without dates
        peak_day: {
          date: "All-time",
          volume: metadata.total_volume,
        },
        low_day: {
          date: "All-time",
          volume: metadata.total_volume,
        },
        growth_pct_vs_prior_period: null,
      },
    ];

    // ── 8. Calculate averages ───────────────────────────────────────────────
    const avg_order_size_all =
      metadata.total_orders > 0
        ? metadata.total_volume / metadata.total_orders
        : 0;

    const avg_wallets_per_asset =
      entries.length > 0 ? metadata.unique_wallets / entries.length : 0;

    const avg_orders_per_asset =
      entries.length > 0 ? metadata.total_orders / entries.length : 0;

    // ── 9. Identify top assets ──────────────────────────────────────────────
    const top_asset_by_volume = asset_stats[0];
    const top_asset_by_orders = [...asset_stats].sort(
      (a, b) => b.total_orders - a.total_orders,
    )[0];
    const top_asset_by_wallets = [...asset_stats].sort(
      (a, b) => b.unique_wallets - a.unique_wallets,
    )[0];

    // ── 10. Return complete preprocessed data ───────────────────────────────
    return {
      // Date range (approximate since no timestamps)
      data_from: "All-time",
      data_to: "Present",
      total_days: 1, // Not meaningful

      // All-time totals
      all_time_volume: metadata.total_volume,
      all_time_orders: metadata.total_orders,
      all_time_volume_fmt: formatUSD(metadata.total_volume),
      all_time_source_volume: metadata.source_volume,
      all_time_destination_volume: metadata.destination_volume,
      all_time_unique_wallets: metadata.unique_wallets,
      all_time_double_counted_volume: metadata.double_counted_volume,
      total_assets: entries.length,

      // Asset stats
      asset_stats,

      // Timeframes
      timeframes,

      // Top assets
      top_asset_by_volume,
      top_asset_by_orders,
      top_asset_by_wallets,

      // Averages
      avg_order_size_all,
      avg_wallets_per_asset,
      avg_orders_per_asset,

      // Asset trends
      asset_daily_trends,

      // Diversity metrics
      diversity_index,
      concentration_ratio: {
        top1_pct,
        top3_pct,
        top5_pct,
      },

      // Flow metrics
      total_source_flow_pct: parseFloat(
        ((metadata.source_volume / metadata.total_volume) * 100).toFixed(2),
      ),
      total_destination_flow_pct: parseFloat(
        ((metadata.destination_volume / metadata.total_volume) * 100).toFixed(
          2,
        ),
      ),
      primary_source_assets,
      primary_destination_assets,

      // Data summary
      total_entries: entries.length,
    };
  }
}

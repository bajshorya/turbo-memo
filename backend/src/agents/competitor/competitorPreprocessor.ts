// backend/src/agents/competitor/competitorPreprocessor.ts

import fs from "fs";
import path from "path";

// ── Define the structure of your competitor data ───────────────────────────

export interface ThorchainEntry {
  date: string;
  volume: number;
  fees?: number;
  swaps?: number;
}

export interface CoinMarketCapEntry {
  date: string;
  price?: number;
  marketCap?: number;
  volume?: number;
}

export interface GardenHistoricalEntry {
  date: string;
  volume: number;
  fees?: number;
  orders?: number;
  unique_wallets?: number;
}

export interface CompetitorData {
  thorchain?: {
    data: ThorchainEntry[];
    metadata?: any;
  };
  coinmarketcap?: {
    data: CoinMarketCapEntry[];
    metadata?: any;
  };
  garden?: {
    historical: GardenHistoricalEntry[];
    current: any; // Your existing Garden data
  };
}

// ── Types for preprocessed data ──────────────────────────────────────────────

export interface CompetitorMetric {
  name: string;
  total_volume: number;
  avg_daily_volume: number;
  peak_daily_volume: number;
  peak_day: string;
  growth_30d_pct: number | null;
  growth_7d_pct: number | null;
  market_share_pct?: number;
  fees?: number;
  swaps?: number;
  unique_wallets?: number;
}

export interface ComparisonMetric {
  metric: string;
  garden: number | string;
  competitor: number | string;
  garden_formatted: string;
  competitor_formatted: string;
  difference_pct: number;
  advantage: "garden" | "competitor" | "tie";
  insight: string;
}

export interface TimeSeriesComparison {
  date: string;
  garden_volume: number;
  competitor_volume: number;
  garden_cumulative: number;
  competitor_cumulative: number;
  garden_leading: boolean;
}

export interface MarketShareAnalysis {
  total_market_volume: number;
  garden_share_pct: number;
  thorchain_share_pct: number;
  other_share_pct: number;
  share_trend: "increasing" | "decreasing" | "stable";
}

export interface PreprocessedCompetitorData {
  // Date range
  data_from: string;
  data_to: string;
  total_days: number;

  // Garden metrics
  garden: {
    total_volume: number;
    total_orders: number;
    total_wallets: number;
    avg_daily_volume: number;
    peak_daily_volume: number;
    peak_day: string;
    growth_30d_pct: number | null;
    growth_7d_pct: number | null;
    volume_fmt: string;
  };

  // Thorchain metrics (if available)
  thorchain: {
    total_volume: number;
    avg_daily_volume: number;
    peak_daily_volume: number;
    peak_day: string;
    growth_30d_pct: number | null;
    growth_7d_pct: number | null;
    volume_fmt: string;
    data_available: boolean;
  };

  // CoinMarketCap metrics (if available)
  coinmarketcap: {
    current_price?: number | null;
    price_change_24h_pct?: number | null;
    price_change_7d_pct?: number | null;
    price_change_30d_pct?: number | null;
    market_cap?: number | null;
    volume_24h?: number | null;
    data_available: boolean;
  };

  // Comparisons
  comparisons: ComparisonMetric[];

  // Market share analysis
  market_share: MarketShareAnalysis;

  // Time series comparison (last 30 days if available)
  time_series: TimeSeriesComparison[];

  // Competitive advantages
  garden_advantages: string[];
  competitor_advantages: string[];

  // Key insights
  key_insights: string[];

  // Data summary
  data_sources: string[];
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

function growthPct(current: number, prior: number): number | null {
  if (prior === 0) return null;
  return parseFloat((((current - prior) / prior) * 100).toFixed(2));
}

function calculateDifferencePct(garden: number, competitor: number): number {
  if (competitor === 0) return garden > 0 ? 100 : 0;
  return parseFloat((((garden - competitor) / competitor) * 100).toFixed(2));
}

// ── Main preprocessor class ───────────────────────────────────────────────────

export class CompetitorPreprocessor {
  private gardenDataPath: string;
  private thorchainDataPath: string;
  private coinmarketcapDataPath: string;

  constructor(
    gardenFileName = "garden_volume.json", // Your existing Garden data
    thorchainFileName = "thorchain.json",
    coinmarketcapFileName = "coinmarketcap.json",
  ) {
    this.gardenDataPath = path.join(process.cwd(), "data", gardenFileName);
    this.thorchainDataPath = path.join(
      process.cwd(),
      "data",
      thorchainFileName,
    );
    this.coinmarketcapDataPath = path.join(
      process.cwd(),
      "data",
      coinmarketcapFileName,
    );
  }

  loadGardenData(): any {
    if (!fs.existsSync(this.gardenDataPath)) {
      console.warn(
        `[CompetitorPreprocessor] Garden data file not found at: ${this.gardenDataPath}`,
      );
      return null;
    }
    const raw = fs.readFileSync(this.gardenDataPath, "utf-8");
    return JSON.parse(raw);
  }

  loadThorchainData(): ThorchainEntry[] | null {
    if (!fs.existsSync(this.thorchainDataPath)) {
      console.warn(
        `[CompetitorPreprocessor] Thorchain data file not found at: ${this.thorchainDataPath}`,
      );
      return null;
    }
    const raw = fs.readFileSync(this.thorchainDataPath, "utf-8");
    const data = JSON.parse(raw);
    return data.data || data.volumes || data;
  }

  loadCoinMarketCapData(): CoinMarketCapEntry[] | null {
    if (!fs.existsSync(this.coinmarketcapDataPath)) {
      console.warn(
        `[CompetitorPreprocessor] CoinMarketCap data file not found at: ${this.coinmarketcapDataPath}`,
      );
      return null;
    }
    const raw = fs.readFileSync(this.coinmarketcapDataPath, "utf-8");
    const data = JSON.parse(raw);
    return data.data || data;
  }

  process(): PreprocessedCompetitorData {
    // Load all data sources
    const gardenData = this.loadGardenData();
    const thorchainData = this.loadThorchainData();
    const coinmarketcapData = this.loadCoinMarketCapData();

    console.log(`[CompetitorPreprocessor] Data sources loaded:`);
    console.log(`  - Garden: ${gardenData ? "✓" : "✗"}`);
    console.log(`  - Thorchain: ${thorchainData ? "✓" : "✗"}`);
    console.log(`  - CoinMarketCap: ${coinmarketcapData ? "✓" : "✗"}`);

    // Process Garden data
    let gardenMetrics = {
      total_volume: 0,
      total_orders: 0,
      total_wallets: 0,
      avg_daily_volume: 0,
      peak_daily_volume: 0,
      peak_day: "N/A",
      growth_30d_pct: null as number | null,
      growth_7d_pct: null as number | null,
      volume_fmt: "$0",
    };

    if (gardenData) {
      // Adapt based on your Garden data structure
      if (gardenData.metadata) {
        gardenMetrics.total_volume = gardenData.metadata.total_volume || 0;
        gardenMetrics.total_orders = gardenData.metadata.total_order_count || 0;
        gardenMetrics.volume_fmt = formatUSD(gardenMetrics.total_volume);

        // Try to extract wallet count if available
        if (gardenData.volumes) {
          const uniqueWallets = new Set();
          gardenData.volumes.forEach((v: any) => {
            if (v.unique_wallets) uniqueWallets.add(v.unique_wallets);
          });
          gardenMetrics.total_wallets = uniqueWallets.size;
        }
      }

      // Calculate growth from timeframes if available
      if (gardenData.timeframes) {
        const last30d = gardenData.timeframes.find(
          (tf: any) => tf.label === "last_30d",
        );
        const last7d = gardenData.timeframes.find(
          (tf: any) => tf.label === "last_7d",
        );

        gardenMetrics.growth_30d_pct =
          last30d?.growth_pct_vs_prior_period || null;
        gardenMetrics.growth_7d_pct =
          last7d?.growth_pct_vs_prior_period || null;
        gardenMetrics.avg_daily_volume = last30d?.avg_daily_volume || 0;
      }

      // Get peak day
      if (gardenData.peak_day) {
        gardenMetrics.peak_daily_volume =
          gardenData.peak_day.total_volume_usd || 0;
        gardenMetrics.peak_day = gardenData.peak_day.date || "N/A";
      }
    }

    // Process Thorchain data
    let thorchainMetrics = {
      total_volume: 0,
      avg_daily_volume: 0,
      peak_daily_volume: 0,
      peak_day: "N/A",
      growth_30d_pct: null as number | null,
      growth_7d_pct: null as number | null,
      volume_fmt: "$0",
      data_available: !!thorchainData,
    };

    if (
      thorchainData &&
      Array.isArray(thorchainData) &&
      thorchainData.length > 0
    ) {
      // Calculate totals
      thorchainMetrics.total_volume = thorchainData.reduce(
        (sum, day) => sum + (day.volume || 0),
        0,
      );
      thorchainMetrics.volume_fmt = formatUSD(thorchainMetrics.total_volume);

      // Calculate averages
      thorchainMetrics.avg_daily_volume =
        thorchainMetrics.total_volume / thorchainData.length;

      // Find peak
      const peak = thorchainData.reduce(
        (best, day) => ((day.volume || 0) > (best.volume || 0) ? day : best),
        thorchainData[0],
      );

      thorchainMetrics.peak_daily_volume = peak.volume || 0;
      thorchainMetrics.peak_day = peak.date || "N/A";

      // Calculate growth (last 30 days vs previous 30)
      const sorted = [...thorchainData].sort((a, b) =>
        a.date.localeCompare(b.date),
      );
      const last30 = sorted.slice(-30);
      const prev30 = sorted.slice(-60, -30);

      if (last30.length > 0 && prev30.length > 0) {
        const last30Vol = last30.reduce((sum, d) => sum + (d.volume || 0), 0);
        const prev30Vol = prev30.reduce((sum, d) => sum + (d.volume || 0), 0);
        thorchainMetrics.growth_30d_pct = growthPct(last30Vol, prev30Vol);

        const last7 = sorted.slice(-7);
        const prev7 = sorted.slice(-14, -7);
        const last7Vol = last7.reduce((sum, d) => sum + (d.volume || 0), 0);
        const prev7Vol = prev7.reduce((sum, d) => sum + (d.volume || 0), 0);
        thorchainMetrics.growth_7d_pct = growthPct(last7Vol, prev7Vol);
      }
    }

    // Process CoinMarketCap data
    let coinmarketcapMetrics = {
      current_price: undefined as number | null | undefined,
      price_change_24h_pct: undefined as number | null | undefined,
      price_change_7d_pct: undefined as number | null | undefined,
      price_change_30d_pct: undefined as number | null | undefined,
      market_cap: undefined as number | null | undefined,
      volume_24h: undefined as number | null | undefined,
      data_available: !!coinmarketcapData,
    };

    if (
      coinmarketcapData &&
      Array.isArray(coinmarketcapData) &&
      coinmarketcapData.length > 0
    ) {
      // Get most recent data point
      const latest = coinmarketcapData[coinmarketcapData.length - 1];
      coinmarketcapMetrics.current_price = latest.price;
      coinmarketcapMetrics.market_cap = latest.marketCap;
      coinmarketcapMetrics.volume_24h = latest.volume;

      // Calculate price changes if historical data available
      if (coinmarketcapData.length > 1) {
        const prev24h = coinmarketcapData[coinmarketcapData.length - 2];
        const prev7d =
          coinmarketcapData[Math.max(0, coinmarketcapData.length - 8)];
        const prev30d = coinmarketcapData[0];

        if (prev24h && latest.price) {
          coinmarketcapMetrics.price_change_24h_pct = growthPct(
            latest.price,
            prev24h.price || 0,
          );
        }
        if (prev7d && latest.price) {
          coinmarketcapMetrics.price_change_7d_pct = growthPct(
            latest.price,
            prev7d.price || 0,
          );
        }
        if (prev30d && latest.price) {
          coinmarketcapMetrics.price_change_30d_pct = growthPct(
            latest.price,
            prev30d.price || 0,
          );
        }
      }
    }

    // Create comparisons
    const comparisons: ComparisonMetric[] = [];

    // Volume comparison
    if (thorchainMetrics.data_available) {
      comparisons.push({
        metric: "Total Volume",
        garden: gardenMetrics.total_volume,
        competitor: thorchainMetrics.total_volume,
        garden_formatted: gardenMetrics.volume_fmt,
        competitor_formatted: thorchainMetrics.volume_fmt,
        difference_pct: calculateDifferencePct(
          gardenMetrics.total_volume,
          thorchainMetrics.total_volume,
        ),
        advantage:
          gardenMetrics.total_volume > thorchainMetrics.total_volume
            ? "garden"
            : gardenMetrics.total_volume < thorchainMetrics.total_volume
              ? "competitor"
              : "tie",
        insight:
          gardenMetrics.total_volume > thorchainMetrics.total_volume
            ? `Garden leads Thorchain by ${formatUSDShort(gardenMetrics.total_volume - thorchainMetrics.total_volume)} in total volume`
            : `Thorchain leads Garden by ${formatUSDShort(thorchainMetrics.total_volume - gardenMetrics.total_volume)} in total volume`,
      });

      // Growth comparison
      if (
        gardenMetrics.growth_30d_pct !== null &&
        thorchainMetrics.growth_30d_pct !== null
      ) {
        comparisons.push({
          metric: "30-Day Growth",
          garden: `${gardenMetrics.growth_30d_pct}%`,
          competitor: `${thorchainMetrics.growth_30d_pct}%`,
          garden_formatted: `${gardenMetrics.growth_30d_pct}%`,
          competitor_formatted: `${thorchainMetrics.growth_30d_pct}%`,
          difference_pct:
            gardenMetrics.growth_30d_pct - thorchainMetrics.growth_30d_pct,
          advantage:
            gardenMetrics.growth_30d_pct > thorchainMetrics.growth_30d_pct
              ? "garden"
              : gardenMetrics.growth_30d_pct < thorchainMetrics.growth_30d_pct
                ? "competitor"
                : "tie",
          insight:
            gardenMetrics.growth_30d_pct > thorchainMetrics.growth_30d_pct
              ? `Garden is growing ${(gardenMetrics.growth_30d_pct - thorchainMetrics.growth_30d_pct).toFixed(1)}% faster than Thorchain`
              : `Thorchain is growing ${(thorchainMetrics.growth_30d_pct - gardenMetrics.growth_30d_pct).toFixed(1)}% faster than Garden`,
        });
      }

      // Peak daily volume comparison
      comparisons.push({
        metric: "Peak Daily Volume",
        garden: gardenMetrics.peak_daily_volume,
        competitor: thorchainMetrics.peak_daily_volume,
        garden_formatted: formatUSDShort(gardenMetrics.peak_daily_volume),
        competitor_formatted: formatUSDShort(
          thorchainMetrics.peak_daily_volume,
        ),
        difference_pct: calculateDifferencePct(
          gardenMetrics.peak_daily_volume,
          thorchainMetrics.peak_daily_volume,
        ),
        advantage:
          gardenMetrics.peak_daily_volume > thorchainMetrics.peak_daily_volume
            ? "garden"
            : gardenMetrics.peak_daily_volume <
                thorchainMetrics.peak_daily_volume
              ? "competitor"
              : "tie",
        insight: `Peak day: Garden ${gardenMetrics.peak_day} (${formatUSDShort(gardenMetrics.peak_daily_volume)}) vs Thorchain ${thorchainMetrics.peak_day} (${formatUSDShort(thorchainMetrics.peak_daily_volume)})`,
      });
    }

    // Market share analysis (simplified)
    const totalMarketVolume =
      gardenMetrics.total_volume +
      (thorchainMetrics.data_available ? thorchainMetrics.total_volume : 0);
    const marketShare: MarketShareAnalysis = {
      total_market_volume: totalMarketVolume,
      garden_share_pct:
        totalMarketVolume > 0
          ? parseFloat(
              ((gardenMetrics.total_volume / totalMarketVolume) * 100).toFixed(
                2,
              ),
            )
          : 0,
      thorchain_share_pct:
        totalMarketVolume > 0 && thorchainMetrics.data_available
          ? parseFloat(
              (
                (thorchainMetrics.total_volume / totalMarketVolume) *
                100
              ).toFixed(2),
            )
          : 0,
      other_share_pct: 0,
      share_trend: "stable",
    };

    // Generate competitive advantages
    const garden_advantages: string[] = [];
    const competitor_advantages: string[] = [];

    if (gardenMetrics.growth_30d_pct && thorchainMetrics.growth_30d_pct) {
      if (gardenMetrics.growth_30d_pct > thorchainMetrics.growth_30d_pct) {
        garden_advantages.push(
          `Faster growth rate (${gardenMetrics.growth_30d_pct}% vs ${thorchainMetrics.growth_30d_pct}%)`,
        );
      } else {
        competitor_advantages.push(
          `Faster growth rate (${thorchainMetrics.growth_30d_pct}% vs ${gardenMetrics.growth_30d_pct}%)`,
        );
      }
    }

    if (gardenMetrics.total_volume > thorchainMetrics.total_volume) {
      garden_advantages.push(
        `Higher total volume (${gardenMetrics.volume_fmt} vs ${thorchainMetrics.volume_fmt})`,
      );
    } else if (thorchainMetrics.total_volume > gardenMetrics.total_volume) {
      competitor_advantages.push(
        `Higher total volume (${thorchainMetrics.volume_fmt} vs ${gardenMetrics.volume_fmt})`,
      );
    }

    // Generate key insights
    const key_insights: string[] = [];

    if (gardenMetrics.total_volume > 0 && thorchainMetrics.total_volume > 0) {
      const ratio = gardenMetrics.total_volume / thorchainMetrics.total_volume;
      if (ratio > 1.5) {
        key_insights.push(
          `Garden dominates with ${ratio.toFixed(1)}x the volume of Thorchain`,
        );
      } else if (ratio < 0.67) {
        key_insights.push(
          `Thorchain leads with ${(1 / ratio).toFixed(1)}x the volume of Garden`,
        );
      } else {
        key_insights.push(
          `Garden and Thorchain are in a competitive range (Garden at ${marketShare.garden_share_pct}% market share)`,
        );
      }
    }

    if (coinmarketcapMetrics.data_available) {
      if (
        coinmarketcapMetrics.price_change_30d_pct &&
        coinmarketcapMetrics.price_change_30d_pct > 20
      ) {
        key_insights.push(
          `Strong market tailwinds: BTC up ${coinmarketcapMetrics.price_change_30d_pct}% in 30 days`,
        );
      } else if (
        coinmarketcapMetrics.price_change_30d_pct &&
        coinmarketcapMetrics.price_change_30d_pct < -10
      ) {
        key_insights.push(
          `Market headwinds: BTC down ${coinmarketcapMetrics.price_change_30d_pct}% in 30 days`,
        );
      }
    }

    // Create time series (simplified - last 30 points if available)
    const time_series: TimeSeriesComparison[] = [];
    if (gardenData?.daily_snapshots && thorchainData) {
      const gardenDaily = gardenData.daily_snapshots.slice(-30);
      const thorchainDaily = thorchainData.slice(-30);

      const minLength = Math.min(gardenDaily.length, thorchainDaily.length);
      let gardenCumulative = 0;
      let thorchainCumulative = 0;

      for (let i = 0; i < minLength; i++) {
        gardenCumulative += gardenDaily[i]?.total_volume_usd || 0;
        thorchainCumulative += thorchainDaily[i]?.volume || 0;

        time_series.push({
          date: gardenDaily[i]?.date || thorchainDaily[i]?.date || "Unknown",
          garden_volume: gardenDaily[i]?.total_volume_usd || 0,
          competitor_volume: thorchainDaily[i]?.volume || 0,
          garden_cumulative: gardenCumulative,
          competitor_cumulative: thorchainCumulative,
          garden_leading: gardenCumulative > thorchainCumulative,
        });
      }
    }

    return {
      data_from: gardenData?.data_from || "Unknown",
      data_to: gardenData?.data_to || "Unknown",
      total_days: gardenData?.total_days || 0,

      garden: gardenMetrics,
      thorchain: thorchainMetrics,
      coinmarketcap: coinmarketcapMetrics,

      comparisons,
      market_share: marketShare,
      time_series,

      garden_advantages,
      competitor_advantages,
      key_insights,

      data_sources: [
        gardenData ? "Garden.finance" : null,
        thorchainData ? "Thorchain" : null,
        coinmarketcapData ? "CoinMarketCap" : null,
      ].filter(Boolean) as string[],
    };
  }
}

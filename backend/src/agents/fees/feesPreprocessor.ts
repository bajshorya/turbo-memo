// backend/src/agents/fees/feesPreprocessor.ts

import fs from "fs";
import path from "path";

// ── Define the actual structure of your fees data ────────────────────────────

export interface FeesEntry {
  date_range: string;
  fees_earned: number;
}

export interface RawFeesData {
  data: FeesEntry[];
}

// ── Types for preprocessed data ──────────────────────────────────────────────

export interface DailyFeesSnapshot {
  date: string;
  total_fees_usd: number;
  // These fields are kept for compatibility but will be zero or derived
  total_volume_usd: number;
  total_orders: number;
  avg_fee_per_order_usd: number;
  fee_rate_pct: number;
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
  label: string;
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
  growth_pct_vs_prior_period: number | null;
}

export interface PreprocessedFeesData {
  // Date range of the full dataset
  data_from: string;
  data_to: string;
  total_days: number;

  // All-time totals
  all_time_fees: number;
  all_time_volume: number;
  all_time_orders: number;
  all_time_fees_fmt: string;
  all_time_volume_fmt: string;
  avg_fee_rate_pct: number;

  // Daily snapshots (converted from weekly data)
  daily_snapshots: DailyFeesSnapshot[];

  // Source breakdown (will be empty since no source data)
  source_stats: FeesBySource[];

  // Timeframe stats
  timeframes: FeesTimeframeStats[];

  // Peak days
  peak_fees_day: DailyFeesSnapshot;
  peak_volume_day: DailyFeesSnapshot;

  // Recent averages
  recent_7d_avg_fees: number;
  recent_30d_avg_fees: number;
  recent_7d_avg_volume: number;
  recent_30d_avg_volume: number;

  // Unique source count
  unique_sources: number;
  total_entries: number;

  // Fee rate trends (will be derived)
  avg_fee_rate_7d: number;
  avg_fee_rate_30d: number;
  fee_rate_trend: "increasing" | "decreasing" | "stable";

  // Estimated annual runrate
  estimated_annual_fees_runrate: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDateFromISO(iso: string): string {
  // Convert "2026-03-15T00:00:00+00:00" to "2026-03-15"
  return iso.split("T")[0];
}

function formatUSD(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function growthPct(current: number, prior: number): number | null {
  if (prior === 0) return null;
  return parseFloat((((current - prior) / prior) * 100).toFixed(2));
}

// ── Main preprocessor class ───────────────────────────────────────────────────

export class FeesPreprocessor {
  private dataPath: string;

  constructor(dataFileName = "fees.json") {
    this.dataPath = path.join(process.cwd(), "data", dataFileName);
  }

  load(): RawFeesData {
    if (!fs.existsSync(this.dataPath)) {
      throw new Error(
        `Fees data file not found at: ${this.dataPath}\n` +
          `Please place your fees.json inside a /data folder at the project root.`,
      );
    }
    const raw = fs.readFileSync(this.dataPath, "utf-8");
    return JSON.parse(raw) as RawFeesData;
  }

  process(): PreprocessedFeesData {
    const raw = this.load();
    const entries = raw.data;

    console.log(
      `[FeesPreprocessor] Loaded ${entries.length} weekly fee entries`,
    );
    if (entries.length > 0) {
      console.log(
        "[FeesPreprocessor] Sample entry:",
        JSON.stringify(entries[0], null, 2),
      );
    }

    // Sort entries by date (oldest first)
    const sortedEntries = [...entries].sort((a, b) =>
      a.date_range.localeCompare(b.date_range),
    );

    // ── 1. Convert weekly data to daily snapshots ────────────────────────────
    // Since we only have weekly data, we'll create one snapshot per week
    const daily_snapshots: DailyFeesSnapshot[] = sortedEntries.map((entry) => {
      const date = formatDateFromISO(entry.date_range);
      return {
        date,
        total_fees_usd: parseFloat(entry.fees_earned.toFixed(2)),
        total_volume_usd: 0, // Not available in the data
        total_orders: 0, // Not available in the data
        avg_fee_per_order_usd: 0,
        fee_rate_pct: 0,
        sources_active: 1, // Assume one source since we don't have breakdown
      };
    });

    // ── 2. Date range ─────────────────────────────────────────────────────────
    const data_from = daily_snapshots[0]?.date ?? "";
    const data_to = daily_snapshots[daily_snapshots.length - 1]?.date ?? "";
    const total_days = daily_snapshots.length * 7; // Approximate days from weekly data

    // ── 3. All-time totals ────────────────────────────────────────────────────
    const all_time_fees = daily_snapshots.reduce(
      (sum, d) => sum + d.total_fees_usd,
      0,
    );

    // ── 4. Peak days ──────────────────────────────────────────────────────────
    if (daily_snapshots.length === 0) {
      throw new Error("No daily snapshots found in fees data");
    }

    const peak_fees_day = daily_snapshots.reduce((best, d) =>
      d.total_fees_usd > best.total_fees_usd ? d : best,
    );

    // Create a default snapshot for peak_volume_day (since we don't have volume data)
    const peak_volume_day: DailyFeesSnapshot = {
      date: data_from,
      total_fees_usd: 0,
      total_volume_usd: 0,
      total_orders: 0,
      avg_fee_per_order_usd: 0,
      fee_rate_pct: 0,
      sources_active: 0,
    };

    // ── 5. Source stats (empty since no source data) ──────────────────────────
    const source_stats: FeesBySource[] = [];

    // ── 6. Timeframe stats ────────────────────────────────────────────────────
    const now = new Date(data_to);

    function getTimeframeStats(
      label: string,
      weeksBack: number, // Using weeks instead of days since data is weekly
      snapshots: DailyFeesSnapshot[],
    ): FeesTimeframeStats {
      const from = new Date(now);
      from.setDate(from.getDate() - weeksBack * 7);
      const fromStr = from.toISOString().split("T")[0];

      const priorFrom = new Date(from);
      priorFrom.setDate(priorFrom.getDate() - weeksBack * 7);
      const priorFromStr = priorFrom.toISOString().split("T")[0];

      const currentPeriod = snapshots.filter(
        (d) => d.date >= fromStr && d.date <= data_to,
      );
      const priorPeriod = snapshots.filter(
        (d) => d.date >= priorFromStr && d.date < fromStr,
      );

      const currentFees = currentPeriod.reduce(
        (s, d) => s + d.total_fees_usd,
        0,
      );
      const priorFees = priorPeriod.reduce((s, d) => s + d.total_fees_usd, 0);

      const defaultPeak = {
        date: "",
        total_fees_usd: 0,
        total_volume_usd: 0,
        total_orders: 0,
        avg_fee_per_order_usd: 0,
        fee_rate_pct: 0,
        sources_active: 0,
      };

      const peakInPeriod =
        currentPeriod.length > 0
          ? currentPeriod.reduce((best, d) =>
              d.total_fees_usd > best.total_fees_usd ? d : best,
            )
          : defaultPeak;

      return {
        label,
        from: fromStr,
        to: data_to,
        total_fees_usd: parseFloat(currentFees.toFixed(2)),
        total_volume_usd: 0,
        total_orders: 0,
        avg_daily_fees_usd:
          currentPeriod.length > 0
            ? parseFloat((currentFees / (currentPeriod.length * 7)).toFixed(2))
            : 0,
        avg_fee_rate_pct: 0,
        peak_day: {
          date: peakInPeriod.date,
          fees_usd: peakInPeriod.total_fees_usd,
          volume_usd: 0,
        },
        growth_pct_vs_prior_period: growthPct(currentFees, priorFees),
      };
    }

    const timeframes: FeesTimeframeStats[] = [
      getTimeframeStats("last_7d", 1, daily_snapshots),
      getTimeframeStats("last_30d", 4, daily_snapshots),
      getTimeframeStats("last_90d", 12, daily_snapshots),
      getTimeframeStats("last_180d", 24, daily_snapshots),
    ];

    // ── 7. Recent averages ────────────────────────────────────────────────────
    const last4Weeks = daily_snapshots.slice(-4); // Last 4 weeks ≈ 30 days
    const last1Week = daily_snapshots.slice(-1); // Last 1 week ≈ 7 days

    const recent_7d_avg_fees =
      last1Week.length > 0
        ? parseFloat((last1Week[0].total_fees_usd / 7).toFixed(2))
        : 0;

    const recent_30d_avg_fees =
      last4Weeks.length > 0
        ? parseFloat(
            (
              last4Weeks.reduce((s, d) => s + d.total_fees_usd, 0) /
              (last4Weeks.length * 7)
            ).toFixed(2),
          )
        : 0;

    const recent_7d_avg_volume = 0;
    const recent_30d_avg_volume = 0;

    // ── 8. Fee rate trends (not applicable, set to 0) ─────────────────────────
    const avg_fee_rate_7d = 0;
    const avg_fee_rate_30d = 0;
    const fee_rate_trend: "increasing" | "decreasing" | "stable" = "stable";

    // ── 9. Estimated annual runrate ───────────────────────────────────────────
    const estimated_annual_fees_runrate = recent_30d_avg_fees * 365;

    // ── 10. Return the complete preprocessed data ─────────────────────────────
    return {
      // Date range
      data_from,
      data_to,
      total_days,

      // All-time totals
      all_time_fees,
      all_time_volume: 0,
      all_time_orders: 0,
      all_time_fees_fmt: formatUSD(all_time_fees),
      all_time_volume_fmt: "$0",
      avg_fee_rate_pct: 0,

      // Daily snapshots
      daily_snapshots,

      // Source stats
      source_stats,

      // Timeframes
      timeframes,

      // Peak days
      peak_fees_day,
      peak_volume_day,

      // Recent averages
      recent_7d_avg_fees,
      recent_30d_avg_fees,
      recent_7d_avg_volume,
      recent_30d_avg_volume,

      // Unique source count
      unique_sources: 1, // Assume one source since no breakdown
      total_entries: entries.length,

      // Fee rate trends
      avg_fee_rate_7d,
      avg_fee_rate_30d,
      fee_rate_trend,

      // Annual runrate
      estimated_annual_fees_runrate,
    };
  }
}

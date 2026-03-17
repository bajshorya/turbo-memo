import fs from "fs";
import path from "path";
import type {
  RawVolumeData,
  RawVolumeEntry,
  DailySnapshot,
  IntegratorStat,
  TimeframeStats,
  VolumeSource,
} from "../../types/volumeTypes";

// ── Helpers ───────────────────────────────────────────────────────────────────

function resolveSourceName(source: VolumeSource): string {
  const st = source.source_type;
  if (typeof st === "string") return st;
  if (typeof st === "object" && "Referrer" in st) return st.Referrer.platform;
  return "Unknown";
}

function toDateStr(iso: string): string {
  return iso.split("T")[0]; // "2026-01-01"
}

function formatUSD(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function growthPct(current: number, prior: number): number | null {
  if (prior === 0) return null;
  return parseFloat((((current - prior) / prior) * 100).toFixed(2));
}

// ── Main preprocessor class ───────────────────────────────────────────────────

export interface PreprocessedVolumeData {
  // Date range of the full dataset
  data_from: string;
  data_to: string;
  total_days: number;

  // All-time totals (from metadata)
  all_time_volume: number;
  all_time_orders: number;
  all_time_volume_fmt: string;

  // Daily snapshots — one entry per day aggregated across all sources
  daily_snapshots: DailySnapshot[];

  // Integrator breakdown (cleaned from metadata.total_volume_by_source)
  integrator_stats: IntegratorStat[];

  // Timeframe stats: 7d, 30d, 90d, 180d
  timeframes: TimeframeStats[];

  // Peak / notable days
  peak_day: DailySnapshot;
  recent_7d_avg: number;
  recent_30d_avg: number;

  // Unique source count
  unique_sources: number;
  total_entries: number;
}

export class VolumePreprocessor {
  private dataPath: string;

  constructor(dataFileName = "volume.json") {
    // Expects the file at: <project_root>/data/volume.json
    this.dataPath = path.join(process.cwd(), "data", dataFileName);
  }

  load(): RawVolumeData {
    if (!fs.existsSync(this.dataPath)) {
      throw new Error(
        `Volume data file not found at: ${this.dataPath}\n` +
          `Please place your volume.json inside a /data folder at the project root.`,
      );
    }
    const raw = fs.readFileSync(this.dataPath, "utf-8");
    return JSON.parse(raw) as RawVolumeData;
  }

  process(): PreprocessedVolumeData {
    const raw = this.load();
    const entries = raw.volumes;
    const metadata = raw.metadata;

    // ── 1. Build daily snapshots ──────────────────────────────────────────────
    const dailyMap = new Map<
      string,
      { volume: number; orders: number; sources: Set<string> }
    >();

    for (const entry of entries) {
      const date = toDateStr(entry.timestamp);
      const sourceName = resolveSourceName(entry.source);

      if (!dailyMap.has(date)) {
        dailyMap.set(date, { volume: 0, orders: 0, sources: new Set() });
      }
      const day = dailyMap.get(date)!;
      day.volume += entry.total_volume;
      day.orders += entry.total_order_count;
      day.sources.add(sourceName);
    }

    const daily_snapshots: DailySnapshot[] = Array.from(dailyMap.entries())
      .map(([date, d]) => ({
        date,
        total_volume_usd: parseFloat(d.volume.toFixed(2)),
        total_orders: d.orders,
        sources_active: d.sources.size,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // ── 2. Date range ─────────────────────────────────────────────────────────
    const data_from = daily_snapshots[0]?.date ?? "";
    const data_to = daily_snapshots[daily_snapshots.length - 1]?.date ?? "";
    const total_days = daily_snapshots.length;

    // ── 3. Peak day ───────────────────────────────────────────────────────────
    const peak_day = daily_snapshots.reduce((best, d) =>
      d.total_volume_usd > best.total_volume_usd ? d : best,
    );

    // ── 4. Integrator stats ───────────────────────────────────────────────────
    // ── 4. Integrator stats ───────────────────────────────────────────────────
    const totalVol = metadata.total_volume;

    const integratorMap = new Map<
      string,
      { volume: number; orders: number; originalName: string }
    >();

    for (const src of metadata.total_volume_by_source) {
      const normalizedName = resolveSourceName({
        source_type: src.source_type,
      } as VolumeSource);
      const key = normalizedName.toLowerCase();

      const existing = integratorMap.get(key);
      if (existing) {
        existing.volume += src.total_volume;
        existing.orders += src.total_order_count;
      } else {
        integratorMap.set(key, {
          volume: src.total_volume,
          orders: src.total_order_count,
          originalName: normalizedName,
        });
      }
    }

    const integrator_stats: IntegratorStat[] = Array.from(
      integratorMap.entries(),
    )
      .map(([_, stats]) => ({
        name: stats.originalName,
        total_volume: parseFloat(stats.volume.toFixed(2)),
        total_orders: stats.orders,
        volume_share_pct: parseFloat(
          ((stats.volume / totalVol) * 100).toFixed(2),
        ),
        avg_order_size:
          stats.orders > 0
            ? parseFloat((stats.volume / stats.orders).toFixed(2))
            : 0,
      }))
      .sort((a, b) => b.total_volume - a.total_volume)
      .slice(0, 20);

    const unique_sources = integrator_stats.length; // ← now accurate
    // ── 5. Timeframe stats ────────────────────────────────────────────────────
    const now = new Date(data_to);

    function getTimeframeStats(
      label: string,
      daysBack: number,
      snapshots: DailySnapshot[],
    ): TimeframeStats {
      const from = new Date(now);
      from.setDate(from.getDate() - daysBack);
      const fromStr = from.toISOString().split("T")[0];

      const priorFrom = new Date(from);
      priorFrom.setDate(priorFrom.getDate() - daysBack);
      const priorFromStr = priorFrom.toISOString().split("T")[0];

      const currentPeriod = snapshots.filter(
        (d) => d.date >= fromStr && d.date <= data_to,
      );
      const priorPeriod = snapshots.filter(
        (d) => d.date >= priorFromStr && d.date < fromStr,
      );

      const currentVol = currentPeriod.reduce(
        (s, d) => s + d.total_volume_usd,
        0,
      );
      const priorVol = priorPeriod.reduce((s, d) => s + d.total_volume_usd, 0);

      const peakInPeriod = currentPeriod.reduce(
        (best, d) => (d.total_volume_usd > best.total_volume_usd ? d : best),
        currentPeriod[0] ?? {
          date: "",
          total_volume_usd: 0,
          total_orders: 0,
          sources_active: 0,
        },
      );
      const lowInPeriod = currentPeriod.reduce(
        (worst, d) => (d.total_volume_usd < worst.total_volume_usd ? d : worst),
        currentPeriod[0] ?? {
          date: "",
          total_volume_usd: 0,
          total_orders: 0,
          sources_active: 0,
        },
      );

      return {
        label,
        from: fromStr,
        to: data_to,
        total_volume: parseFloat(currentVol.toFixed(2)),
        total_orders: currentPeriod.reduce((s, d) => s + d.total_orders, 0),
        avg_daily_volume:
          currentPeriod.length > 0
            ? parseFloat((currentVol / currentPeriod.length).toFixed(2))
            : 0,
        peak_day: {
          date: peakInPeriod.date,
          volume: peakInPeriod.total_volume_usd,
        },
        low_day: {
          date: lowInPeriod.date,
          volume: lowInPeriod.total_volume_usd,
        },
        growth_pct_vs_prior_period: growthPct(currentVol, priorVol),
      };
    }

    const timeframes: TimeframeStats[] = [
      getTimeframeStats("last_7d", 7, daily_snapshots),
      getTimeframeStats("last_30d", 30, daily_snapshots),
      getTimeframeStats("last_90d", 90, daily_snapshots),
      getTimeframeStats("last_180d", 180, daily_snapshots),
    ];

    // ── 6. Recent averages ────────────────────────────────────────────────────
    const last7 = daily_snapshots.slice(-7);
    const last30 = daily_snapshots.slice(-30);
    const recent_7d_avg =
      last7.length > 0
        ? parseFloat(
            (
              last7.reduce((s, d) => s + d.total_volume_usd, 0) / last7.length
            ).toFixed(2),
          )
        : 0;
    const recent_30d_avg =
      last30.length > 0
        ? parseFloat(
            (
              last30.reduce((s, d) => s + d.total_volume_usd, 0) / last30.length
            ).toFixed(2),
          )
        : 0;

    return {
      data_from,
      data_to,
      total_days,
      all_time_volume: parseFloat(metadata.total_volume.toFixed(2)),
      all_time_orders: metadata.total_order_count,
      all_time_volume_fmt: formatUSD(metadata.total_volume),
      daily_snapshots,
      integrator_stats,
      timeframes,
      peak_day,
      recent_7d_avg,
      recent_30d_avg,
      unique_sources,
      total_entries: entries.length,
    };
  }
}



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

// ── Category-specific types ───────────────────────────────────────────────────

export interface CategoryStat {
  name: string;
  total_volume: number;
  total_orders: number;
  volume_share_pct: number;
  avg_order_size: number;
  growth_7d_pct: number | null;
  growth_30d_pct: number | null;
}

export interface CategoryDailyTrend {
  date: string;
  total_volume: number;
  category_count: number;
  dominant_category: string;
  top_category_pct: number;
  diversity_index: number;
}

export interface PreprocessedCategoryVolumeData {
  // Date range of the full dataset
  data_from: string;
  data_to: string;
  total_days: number;

  // All-time totals
  all_time_volume: number;
  all_time_orders: number;
  all_time_volume_fmt: string;
  total_categories: number;

  // Daily snapshots — one entry per day aggregated across all categories
  daily_snapshots: DailySnapshot[];

  // Category breakdown — what percentage of volume each category drives
  category_stats: CategoryStat[];

  // Timeframe stats: 7d, 30d, 90d, 180d
  timeframes: TimeframeStats[];

  // Peak / notable days
  peak_day: DailySnapshot & {
    dominant_category: string;
    dominant_category_pct: number;
  };
  recent_7d_avg: number;
  recent_30d_avg: number;

  // Category daily trends for the last 14 days
  category_daily_trends: CategoryDailyTrend[];

  // Diversity metrics
  avg_diversity_index: number;

  // Data summary
  total_entries: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function calculateDiversityIndex(
  categoryVolumeMap: Map<string, number>,
  totalVolume: number,
): number {
  // Herfindahl index (simplified): 1 - sum(share^2)
  // 0 = monopoly (one category 100%), 1 = perfect diversity
  let sumSquares = 0;
  for (const vol of categoryVolumeMap.values()) {
    const share = vol / totalVolume;
    sumSquares += share * share;
  }
  return Math.max(0, Math.min(1, 1 - sumSquares));
}

// ── Main preprocessor class ───────────────────────────────────────────────────

export class VolumePreprocessor {
  private dataPath: string;

  constructor(dataFileName = "category_volume.json") {
    // Expects the file at: <project_root>/data/category_volume.json
    this.dataPath = path.join(process.cwd(), "data", dataFileName);
  }

  load(): RawVolumeData {
    if (!fs.existsSync(this.dataPath)) {
      throw new Error(
        `Category volume data file not found at: ${this.dataPath}\n` +
          `Please place your category_volume.json inside a /data folder at the project root.`,
      );
    }
    const raw = fs.readFileSync(this.dataPath, "utf-8");
    return JSON.parse(raw) as RawVolumeData;
  }

  process(): PreprocessedCategoryVolumeData {
    const raw = this.load();
    const entries = raw.volumes;
    const metadata = raw.metadata;

    // ── 1. Build daily snapshots & category maps for each day ─────────────────

    const dailyMap = new Map<
      string,
      {
        volume: number;
        orders: number;
        categories: Map<string, number>;
        category_count: number;
      }
    >();

    const allCategoriesMap = new Map<string, number>();

    for (const entry of entries) {
      const date = toDateStr(entry.timestamp);
      // For category volume, use the "source" as the category
      // In a real setup, this might be a separate "category" field
      const categoryName = this.extractCategory(entry);

      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          volume: 0,
          orders: 0,
          categories: new Map(),
          category_count: 0,
        });
      }
      const day = dailyMap.get(date)!;
      day.volume += entry.total_volume;
      day.orders += entry.total_order_count;

      if (!day.categories.has(categoryName)) {
        day.categories.set(categoryName, 0);
      }
      day.categories.set(
        categoryName,
        day.categories.get(categoryName)! + entry.total_volume,
      );

      // Track all categories for global stats
      if (!allCategoriesMap.has(categoryName)) {
        allCategoriesMap.set(categoryName, 0);
      }
      allCategoriesMap.set(
        categoryName,
        allCategoriesMap.get(categoryName)! + entry.total_volume,
      );
    }

    // Update category counts after processing
    for (const day of dailyMap.values()) {
      day.category_count = day.categories.size;
    }

    // ── 2. Convert to daily snapshots ──────────────────────────────────────────

    const daily_snapshots: DailySnapshot[] = Array.from(dailyMap.entries())
      .map(([date, d]) => ({
        date,
        total_volume_usd: parseFloat(d.volume.toFixed(2)),
        total_orders: d.orders,
        sources_active: d.category_count, // Reuse sources_active for category_count
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // ── 3. Date range ─────────────────────────────────────────────────────────

    const data_from = daily_snapshots[0]?.date ?? "";
    const data_to = daily_snapshots[daily_snapshots.length - 1]?.date ?? "";
    const total_days = daily_snapshots.length;

    // ── 4. Peak day with dominant category ─────────────────────────────────────

    let peak_day = daily_snapshots[0];
    const dailyMapValues = Array.from(dailyMap.entries());
    let peakDayCategories: Map<string, number> | null = null;

    for (const [date, daySummary] of dailyMapValues) {
      if (daySummary.volume > (peak_day?.total_volume_usd ?? 0)) {
        peak_day = daily_snapshots.find((d) => d.date === date)!;
        peakDayCategories = daySummary.categories;
      }
    }

    const peakCategoryEntries = peakDayCategories
      ? Array.from(peakDayCategories.entries()).sort((a, b) => b[1] - a[1])
      : [];
    const dominantCat = peakCategoryEntries[0]
      ? {
          name: peakCategoryEntries[0][0],
          pct: parseFloat(
            (
              (peakCategoryEntries[0][1] /
                (peakDayCategories
                  ? Array.from(peakDayCategories.values()).reduce(
                      (a, b) => a + b,
                      0,
                    )
                  : 1)) *
              100
            ).toFixed(2),
          ),
        }
      : { name: "N/A", pct: 0 };

    const peak_day_with_category = {
      ...peak_day,
      dominant_category: dominantCat.name,
      dominant_category_pct: dominantCat.pct,
    };

    // ── 5. Category statistics ─────────────────────────────────────────────────

    const totalVol = metadata.total_volume;

    const category_stats: CategoryStat[] = Array.from(
      allCategoriesMap.entries(),
    )
      .map(([name, volume]) => {
        // Find orders for this category (sum from all entries)
        let orders = 0;
        for (const entry of entries) {
          const catName = this.extractCategory(entry);
          if (catName === name) {
            orders += entry.total_order_count;
          }
        }

        // Calculate 7d and 30d growth
        const last7 = daily_snapshots.slice(-7);
        const last30 = daily_snapshots.slice(-30);
        const prior7 = daily_snapshots.slice(-14, -7);
        const prior30 = daily_snapshots.slice(-60, -30);

        function sumCategoryVolumeInPeriod(
          snapshots: DailySnapshot[],
          categoryName: string,
        ): number {
          let sum = 0;
          for (const snapshot of snapshots) {
            const dayData = dailyMap.get(snapshot.date);
            if (dayData) {
              sum += dayData.categories.get(categoryName) ?? 0;
            }
          }
          return sum;
        }

        const vol7d = sumCategoryVolumeInPeriod(last7, name);
        const volPrior7d = sumCategoryVolumeInPeriod(prior7, name);
        const vol30d = sumCategoryVolumeInPeriod(last30, name);
        const volPrior30d = sumCategoryVolumeInPeriod(prior30, name);

        return {
          name,
          total_volume: parseFloat(volume.toFixed(2)),
          total_orders: orders,
          volume_share_pct: parseFloat(((volume / totalVol) * 100).toFixed(2)),
          avg_order_size:
            orders > 0 ? parseFloat((volume / orders).toFixed(2)) : 0,
          growth_7d_pct: growthPct(vol7d, volPrior7d),
          growth_30d_pct: growthPct(vol30d, volPrior30d),
        };
      })
      .sort((a, b) => b.total_volume - a.total_volume)
      .slice(0, 20); // top 20 categories

    // ── 6. Timeframe stats ────────────────────────────────────────────────────

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

    // ── 7. Recent averages ────────────────────────────────────────────────────

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

    // ── 8. Category daily trends (last 14 days) ───────────────────────────────

    const category_daily_trends: CategoryDailyTrend[] = daily_snapshots
      .slice(-14)
      .map((snapshot) => {
        const dayData = dailyMap.get(snapshot.date);
        if (!dayData) {
          return {
            date: snapshot.date,
            total_volume: snapshot.total_volume_usd,
            category_count: 0,
            dominant_category: "N/A",
            top_category_pct: 0,
            diversity_index: 0,
          };
        }

        const categoryEntries = Array.from(dayData.categories.entries()).sort(
          (a, b) => b[1] - a[1],
        );
        const dominantEntry = categoryEntries[0];
        const domCat = dominantEntry
          ? {
              name: dominantEntry[0],
              pct: parseFloat(
                ((dominantEntry[1] / dayData.volume) * 100).toFixed(2),
              ),
            }
          : { name: "N/A", pct: 0 };

        const diversityIdx = calculateDiversityIndex(
          dayData.categories,
          dayData.volume,
        );

        return {
          date: snapshot.date,
          total_volume: snapshot.total_volume_usd,
          category_count: dayData.category_count,
          dominant_category: domCat.name,
          top_category_pct: domCat.pct,
          diversity_index: diversityIdx,
        };
      });

    // ── 9. Average diversity index ────────────────────────────────────────────

    const avg_diversity_index =
      category_daily_trends.length > 0
        ? parseFloat(
            (
              category_daily_trends.reduce((s, t) => s + t.diversity_index, 0) /
              category_daily_trends.length
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
      total_categories: allCategoriesMap.size,
      daily_snapshots,
      category_stats,
      timeframes,
      peak_day: peak_day_with_category,
      recent_7d_avg,
      recent_30d_avg,
      category_daily_trends,
      avg_diversity_index,
      total_entries: entries.length,
    };
  }

  // Extract category from entry
  // This should be customized based on your data structure
  private extractCategory(entry: RawVolumeEntry): string {
    const source = entry.source;
    if (typeof source.source_type === "string") {
      return source.source_type;
    }
    if (
      typeof source.source_type === "object" &&
      "Referrer" in source.source_type
    ) {
      return source.source_type.Referrer.platform;
    }
    return "Unknown";
  }
}

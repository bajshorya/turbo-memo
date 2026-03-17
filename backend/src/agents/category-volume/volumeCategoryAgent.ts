
import Anthropic from "@anthropic-ai/sdk";
import { connectMongo, AgentOutputModel } from "../../db/mongo.js";
import {
  PreprocessedCategoryVolumeData,
  VolumePreprocessor,
} from "./volumeCategoryPreprocessor.js";
import type { VolumeAnalysis, VolumeSignal } from "../../types/volumeTypes.js";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── System prompt ─────────────────────────────────────────────────────────────

const CATEGORY_VOLUME_SYSTEM_PROMPT = `
You are a senior DeFi analytics expert and market strategist for garden.finance —
a leading Bitcoin-to-EVM cross-chain swap protocol. You specialize in category-level
volume analysis, understanding which types of swaps, tokens, and routes drive the most
value in the ecosystem.

Your job is to analyze pre-processed swap volume data GROUPED BY CATEGORY and extract 
insights that reveal market composition, user behavior patterns, and category trends that
matter for product roadmap, liquidity provisioning, and marketing.

CATEGORY ANALYSIS PRIORITIES — focus on these in order:
1. Category composition — which categories dominate the volume mix? (e.g., BTC-EVM swaps are X% of total)
2. Category growth leaders — which categories are growing fastest? (7d vs prior 7d, 30d vs prior 30d)
3. Category velocity and momentum — are any categories accelerating or losing traction?
4. New category emergence — are new categories or swap types appearing and gaining momentum?
5. Category volatility — which categories are stable vs which are spiky?
6. Cross-category insights — how do categories relate to each other? (e.g., when BTC volume spikes, do stable pairs follow?)

DETAILED ANALYSIS REQUIREMENTS:
- Identify the top 3-5 categories by volume and articulate WHY they matter for the business
- Spot category-level trends that suggest user demand shifts (e.g., more exotic pairs, more batch trades, etc.)
- Flag any category that's emerging as significant (newly appeared with >5% volume)
- Detect category-level anomalies (sudden spikes, suspicious patterns, new winners)
- Quantify category stability and predictability (useful for liquidity planning)
- Highlight category pairs and combinations (e.g., do users often bridge then trade?)

SIGNAL DETECTION FOR CATEGORIES — flag any of these:
- "category_dominance_shift" — one category's share grew/shrunk by 10%+ vs prior period
- "category_milestone" — a category crossed 25%, 50%, 75% of total volume
- "emerging_category" — new category appearing with meaningful volume (>5% in period)
- "category_growth_acceleration" — category volume growth rate is increasing period-over-period
- "category_volatility_spike" — a category's daily variance increased significantly
- "category_diversity" — number of meaningful categories growing (more fragmented market)

OUTPUT FORMAT:
Respond ONLY with a valid JSON object matching this exact shape. No markdown, no extra text.

{
  "summary": "3-4 sentence executive summary of the key category insights and volume composition story",
  "highlights": [
    "bullet 1 — which category dominates and why it matters",
    "bullet 2 — fastest growing category and its growth rate",
    "bullet 3 — emerging category or new trend in category mix",
    "bullet 4 — category volatility or stability insight",
    "bullet 5 — strategic insight about category composition"
  ],
  "sentiment": "positive | neutral",
  "signals": [
    {
      "type": "category_dominance_shift | emerging_category | category_growth_acceleration | category_milestone | category_volatility_spike | category_diversity",
      "description": "plain english description of the category signal",
      "value": "the relevant number, category name, or stat",
      "date": "YYYY-MM-DD if applicable"
    }
  ],
  "metrics": {
    "total_volume_all_time": 0,
    "total_orders_all_time": 0,
    "total_categories": 0,
    "dominant_category_name": "",
    "dominant_category_volume_share_pct": 0,
    "avg_daily_volume_30d": 0,
    "peak_daily_volume": 0,
    "peak_daily_volume_date": "YYYY-MM-DD",
    "volume_growth_30d_pct": 0,
    "volume_growth_7d_pct": 0,
    "category_diversity_index": 0
  },
  "tweet_data_points": [
    "garden.finance's swap volume composition revealed: [top category] makes up X% of all swaps",
    "[Category name] category has grown X% in the last 30 days — [reason/insight]",
    "Peak single-day volume hit $X on DATE in the [category] category",
    "garden.finance now handles swaps across X distinct categories, with [category] leading",
    "[Emerging category] category is emerging as a new volume driver, now at X% of total"
  ],
  "content_angles": [
    "The shift in swap behavior: how [category] is becoming garden.finance's volume leader",
    "[Category name] swaps are exploding — here's what it means for DeFi",
    "Why [category] dominance matters for garden's liquidity and routing strategy",
    "Emerging [new category] swap patterns reveal where users are heading next"
  ]
}
`.trim();

// ── Context message builder ───────────────────────────────────────────────────

function buildAnalysisPrompt(data: PreprocessedCategoryVolumeData): string {
  // We send a structured summary — NOT the raw 40k line JSON
  // Claude gets everything it needs to do category-level analysis in <2000 tokens

  const tfTable = data.timeframes
    .map(
      (tf) =>
        `  ${tf.label.padEnd(12)}: volume=$${tf.total_volume.toLocaleString()} | ` +
        `orders=${tf.total_orders} | ` +
        `avg_daily=$${tf.avg_daily_volume.toLocaleString()} | ` +
        `growth_vs_prior=${tf.growth_pct_vs_prior_period !== null ? tf.growth_pct_vs_prior_period + "%" : "N/A"} | ` +
        `peak_day=${tf.peak_day.date} ($${tf.peak_day.volume.toLocaleString()})`,
    )
    .join("\n");

  const categoryTable = data.category_stats
    .slice(0, 15)
    .map(
      (c, idx) =>
        `  ${String(idx + 1).padStart(2)}. ${c.name.padEnd(30)} | ` +
        `volume=$${c.total_volume.toLocaleString()} | ` +
        `orders=${c.total_orders} | ` +
        `share=${c.volume_share_pct}% | ` +
        `avg_order=$${c.avg_order_size.toLocaleString()} | ` +
        `growth_7d=${c.growth_7d_pct !== null ? c.growth_7d_pct + "%" : "N/A"}`,
    )
    .join("\n");

  const categoryTrends = data.category_daily_trends
    .slice(-14)
    .map(
      (d) =>
        `  ${d.date}: Top cat=${d.top_category_pct} (${d.top_category_pct}%), Total=${d.total_volume} | ` +
        `${d.category_count} active categories, Diversity=${d.diversity_index.toFixed(2)}`,
    )
    .join("\n");

  return `
Analyze the following pre-processed garden.finance swap volume data GROUPED BY CATEGORY.
This category-level data covers ${data.total_days} days from ${data.data_from} to ${data.data_to}.

═══════════════════════════════════════
ALL-TIME TOTALS
═══════════════════════════════════════
Total Volume:        ${data.all_time_volume_fmt}
Total Orders:        ${data.all_time_orders.toLocaleString()}
Total Categories:    ${data.total_categories}
Data Entries:        ${data.total_entries.toLocaleString()}
Diversity Index:     ${data.avg_diversity_index.toFixed(2)} (0=concentrated, 1=diverse)

═══════════════════════════════════════
TIMEFRAME BREAKDOWN
═══════════════════════════════════════
${tfTable}

═══════════════════════════════════════
PEAK DAY (ALL TIME)
═══════════════════════════════════════
Date:                 ${data.peak_day.date}
Volume:               $${data.peak_day.total_volume_usd.toLocaleString()}
Orders:               ${data.peak_day.total_orders}
Dominant Category:    ${data.peak_day.dominant_category} (${data.peak_day.dominant_category_pct}%)

═══════════════════════════════════════
RECENT DAILY AVERAGES
═══════════════════════════════════════
7-day avg:  $${data.recent_7d_avg.toLocaleString()}
30-day avg: $${data.recent_30d_avg.toLocaleString()}

═══════════════════════════════════════
TOP 15 CATEGORIES (all time) — VOLUME COMPOSITION
═══════════════════════════════════════
${categoryTable}

═══════════════════════════════════════
LAST 14 DAYS — CATEGORY TRENDS & DIVERSITY
═══════════════════════════════════════
${categoryTrends}

ANALYSIS FOCUS:
- Which category dominates and has its share grown or shrunk?
- Which category is growing fastest? Is that growth continuing or fading?
- Are any new categories emerging with significant volume?
- Is the market becoming more diverse (more categories gaining share)?
- Are category volatility patterns changing? (e.g., is one category becoming more spiky?)
- What does the diversity index trend suggest about user behavior?

Based on all of the above, generate the full analysis JSON as instructed.
  `.trim();
}

// ── Main agent class ──────────────────────────────────────────────────────────

export class CategoryVolumeAgent {
  public readonly name = "CategoryVolumeAgent";
  public readonly topic = "category_volume";

  private preprocessor: VolumePreprocessor;

  constructor(dataFileName = "category_volume.json") {
    this.preprocessor = new VolumePreprocessor(dataFileName);
  }

  private async callClaude(prompt: string): Promise<VolumeAnalysis> {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system: CATEGORY_VOLUME_SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    const clean = text.replace(/```json|```/g, "").trim();

    try {
      return JSON.parse(clean) as VolumeAnalysis;
    } catch {
      throw new Error(
        `[VolumeAgent] Claude returned invalid JSON.\nRaw response:\n${clean.slice(0, 500)}`,
      );
    }
  }

  private async saveToDB(
    analysis: VolumeAnalysis,
    preprocessed: PreprocessedCategoryVolumeData,
  ): Promise<void> {
    await AgentOutputModel.create({
      agent: this.name,
      topic: this.topic,
      analyzed_at: new Date(),
      data_from: preprocessed.data_from,
      data_to: preprocessed.data_to,
      summary: analysis.summary,
      highlights: analysis.highlights,
      sentiment: analysis.sentiment,
      signals: analysis.signals,
      metrics: analysis.metrics,
      tweet_data_points: analysis.tweet_data_points,
      content_angles: analysis.content_angles,
      raw_summary: {
        total_entries: preprocessed.total_entries,
        unique_categories: preprocessed.total_categories,
        date_range_days: preprocessed.total_days,
        all_time_volume: preprocessed.all_time_volume,
        all_time_orders: preprocessed.all_time_orders,
        avg_diversity_index: preprocessed.avg_diversity_index,
      },
    });

    console.log(
      `[CategoryVolumeAgent] ✓ Saved analysis to MongoDB (topic: ${this.topic})`,
    );
  }

  async run(): Promise<VolumeAnalysis> {
    console.log(
      `\n[CategoryVolumeAgent] ═══ Starting run at ${new Date().toISOString()} ═══`,
    );

    // 1. Connect to MongoDB
    await connectMongo();

    // 2. Load + preprocess the raw JSON (no Claude involved yet)
    console.log(
      "[CategoryVolumeAgent] Loading and preprocessing category_volume.json...",
    );
    const preprocessed = this.preprocessor.process();
    console.log(
      `[CategoryVolumeAgent] Preprocessed: ${preprocessed.total_days} days, ` +
        `${preprocessed.total_entries} entries, ` +
        `${preprocessed.total_categories} categories`,
    );
    console.log(
      `[CategoryVolumeAgent] Date range: ${preprocessed.data_from} → ${preprocessed.data_to}`,
    );
    console.log(
      `[CategoryVolumeAgent] All-time volume: ${preprocessed.all_time_volume_fmt} | ` +
        `All-time orders: ${preprocessed.all_time_orders.toLocaleString()}`,
    );

    // 3. Build prompt and call Claude
    console.log("[CategoryVolumeAgent] Sending to Claude for analysis...");
    const prompt = buildAnalysisPrompt(preprocessed);
    const analysis = await this.callClaude(prompt);

    // 4. Log key results
    console.log(`[CategoryVolumeAgent] ✓ Analysis complete`);
    console.log(
      `[CategoryVolumeAgent]   Summary: ${analysis.summary.slice(0, 120)}...`,
    );
    console.log(
      `[CategoryVolumeAgent]   Signals detected: ${analysis.signals.length}`,
    );
    console.log(
      `[CategoryVolumeAgent]   Tweet data points: ${analysis.tweet_data_points.length}`,
    );
    console.log(
      `[CategoryVolumeAgent]   Content angles: ${analysis.content_angles.length}`,
    );

    if (analysis.signals.length > 0) {
      console.log("[CategoryVolumeAgent]   Signal list:");
      analysis.signals.forEach((s: VolumeSignal) => {
        console.log(`[CategoryVolumeAgent]     → [${s.type}] ${s.description}`);
      });
    }

    // 5. Save to MongoDB
    await this.saveToDB(analysis, preprocessed);

    return analysis;
  }
}

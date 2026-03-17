import {
  GoogleGenerativeAI,
  type GenerativeModel,
} from "@google/generative-ai";
import { connectMongo, AgentOutputModel } from "../../db/mongo.js";
import { VolumePreprocessor } from "./volumePreprocessor.js";
import type { PreprocessedVolumeData } from "./volumePreprocessor.js";
import type { VolumeAnalysis, VolumeSignal } from "../../types/volumeTypes.js";

const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ── System prompt ─────────────────────────────────────────────────────────────

const VOLUME_SYSTEM_PROMPT = `
You are a senior DeFi analytics expert and content strategist for garden.finance — 
a leading Bitcoin-to-EVM cross-chain swap protocol. You have deep expertise in 
on-chain volume analysis, DeFi market dynamics, and crypto marketing.

Your job is to analyze pre-processed swap volume data and extract every insight that 
is meaningful, notable, or tweetable. You understand what the crypto community finds 
impressive and what drives engagement on social media.

ANALYSIS PRIORITIES — focus on these in order:
1. All-time records or near-records (volume ATH, single day ATH, order count ATH)
2. Growth trends (7d vs prior 7d, 30d vs prior 30d — highlight acceleration)
3. Integrator dominance (which platforms are driving the most volume and why it matters)
4. Velocity signals (is volume accelerating, decelerating, or steady?)
5. Ecosystem breadth (how many unique sources, what does this say about adoption?)
6. Noteworthy anomalies (sudden spikes, new integrators breaking out, etc.)

CONTENT RULES:
- Only generate positive or neutral observations — never frame data as negative
- Use exact numbers from the data — never round unless you state it's approximate
- Think like a crypto marketing expert — what would make someone stop scrolling?
- tweet_data_points must be standalone facts usable directly in a tweet
- content_angles must be narrative hooks the marketing team can build a story around

SIGNAL DETECTION — flag any of these if present in the data:
- "all_time_high" — volume or orders at or near their highest recorded value
- "growth_streak" — volume increasing for 5+ consecutive days
- "volume_spike" — single day volume 2x or more above recent 7d average
- "integrator_milestone" — any integrator crossing a round number threshold
- "record_single_day" — highest single-day volume in the dataset
- "new_integrator" — a source that appears recently with meaningful volume

OUTPUT FORMAT:
Respond ONLY with a valid JSON object matching this exact shape. No markdown, no extra text.

{
  "summary": "3-4 sentence executive summary of the most important volume story",
  "highlights": [
    "bullet 1 — specific and numerical",
    "bullet 2 — specific and numerical",
    "bullet 3",
    "bullet 4",
    "bullet 5"
  ],
  "sentiment": "positive | neutral",
  "signals": [
    {
      "type": "all_time_high | growth_streak | integrator_milestone | volume_spike | new_integrator | record_single_day",
      "description": "plain english description of the signal",
      "value": "the relevant number or stat",
      "date": "YYYY-MM-DD if applicable"
    }
  ],
  "metrics": {
    "total_volume_all_time": 0,
    "total_orders_all_time": 0,
    "avg_daily_volume_30d": 0,
    "peak_daily_volume": 0,
    "peak_daily_volume_date": "YYYY-MM-DD",
    "top_integrator_name": "",
    "top_integrator_volume_share_pct": 0,
    "volume_growth_30d_pct": 0,
    "volume_growth_7d_pct": 0
  },
  "tweet_data_points": [
    "garden.finance has processed $X in total swap volume across Y orders",
    "Phantom wallet alone drove $X in volume — X% of all garden swaps",
    "Peak single-day volume hit $X on DATE",
    "30-day volume is up X% vs the prior 30 days",
    "garden.finance now sees volume from X+ unique integrators and platforms"
  ],
  "content_angles": [
    "The Phantom effect: how wallet integrations are supercharging garden volume",
    "From $0 to $Xm: garden's volume growth story in 6 months",
    "Why X% of garden volume now comes from ecosystem partners"
  ]
}
`.trim();

// ── Context message builder ───────────────────────────────────────────────────

function buildAnalysisPrompt(data: PreprocessedVolumeData): string {
  // We send a structured summary — NOT the raw 40k line JSON
  // Gemini gets everything it needs to do deep analysis in <2000 tokens

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

  const intTable = data.integrator_stats
    .slice(0, 15)
    .map(
      (i, idx) =>
        `  ${String(idx + 1).padStart(2)}. ${i.name.padEnd(25)} | ` +
        `volume=$${i.total_volume.toLocaleString()} | ` +
        `orders=${i.total_orders} | ` +
        `share=${i.volume_share_pct}% | ` +
        `avg_order=$${i.avg_order_size.toLocaleString()}`,
    )
    .join("\n");

  // Last 30 daily snapshots for trend analysis
  const recentDays = data.daily_snapshots
    .slice(-30)
    .map(
      (d) =>
        `  ${d.date}: $${d.total_volume_usd.toLocaleString()} (${d.total_orders} orders, ${d.sources_active} sources active)`,
    )
    .join("\n");

  return `
Analyze the following pre-processed garden.finance swap volume data.
This data covers ${data.total_days} days from ${data.data_from} to ${data.data_to}.

═══════════════════════════════════════
ALL-TIME TOTALS
═══════════════════════════════════════
Total Volume:  ${data.all_time_volume_fmt}
Total Orders:  ${data.all_time_orders.toLocaleString()}
Unique Sources: ${data.unique_sources}
Data Entries:  ${data.total_entries.toLocaleString()}

═══════════════════════════════════════
TIMEFRAME BREAKDOWN
═══════════════════════════════════════
${tfTable}

═══════════════════════════════════════
PEAK DAY (ALL TIME)
═══════════════════════════════════════
Date:   ${data.peak_day.date}
Volume: $${data.peak_day.total_volume_usd.toLocaleString()}
Orders: ${data.peak_day.total_orders}

═══════════════════════════════════════
RECENT DAILY AVERAGES
═══════════════════════════════════════
7-day avg:  $${data.recent_7d_avg.toLocaleString()}
30-day avg: $${data.recent_30d_avg.toLocaleString()}

═══════════════════════════════════════
TOP 15 INTEGRATORS / SOURCES (all time)
═══════════════════════════════════════
${intTable}

═══════════════════════════════════════
LAST 30 DAYS — DAILY DETAIL
═══════════════════════════════════════
${recentDays}

Based on all of the above, generate the full analysis JSON as instructed.
  `.trim();
}

// ── Main agent class ──────────────────────────────────────────────────────────

export class VolumeAgent {
  public readonly name = "VolumeAgent";
  public readonly topic = "swap_volume";

  private preprocessor: VolumePreprocessor;
  private model: GenerativeModel;

  constructor(dataFileName = "volume.json") {
    this.preprocessor = new VolumePreprocessor(dataFileName);

    // ✅ FIXED FOR MARCH 2026 — use a current model
    this.model = client.getGenerativeModel({
      model: "gemini-2.5-flash", // ← BEST CHOICE (fast + reliable)
      // model: "gemini-2.5-pro",         // ← use this if you want maximum intelligence
      systemInstruction: VOLUME_SYSTEM_PROMPT,
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 8192,
        temperature: 0.2,
      },
    });
  }

  // ← Your callGemini, saveToDB, and run() stay 100% unchanged

  private async callGemini(
    prompt: string,
    retryCount = 0,
  ): Promise<VolumeAnalysis> {
    const maxRetries = 3;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text().trim();

      console.log("[VolumeAgent] Raw response length:", text.length);

      try {
        return JSON.parse(text) as VolumeAnalysis;
      } catch (error) {
        // If JSON parsing fails, log and rethrow
        console.error("[VolumeAgent] Failed to parse JSON response:", error);
        throw new Error(
          `JSON parse error: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    } catch (error: any) {
      // Handle rate limiting (429 errors)
      if (error.status === 429 && retryCount < maxRetries) {
        const waitTime = Math.pow(2, retryCount) * 2000; // Exponential backoff: 2s, 4s, 8s
        console.log(
          `[VolumeAgent] Rate limited. Retrying in ${waitTime / 1000} seconds... (attempt ${retryCount + 1}/${maxRetries})`,
        );

        await new Promise((resolve) => setTimeout(resolve, waitTime));
        return this.callGemini(prompt, retryCount + 1);
      }

      // If it's not a rate limit error or we're out of retries, rethrow
      throw error;
    }
  }

  private async saveToDB(
    analysis: VolumeAnalysis,
    preprocessed: PreprocessedVolumeData,
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
        unique_sources: preprocessed.unique_sources,
        date_range_days: preprocessed.total_days,
        all_time_volume: preprocessed.all_time_volume,
        all_time_orders: preprocessed.all_time_orders,
      },
    });

    console.log(
      `[VolumeAgent] ✓ Saved analysis to MongoDB (topic: ${this.topic})`,
    );
  }

  async run(): Promise<VolumeAnalysis> {
    console.log(
      `\n[VolumeAgent] ═══ Starting run at ${new Date().toISOString()} ═══`,
    );

    // 1. Connect to MongoDB
    await connectMongo();

    // 2. Load + preprocess the raw JSON (no Gemini involved yet)
    console.log("[VolumeAgent] Loading and preprocessing volume.json...");
    const preprocessed = this.preprocessor.process();
    console.log(
      `[VolumeAgent] Preprocessed: ${preprocessed.total_days} days, ` +
        `${preprocessed.total_entries} entries, ` +
        `${preprocessed.unique_sources} sources`,
    );
    console.log(
      `[VolumeAgent] Date range: ${preprocessed.data_from} → ${preprocessed.data_to}`,
    );
    console.log(
      `[VolumeAgent] All-time volume: ${preprocessed.all_time_volume_fmt} | ` +
        `All-time orders: ${preprocessed.all_time_orders.toLocaleString()}`,
    );

    // 3. Build prompt and call Gemini
    console.log("[VolumeAgent] Sending to Gemini for analysis...");
    const prompt = buildAnalysisPrompt(preprocessed);
    const analysis = await this.callGemini(prompt);

    // 4. Log key results
    console.log(`[VolumeAgent] ✓ Analysis complete`);
    console.log(
      `[VolumeAgent]   Summary: ${analysis.summary.slice(0, 120)}...`,
    );
    console.log(`[VolumeAgent]   Signals detected: ${analysis.signals.length}`);
    console.log(
      `[VolumeAgent]   Tweet data points: ${analysis.tweet_data_points.length}`,
    );
    console.log(
      `[VolumeAgent]   Content angles: ${analysis.content_angles.length}`,
    );

    if (analysis.signals.length > 0) {
      console.log("[VolumeAgent]   Signal list:");
      analysis.signals.forEach((s: VolumeSignal) => {
        console.log(`[VolumeAgent]     → [${s.type}] ${s.description}`);
      });
    }

    // 5. Save to MongoDB
    await this.saveToDB(analysis, preprocessed);

    return analysis;
  }
}

// backend/src/agents/fees/feesAgent.ts

import {
  GoogleGenerativeAI,
  type GenerativeModel,
} from "@google/generative-ai";
import { connectMongo, AgentOutputModel } from "../../db/mongo.js";
import {
  FeesPreprocessor,
  type PreprocessedFeesData,
} from "./feesPreprocessor.js";
import type { FeesAnalysis, FeesSignal } from "../../types/feesTypes.js";

const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ── System prompt (keep the same) ─────────────────────────────────────────────

const FEES_SYSTEM_PROMPT = `
You are a senior DeFi analytics expert and revenue strategist for garden.finance — 
a leading Bitcoin-to-EVM cross-chain swap protocol. You have deep expertise in 
fee economics, revenue analysis, and DeFi protocol sustainability.

Your job is to analyze pre-processed fee and revenue data to extract every insight 
that is meaningful about garden.finance's income, growth, and sustainability. You 
understand what investors, partners, and the crypto community care about regarding 
protocol revenue.

ANALYSIS PRIORITIES — focus on these in order:

1. REVENUE MILESTONES
   - All-time fee records (total fees, daily fees, monthly fees)
   - Crossing significant thresholds ($1M, $10M, $100M in total fees)
   - Records in daily, weekly, or monthly fee generation

2. GROWTH METRICS
   - Fee growth trends (7d vs prior 7d, 30d vs prior 30d)
   - Acceleration/deceleration in revenue growth

3. SEASONAL PATTERNS
   - Weekly fee patterns (are certain weeks stronger?)
   - Notable spikes and their potential causes

4. SUSTAINABILITY METRICS
   - Estimated annual runrate
   - Consistency of fee generation

5. NOTEWORTHY ANOMALIES
   - Fee spikes (what might have caused them?)
   - Sustained growth periods

SIGNAL DETECTION — flag any of these if present in the data:

- "fee_all_time_high" — weekly fees at highest ever
- "revenue_milestone" — crossing a round number threshold in total fees
- "fee_rate_spike" — fee spike significantly above normal
- "growth_acceleration" — fee growth rate increasing significantly
- "record_single_day" — highest single-week fees in dataset
- "sustained_growth" — multiple consecutive weeks of growth

CONTENT RULES:
- Frame data positively — emphasize growth, sustainability, and protocol strength
- Use exact numbers from the data
- tweet_data_points must be standalone facts for social media
- content_angles must be narrative hooks for marketing

OUTPUT FORMAT:
Respond ONLY with a valid JSON object matching this exact shape. No markdown, no extra text.

{
  "summary": "3-4 sentence executive summary of the most important revenue story",
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
      "type": "fee_all_time_high | revenue_milestone | fee_rate_spike | growth_acceleration | record_single_day | sustained_growth",
      "description": "plain english description of the signal",
      "value": "the relevant number or stat",
      "date": "YYYY-MM-DD if applicable"
    }
  ],
  "metrics": {
    "total_fees_all_time": 0,
    "total_volume_all_time": 0,
    "total_orders_all_time": 0,
    "avg_daily_fees_30d": 0,
    "avg_fee_rate_pct": 0,
    "peak_daily_fees": 0,
    "peak_daily_fees_date": "YYYY-MM-DD",
    "peak_daily_volume": 0,
    "peak_daily_volume_date": "YYYY-MM-DD",
    "top_fee_source_name": "",
    "top_fee_source_share_pct": 0,
    "fees_growth_30d_pct": 0,
    "fees_growth_7d_pct": 0,
    "estimated_annual_fees_runrate": 0,
    "fees_per_order_avg_usd": 0
  },
  "tweet_data_points": [
    "garden.finance has generated $X in total fees",
    "Fee revenue grew X% in the last 30 days — showing strong protocol adoption",
    "Peak weekly fees hit $X on DATE",
    "garden.finance is on track to generate $X in annualized fees",
    "The protocol has seen X weeks of sustained fee growth"
  ],
  "content_angles": [
    "The revenue flywheel: how garden.finance turns volume into sustainable income",
    "From fees to fundamentals: garden's path to protocol profitability",
    "Breaking down garden.finance's revenue growth story",
    "What $X in fees tells us about garden's product-market fit"
  ]
}
`.trim();

// ── Context message builder ───────────────────────────────────────────────────

function buildAnalysisPrompt(data: PreprocessedFeesData): string {
  // Format weekly data for display
  const weeklyTable = data.daily_snapshots
    .slice(-12) // Show last 12 weeks
    .map(
      (snapshot) =>
        `  Week of ${snapshot.date}: $${(snapshot.total_fees_usd / 1000).toFixed(0)}K fees`,
    )
    .join("\n");

  const tfTable = data.timeframes
    .map(
      (tf) =>
        `  ${tf.label.padEnd(12)}: fees=$${(tf.total_fees_usd / 1000).toFixed(0)}K | ` +
        `growth=${tf.growth_pct_vs_prior_period !== null ? tf.growth_pct_vs_prior_period + "%" : "N/A"}`,
    )
    .join("\n");

  return `
Analyze the following pre-processed garden.finance fee revenue data.
This data covers ${data.total_entries} weeks from ${data.data_from} to ${data.data_to}.

═══════════════════════════════════════
ALL-TIME TOTALS
═══════════════════════════════════════
Total Fees:     ${data.all_time_fees_fmt}
Number of Weeks: ${data.total_entries}

═══════════════════════════════════════
TIMEFRAME BREAKDOWN (fee growth)
═══════════════════════════════════════
${tfTable}

═══════════════════════════════════════
PEAK WEEK
═══════════════════════════════════════
Peak Fees:  ${data.peak_fees_day.date} ($${(data.peak_fees_day.total_fees_usd / 1000).toFixed(0)}K)

═══════════════════════════════════════
RECENT AVERAGES
═══════════════════════════════════════
7-day avg fees:  $${data.recent_7d_avg_fees.toFixed(2)}/day
30-day avg fees: $${data.recent_30d_avg_fees.toFixed(2)}/day
Annual Runrate:  $${(data.estimated_annual_fees_runrate / 1000000).toFixed(1)}M

═══════════════════════════════════════
LAST 12 WEEKS — WEEKLY FEES
═══════════════════════════════════════
${weeklyTable}

Based on all of the above, generate the full analysis JSON as instructed.
Focus on revenue growth, milestones, and sustainability given the weekly data structure.
Note that volume and order data is not available in this dataset.
  `.trim();
}

// ── Main agent class with model fallback ──────────────────────────────────────

export class FeesAgent {
  public readonly name = "FeesAgent";
  public readonly topic = "fees_analysis";

  private preprocessor: FeesPreprocessor;
  private model: GenerativeModel;
  private fallbackModels: string[] = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-pro",
    "gemini-1.5-flash",
  ];

  constructor(dataFileName = "fees.json") {
    this.preprocessor = new FeesPreprocessor(dataFileName);
    this.model = this.createModel("gemini-2.5-flash");
  }

  private createModel(modelName: string): GenerativeModel {
    console.log(`[FeesAgent] Initializing model: ${modelName}`);
    return client.getGenerativeModel({
      model: modelName,
      systemInstruction: FEES_SYSTEM_PROMPT,
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 8192,
        temperature: 0.2,
      },
    });
  }

  private async callGeminiWithModel(
    prompt: string,
    model: GenerativeModel,
    modelName: string,
    retryCount = 0,
  ): Promise<FeesAnalysis> {
    const maxRetries = 3;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();

      console.log(
        `[FeesAgent] Raw response length (${modelName}):`,
        text.length,
      );

      try {
        return JSON.parse(text) as FeesAnalysis;
      } catch (error) {
        console.error(
          `[FeesAgent] Failed to parse JSON response from ${modelName}:`,
          error,
        );
        throw new Error(
          `JSON parse error: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    } catch (error: any) {
      if (
        (error.status === 429 || error.status === 503) &&
        retryCount < maxRetries
      ) {
        const waitTime = Math.pow(2, retryCount) * 2000;
        console.log(
          `[FeesAgent] ${error.status === 429 ? "Rate limited" : "Service unavailable"}. Retrying in ${waitTime / 1000} seconds... (attempt ${retryCount + 1}/${maxRetries})`,
        );

        await new Promise((resolve) => setTimeout(resolve, waitTime));
        return this.callGeminiWithModel(
          prompt,
          model,
          modelName,
          retryCount + 1,
        );
      }
      throw error;
    }
  }

  private async callGemini(prompt: string): Promise<FeesAnalysis> {
    const modelsToTry = [
      { model: this.model, name: "gemini-2.5-flash" },
      ...this.fallbackModels.map((name) => ({
        model: this.createModel(name),
        name,
      })),
    ];

    let lastError: Error | null = null;

    for (let i = 0; i < modelsToTry.length; i++) {
      const { model, name } = modelsToTry[i];

      try {
        console.log(
          `[FeesAgent] Trying model: ${name}${i > 0 ? " (fallback)" : ""}`,
        );
        return await this.callGeminiWithModel(prompt, model, name);
      } catch (error: any) {
        lastError = error;
        console.log(`[FeesAgent] Model ${name} failed:`, error.message);

        if (i === modelsToTry.length - 1) {
          console.log(
            `[FeesAgent] All models failed. Last error:`,
            error.message,
          );
        } else {
          console.log(`[FeesAgent] Falling back to next model...`);
        }
      }
    }

    throw lastError || new Error("All models failed");
  }

  private async saveToDB(
    analysis: FeesAnalysis,
    preprocessed: PreprocessedFeesData,
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
        all_time_fees: preprocessed.all_time_fees,
        all_time_volume: preprocessed.all_time_volume,
        all_time_orders: preprocessed.all_time_orders,
      },
    });

    console.log(
      `[FeesAgent] ✓ Saved analysis to MongoDB (topic: ${this.topic})`,
    );
  }

  async run(): Promise<FeesAnalysis> {
    console.log(
      `\n[FeesAgent] ═══ Starting run at ${new Date().toISOString()} ═══`,
    );

    await connectMongo();

    console.log("[FeesAgent] Loading and preprocessing fees.json...");
    const preprocessed = this.preprocessor.process();

    console.log(
      `[FeesAgent] Preprocessed: ${preprocessed.total_entries} weekly entries, ` +
        `from ${preprocessed.data_from} to ${preprocessed.data_to}`,
    );
    console.log(`[FeesAgent] All-time fees: ${preprocessed.all_time_fees_fmt}`);
    console.log(
      `[FeesAgent] Annual runrate: $${(preprocessed.estimated_annual_fees_runrate / 1000000).toFixed(1)}M`,
    );

    console.log("[FeesAgent] Sending to Gemini for analysis...");
    const prompt = buildAnalysisPrompt(preprocessed);
    const analysis = await this.callGemini(prompt);

    console.log(`[FeesAgent] ✓ Analysis complete`);
    console.log(`[FeesAgent]   Summary: ${analysis.summary.slice(0, 120)}...`);
    console.log(`[FeesAgent]   Signals detected: ${analysis.signals.length}`);
    console.log(
      `[FeesAgent]   Tweet data points: ${analysis.tweet_data_points.length}`,
    );

    if (analysis.signals.length > 0) {
      console.log("[FeesAgent]   Signal list:");
      analysis.signals.forEach((s: FeesSignal) => {
        console.log(`[FeesAgent]     → [${s.type}] ${s.description}`);
      });
    }

    await this.saveToDB(analysis, preprocessed);

    return analysis;
  }
}

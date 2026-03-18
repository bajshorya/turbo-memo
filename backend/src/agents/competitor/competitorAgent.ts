// backend/src/agents/competitor/competitorAgent.ts

import {
  GoogleGenerativeAI,
  type GenerativeModel,
} from "@google/generative-ai";
import { connectMongo, AgentOutputModel } from "../../db/mongo.js";
import {
  CompetitorPreprocessor,
  type PreprocessedCompetitorData,
} from "./competitorPreprocessor.js";
import type {
  CompetitorAnalysis,
  CompetitorSignal,
} from "../../types/competitorTypes.js";

const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ── System prompt ─────────────────────────────────────────────────────────────

const COMPETITOR_SYSTEM_PROMPT = `
You are a senior DeFi competitive intelligence analyst for garden.finance — 
a leading Bitcoin-to-EVM cross-chain swap protocol. You specialize in comparing 
Garden's performance against competitors like Thorchain and analyzing broader 
market trends from CoinMarketCap data.

Your job is to analyze competitor data and extract insights that reveal Garden's 
position in the market, competitive advantages, and strategic opportunities.

ANALYSIS PRIORITIES — focus on these in order:

1. MARKET POSITIONING
   - How does Garden's volume compare to Thorchain?
   - Market share analysis — what percentage of the market does Garden control?
   - Is Garden gaining or losing ground?

2. GROWTH COMPARISON
   - Who's growing faster? Compare 7d and 30d growth rates
   - Are there inflection points where Garden accelerated past competitors?
   - What's driving the growth differential?

3. OPERATIONAL METRICS
   - Compare peak performance days
   - Volume consistency vs spikes
   - User adoption (if wallet data available)

4. MARKET CONTEXT
   - How does broader market (BTC price, market cap) correlate with Garden's performance?
   - Is Garden outperforming or underperforming relative to market conditions?
   - What does CoinMarketCap data tell us about the environment?

5. COMPETITIVE ADVANTAGES
   - Where does Garden clearly win?
   - Where do competitors have an edge?
   - What strategic insights can we derive?

6. STRATEGIC RECOMMENDATIONS
   - Based on competitive analysis, what should Garden focus on?
   - Which competitor strengths should be addressed?
   - What market opportunities are emerging?

SIGNAL DETECTION — flag any of these if present in the data:

- "market_leadership" — Garden has >50% market share or leads competitor by >2x
- "growth_advantage" — Garden growing >20% faster than competitor
- "momentum_shift" — Garden recently overtook competitor in cumulative volume
- "market_correlation" — Strong correlation between Garden volume and BTC price
- "outperformance" — Garden growing despite market downturn (BTC down)
- "peak_advantage" — Garden's peak day exceeds competitor's by >50%
- "consistency_edge" — Garden has more consistent daily volume (lower volatility)
- "competitive_threat" — Competitor gaining share rapidly (>10% in 30 days)

CONTENT RULES:
- Frame data objectively but highlight Garden's strengths
- Use exact numbers from the data
- Provide strategic context — not just numbers, but what they mean
- tweet_data_points must be compelling competitive facts for social media
- content_angles must be narrative hooks for marketing and investor relations

OUTPUT FORMAT:
Respond ONLY with a valid JSON object matching this exact shape. No markdown, no extra text.

{
  "summary": "3-4 sentence executive summary of Garden's competitive position",
  "highlights": [
    "bullet 1 — specific and numerical comparison",
    "bullet 2 — specific and numerical comparison",
    "bullet 3",
    "bullet 4",
    "bullet 5"
  ],
  "sentiment": "positive | neutral | negative",
  "signals": [
    {
      "type": "market_leadership | growth_advantage | momentum_shift | market_correlation | outperformance | peak_advantage | consistency_edge | competitive_threat",
      "description": "plain english description of the signal",
      "value": "the relevant number or comparison",
      "competitor": "Thorchain",
      "date": "YYYY-MM-DD if applicable"
    }
  ],
  "metrics": {
    "garden_total_volume": 0,
    "garden_total_volume_fmt": "",
    "competitor_total_volume": 0,
    "competitor_total_volume_fmt": "",
    "garden_market_share_pct": 0,
    "competitor_market_share_pct": 0,
    "volume_ratio_garden_to_competitor": 0,
    "garden_growth_30d_pct": 0,
    "competitor_growth_30d_pct": 0,
    "growth_differential_pct": 0,
    "garden_peak_volume": 0,
    "competitor_peak_volume": 0,
    "btc_price": 0,
    "btc_price_change_30d_pct": 0,
    "market_correlation_score": 0
  },
  "tweet_data_points": [
    "Garden.finance now handles [X]% of the cross-chain swap volume vs Thorchain's [Y]%",
    "Garden is growing [X]% faster than Thorchain over 30 days",
    "Peak day: Garden hit $X vs Thorchain's $Y — [insight about performance]",
    "Despite BTC [up/down] [X]%, Garden volume [increased/decreased] [Y]%",
    "Garden leads Thorchain by $X in total volume processed",
    "Market share shift: Garden gained [X]% share in the last 30 days"
  ],
  "content_angles": [
    "The race for cross-chain dominance: Garden vs Thorchain",
    "How Garden is winning the volume game in a [bull/bear] market",
    "Competitive analysis: Why Garden's growth outpaces Thorchain",
    "Market share story: Garden's path to [X]% of the cross-chain market",
    "BTC correlation: How market conditions affect Garden and competitors differently"
  ],
  "strategic_recommendations": [
    "recommendation 1 based on competitive analysis",
    "recommendation 2",
    "recommendation 3"
  ]
}
`.trim();

// ── Context message builder ───────────────────────────────────────────────────

function buildAnalysisPrompt(data: PreprocessedCompetitorData): string {
  // Comparisons table
  const comparisonsTable = data.comparisons
    .map(
      (c, idx) =>
        `  ${c.metric.padEnd(25)} | Garden: ${c.garden_formatted.padEnd(15)} | ` +
        `Thorchain: ${c.competitor_formatted.padEnd(15)} | ` +
        `Diff: ${c.difference_pct > 0 ? "+" : ""}${c.difference_pct}% | ` +
        `Advantage: ${c.advantage}`,
    )
    .join("\n");

  // Advantages lists
  const gardenAdvantagesList =
    data.garden_advantages.length > 0
      ? data.garden_advantages.map((a) => `  ✓ ${a}`).join("\n")
      : "  None identified";

  const competitorAdvantagesList =
    data.competitor_advantages.length > 0
      ? data.competitor_advantages.map((a) => `  ⚠ ${a}`).join("\n")
      : "  None identified";

  // Key insights
  const insightsList = data.key_insights.map((i) => `  • ${i}`).join("\n");

  // Time series summary
  const timeSeriesSummary =
    data.time_series.length > 0
      ? `Last ${data.time_series.length} days: Garden ${data.time_series.filter((t) => t.garden_leading).length} days leading`
      : "No time series data available";

  return `
Analyze the following competitive intelligence data comparing garden.finance with Thorchain and broader market context from CoinMarketCap.

═══════════════════════════════════════
DATA SOURCES
═══════════════════════════════════════
${data.data_sources.join(", ")}

═══════════════════════════════════════
GARDEN METRICS
═══════════════════════════════════════
Total Volume:        ${data.garden.volume_fmt}
Total Orders:        ${data.garden.total_orders.toLocaleString()}
Unique Wallets:      ${data.garden.total_wallets.toLocaleString()}
Avg Daily Volume:    ${formatUSDShort(data.garden.avg_daily_volume)}
Peak Day:            ${data.garden.peak_day} (${formatUSDShort(data.garden.peak_daily_volume)})
30-Day Growth:       ${data.garden.growth_30d_pct !== null ? data.garden.growth_30d_pct + "%" : "N/A"}
7-Day Growth:        ${data.garden.growth_7d_pct !== null ? data.garden.growth_7d_pct + "%" : "N/A"}

═══════════════════════════════════════
THORCHAIN METRICS
═══════════════════════════════════════
Total Volume:        ${data.thorchain.volume_fmt}
Avg Daily Volume:    ${formatUSDShort(data.thorchain.avg_daily_volume)}
Peak Day:            ${data.thorchain.peak_day} (${formatUSDShort(data.thorchain.peak_daily_volume)})
30-Day Growth:       ${data.thorchain.growth_30d_pct !== null ? data.thorchain.growth_30d_pct + "%" : "N/A"}
7-Day Growth:        ${data.thorchain.growth_7d_pct !== null ? data.thorchain.growth_7d_pct + "%" : "N/A"}

═══════════════════════════════════════
COINMARKETCAP MARKET CONTEXT
═══════════════════════════════════════
BTC Price:           $${data.coinmarketcap.current_price?.toLocaleString() || "N/A"}
24h Change:          ${data.coinmarketcap.price_change_24h_pct !== undefined ? data.coinmarketcap.price_change_24h_pct + "%" : "N/A"}
7d Change:           ${data.coinmarketcap.price_change_7d_pct !== undefined ? data.coinmarketcap.price_change_7d_pct + "%" : "N/A"}
30d Change:          ${data.coinmarketcap.price_change_30d_pct !== undefined ? data.coinmarketcap.price_change_30d_pct + "%" : "N/A"}
Market Cap:          $${data.coinmarketcap.market_cap?.toLocaleString() || "N/A"}
24h Volume:          $${data.coinmarketcap.volume_24h?.toLocaleString() || "N/A"}

═══════════════════════════════════════
MARKET SHARE
═══════════════════════════════════════
Total Market Volume: $${(data.market_share.total_market_volume / 1000000).toFixed(2)}M
Garden Share:        ${data.market_share.garden_share_pct}%
Thorchain Share:     ${data.market_share.thorchain_share_pct}%
Ratio (Garden:Thorchain): ${(data.market_share.garden_share_pct / data.market_share.thorchain_share_pct).toFixed(2)}:1

═══════════════════════════════════════
HEAD-TO-HEAD COMPARISONS
═══════════════════════════════════════
${comparisonsTable}

═══════════════════════════════════════
COMPETITIVE ADVANTAGES
═══════════════════════════════════════
GARDEN ADVANTAGES:
${gardenAdvantagesList}

THORCHAIN ADVANTAGES:
${competitorAdvantagesList}

═══════════════════════════════════════
KEY INSIGHTS
═══════════════════════════════════════
${insightsList}

═══════════════════════════════════════
TREND SUMMARY
═══════════════════════════════════════
${timeSeriesSummary}

Based on all of the above, generate the full analysis JSON as instructed.
Focus on competitive positioning, growth dynamics, and strategic implications for garden.finance.
  `.trim();
}

// ── Main agent class with model fallback ──────────────────────────────────────

export class CompetitorAgent {
  public readonly name = "CompetitorAgent";
  public readonly topic = "competitor_analysis";

  private preprocessor: CompetitorPreprocessor;
  private model: GenerativeModel;
  private fallbackModels: string[] = [
    "gemini-2.0-flash",
    "gemini-1.5-pro",
    "gemini-1.5-flash",
  ];

  constructor(
    gardenFileName = "garden_volume.json",
    thorchainFileName = "thorchain.json",
    coinmarketcapFileName = "coinmarketcap.json",
  ) {
    this.preprocessor = new CompetitorPreprocessor(
      gardenFileName,
      thorchainFileName,
      coinmarketcapFileName,
    );
    this.model = this.createModel("gemini-2.5-flash");
  }

  private createModel(modelName: string): GenerativeModel {
    console.log(`[CompetitorAgent] Initializing model: ${modelName}`);
    return client.getGenerativeModel({
      model: modelName,
      systemInstruction: COMPETITOR_SYSTEM_PROMPT,
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
  ): Promise<CompetitorAnalysis> {
    const maxRetries = 3;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();

      console.log(
        `[CompetitorAgent] Raw response length (${modelName}):`,
        text.length,
      );

      try {
        return JSON.parse(text) as CompetitorAnalysis;
      } catch (error) {
        console.error(
          `[CompetitorAgent] Failed to parse JSON response from ${modelName}:`,
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
          `[CompetitorAgent] ${error.status === 429 ? "Rate limited" : "Service unavailable"}. Retrying in ${waitTime / 1000} seconds... (attempt ${retryCount + 1}/${maxRetries})`,
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

  private async callGemini(prompt: string): Promise<CompetitorAnalysis> {
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
          `[CompetitorAgent] Trying model: ${name}${i > 0 ? " (fallback)" : ""}`,
        );
        return await this.callGeminiWithModel(prompt, model, name);
      } catch (error: any) {
        lastError = error;
        console.log(`[CompetitorAgent] Model ${name} failed:`, error.message);

        if (i === modelsToTry.length - 1) {
          console.log(
            `[CompetitorAgent] All models failed. Last error:`,
            error.message,
          );
        } else {
          console.log(`[CompetitorAgent] Falling back to next model...`);
        }
      }
    }

    throw lastError || new Error("All models failed");
  }

  private async saveToDB(
    analysis: CompetitorAnalysis,
    preprocessed: PreprocessedCompetitorData,
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
      strategic_recommendations: analysis.strategic_recommendations,
      raw_summary: {
        garden_volume: preprocessed.garden.total_volume,
        thorchain_volume: preprocessed.thorchain.total_volume,
        garden_market_share: preprocessed.market_share.garden_share_pct,
        data_sources: preprocessed.data_sources,
      },
    });

    console.log(
      `[CompetitorAgent] ✓ Saved analysis to MongoDB (topic: ${this.topic})`,
    );
  }

  async run(): Promise<CompetitorAnalysis> {
    console.log(
      `\n[CompetitorAgent] ═══ Starting run at ${new Date().toISOString()} ═══`,
    );

    await connectMongo();

    console.log(
      "[CompetitorAgent] Loading and preprocessing competitor data...",
    );
    const preprocessed = this.preprocessor.process();

    console.log(
      `[CompetitorAgent] Preprocessed: ${preprocessed.data_sources.length} data sources`,
    );
    console.log(
      `[CompetitorAgent] Garden volume: ${preprocessed.garden.volume_fmt}`,
    );

    if (preprocessed.thorchain.data_available) {
      console.log(
        `[CompetitorAgent] Thorchain volume: ${preprocessed.thorchain.volume_fmt}`,
      );
      console.log(
        `[CompetitorAgent] Garden market share: ${preprocessed.market_share.garden_share_pct}%`,
      );
    }

    if (preprocessed.coinmarketcap.data_available) {
      console.log(
        `[CompetitorAgent] BTC price: $${preprocessed.coinmarketcap.current_price?.toLocaleString() || "N/A"}`,
      );
    }

    console.log("[CompetitorAgent] Sending to Gemini for analysis...");
    const prompt = buildAnalysisPrompt(preprocessed);
    const analysis = await this.callGemini(prompt);

    console.log(`[CompetitorAgent] ✓ Analysis complete`);
    console.log(
      `[CompetitorAgent]   Summary: ${analysis.summary.slice(0, 120)}...`,
    );
    console.log(
      `[CompetitorAgent]   Signals detected: ${analysis.signals.length}`,
    );
    console.log(
      `[CompetitorAgent]   Tweet data points: ${analysis.tweet_data_points.length}`,
    );

    if (analysis.signals.length > 0) {
      console.log("[CompetitorAgent]   Signal list:");
      analysis.signals.forEach((s: CompetitorSignal) => {
        console.log(`[CompetitorAgent]     → [${s.type}] ${s.description}`);
      });
    }

    await this.saveToDB(analysis, preprocessed);

    return analysis;
  }
}
function formatUSDShort(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
}

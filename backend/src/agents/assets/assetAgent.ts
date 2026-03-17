// backend/src/agents/assets/assetAgent.ts

import {
  GoogleGenerativeAI,
  type GenerativeModel,
} from "@google/generative-ai";
import { connectMongo, AgentOutputModel } from "../../db/mongo.js";
import {
  AssetPreprocessor,
  type PreprocessedAssetData,
} from "./assetPreprocessor.js";
import type { AssetAnalysis, AssetSignal } from "../../types/assetTypes.js";

const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ── System prompt ─────────────────────────────────────────────────────────────

const ASSET_SYSTEM_PROMPT = `
You are a senior DeFi analytics expert and asset strategist for garden.finance — 
a leading Bitcoin-to-EVM cross-chain swap protocol. You specialize in asset-level 
analysis, understanding which tokens drive the most volume, which assets users 
prefer for source vs destination, and what this reveals about market demand.

Your job is to analyze asset-level swap data and extract insights about token 
preferences, flow patterns, and market composition that matter for product roadmap, 
liquidity provisioning, and marketing strategy.

ANALYSIS PRIORITIES — focus on these in order:

1. ASSET DOMINANCE
   - Which assets dominate the volume mix? (e.g., BTC represents X% of all volume)
   - Why do these assets matter for garden.finance's positioning?

2. FLOW PATTERNS
   - Source vs destination analysis — which assets are primarily used as inputs vs outputs?
   - What does this reveal about user intent? (e.g., bridging BTC to use on other chains)
   - Identify assets that are net sources (more outgoing) vs net destinations (more incoming)

3. USER ADOPTION METRICS
   - Which assets have the most unique wallets?
   - Which assets have the highest order frequency?
   - Correlation between wallets, orders, and volume

4. ASSET CONCENTRATION
   - How concentrated is volume among top assets?
   - Is the ecosystem diversifying across many assets?
   - What's the diversity index and what does it suggest?

5. NOTEWORTHY ASSETS
   - Emerging assets with growing volume
   - Niche assets with high wallet-to-order ratios (loyal users)
   - Assets with unusual source/destination patterns

6. STRATEGIC INSIGHTS
   - What assets should garden.finance prioritize for liquidity?
   - Which assets indicate cross-chain demand?
   - What does asset mix say about user demographics?

SIGNAL DETECTION — flag any of these if present in the data:

- "asset_dominance" — top asset has >50% of total volume
- "balanced_flow" — asset with roughly equal source/destination volume (neutral)
- "source_heavy" — asset primarily used as source (outgoing)
- "destination_heavy" — asset primarily used as destination (incoming)
- "high_adoption" — asset with high unique wallets relative to volume
- "whale_asset" — asset with high avg order size (>$10K)
- "retail_asset" — asset with low avg order size (<$100)
- "diverse_ecosystem" — diversity index >0.8
- "concentrated_ecosystem" — top 3 assets >80% of volume

CONTENT RULES:
- Frame data positively — emphasize adoption, growth, and ecosystem health
- Use exact numbers from the data
- Compare assets to show trends and preferences
- tweet_data_points must be standalone facts for social media
- content_angles must be narrative hooks for marketing

OUTPUT FORMAT:
Respond ONLY with a valid JSON object matching this exact shape. No markdown, no extra text.

{
  "summary": "3-4 sentence executive summary of the most important asset insights",
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
      "type": "asset_dominance | balanced_flow | source_heavy | destination_heavy | high_adoption | whale_asset | retail_asset | diverse_ecosystem | concentrated_ecosystem",
      "description": "plain english description of the signal",
      "value": "the relevant number or asset name",
      "asset": "asset name if applicable"
    }
  ],
  "metrics": {
    "total_volume_all_time": 0,
    "total_orders_all_time": 0,
    "total_unique_wallets": 0,
    "total_assets": 0,
    "avg_order_size_usd": 0,
    "dominant_asset_name": "",
    "dominant_asset_volume_share_pct": 0,
    "top3_assets_concentration_pct": 0,
    "top5_assets_concentration_pct": 0,
    "diversity_index": 0,
    "source_volume_pct": 0,
    "destination_volume_pct": 0,
    "most_active_asset_by_wallets": "",
    "most_active_asset_wallet_count": 0,
    "highest_order_asset": "",
    "highest_order_count": 0
  },
  "tweet_data_points": [
    "garden.finance's top asset by volume is [ASSET] at $X ([X]% of total)",
    "[ASSET] sees the most unique wallets ([X] wallets) — a sign of strong retail adoption",
    "Average order size across all assets is $X, with [ASSET] leading at $X per order",
    "Source vs destination: [X]% of volume is source, [Y]% is destination — revealing user intent",
    "The garden.finance ecosystem spans [X] distinct assets with a diversity index of [X]",
    "[ASSET] is primarily used as a [source/destination], indicating [insight about user behavior]"
  ],
  "content_angles": [
    "Asset dominance: why [ASSET] leads garden.finance's volume and what it means",
    "The cross-chain playbook: how asset flows reveal user intent",
    "From BTC to SOL: mapping garden.finance's multi-chain asset ecosystem",
    "Retail vs whales: asset-level analysis of garden.finance user behavior",
    "The rise of [EMERGING_ASSET]: a new contender in cross-chain swaps"
  ]
}
`.trim();

// ── Context message builder ───────────────────────────────────────────────────

function buildAnalysisPrompt(data: PreprocessedAssetData): string {
  // Top assets table
  const topAssetsTable = data.asset_stats
    .slice(0, 10)
    .map(
      (a, idx) =>
        `  ${String(idx + 1).padStart(2)}. ${a.name.padEnd(30)} | ` +
        `vol=$${(a.total_volume / 1000).toFixed(0)}K | ` +
        `share=${a.volume_share_pct}% | ` +
        `wallets=${a.unique_wallets} | ` +
        `orders=${a.total_orders} | ` +
        `avg=$${a.avg_order_size.toFixed(0)} | ` +
        `S/D=${a.source_destination_ratio.toFixed(2)}`,
    )
    .join("\n");

  // Source-heavy assets
  const sourceHeavyTable = data.primary_source_assets
    .slice(0, 5)
    .map(
      (a) =>
        `  ${a.name.padEnd(30)} | source=$${(a.source_volume / 1000).toFixed(0)}K | ` +
        `dest=$${(a.destination_volume / 1000).toFixed(0)}K | ratio=${a.source_destination_ratio.toFixed(2)}`,
    )
    .join("\n");

  // Destination-heavy assets
  const destHeavyTable = data.primary_destination_assets
    .slice(0, 5)
    .map(
      (a) =>
        `  ${a.name.padEnd(30)} | dest=$${(a.destination_volume / 1000).toFixed(0)}K | ` +
        `source=$${(a.source_volume / 1000).toFixed(0)}K | ratio=${a.source_destination_ratio.toFixed(2)}`,
    )
    .join("\n");

  return `
Analyze the following pre-processed garden.finance asset-level swap data.
This data represents all-time totals across ${data.total_assets} distinct assets.

═══════════════════════════════════════
ALL-TIME TOTALS
═══════════════════════════════════════
Total Volume:        ${data.all_time_volume_fmt}
Total Orders:        ${data.all_time_orders.toLocaleString()}
Unique Wallets:      ${data.all_time_unique_wallets.toLocaleString()}
Total Assets:        ${data.total_assets}
Avg Order Size:      $${data.avg_order_size_all.toFixed(2)}
Diversity Index:     ${data.diversity_index.toFixed(2)} (0=concentrated, 1=diverse)

═══════════════════════════════════════
FLOW METRICS
═══════════════════════════════════════
Source Volume:       ${data.total_source_flow_pct}% of total
Destination Volume:  ${data.total_destination_flow_pct}% of total

═══════════════════════════════════════
CONCENTRATION
═══════════════════════════════════════
Top 1 Asset:         ${data.concentration_ratio.top1_pct}%
Top 3 Assets:        ${data.concentration_ratio.top3_pct}%
Top 5 Assets:        ${data.concentration_ratio.top5_pct}%

═══════════════════════════════════════
TOP ASSETS BY VOLUME
═══════════════════════════════════════
${topAssetsTable}

═══════════════════════════════════════
PRIMARY SOURCE ASSETS (more outgoing)
═══════════════════════════════════════
${sourceHeavyTable || "  None"}

═══════════════════════════════════════
PRIMARY DESTINATION ASSETS (more incoming)
═══════════════════════════════════════
${destHeavyTable || "  None"}

═══════════════════════════════════════
TOP PERFORMERS
═══════════════════════════════════════
Most Volume:         ${data.top_asset_by_volume.name} ($${data.top_asset_by_volume.total_volume.toFixed(0)})
Most Orders:         ${data.top_asset_by_orders.name} (${data.top_asset_by_orders.total_orders} orders)
Most Wallets:        ${data.top_asset_by_wallets.name} (${data.top_asset_by_wallets.unique_wallets} wallets)

═══════════════════════════════════════
ASSET SPOTLIGHT
═══════════════════════════════════════
Highest Avg Order:   ${data.asset_stats.sort((a, b) => b.avg_order_size - a.avg_order_size)[0]?.name} ($${data.asset_stats.sort((a, b) => b.avg_order_size - a.avg_order_size)[0]?.avg_order_size.toFixed(0)})
Lowest Avg Order:    ${data.asset_stats.sort((a, b) => a.avg_order_size - b.avg_order_size)[0]?.name} ($${data.asset_stats.sort((a, b) => a.avg_order_size - b.avg_order_size)[0]?.avg_order_size.toFixed(0)})
Best Wallet/Order:   ${data.asset_stats.sort((a, b) => b.wallets_per_order - a.wallets_per_order)[0]?.name} (${data.asset_stats.sort((a, b) => b.wallets_per_order - a.wallets_per_order)[0]?.wallets_per_order.toFixed(2)} wallets/order)

Based on all of the above, generate the full analysis JSON as instructed.
Focus on asset dominance, flow patterns, user adoption metrics, and strategic insights.
  `.trim();
}

// ── Main agent class with model fallback ──────────────────────────────────────

export class AssetAgent {
  public readonly name = "AssetAgent";
  public readonly topic = "asset_analysis";

  private preprocessor: AssetPreprocessor;
  private model: GenerativeModel;
  private fallbackModels: string[] = [
    "gemini-2.0-flash",
    "gemini-1.5-pro",
    "gemini-1.5-flash",
  ];

  constructor(dataFileName = "assets.json") {
    this.preprocessor = new AssetPreprocessor(dataFileName);
    this.model = this.createModel("gemini-2.5-flash");
  }

  private createModel(modelName: string): GenerativeModel {
    console.log(`[AssetAgent] Initializing model: ${modelName}`);
    return client.getGenerativeModel({
      model: modelName,
      systemInstruction: ASSET_SYSTEM_PROMPT,
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
  ): Promise<AssetAnalysis> {
    const maxRetries = 3;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();

      console.log(
        `[AssetAgent] Raw response length (${modelName}):`,
        text.length,
      );

      try {
        return JSON.parse(text) as AssetAnalysis;
      } catch (error) {
        console.error(
          `[AssetAgent] Failed to parse JSON response from ${modelName}:`,
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
          `[AssetAgent] ${error.status === 429 ? "Rate limited" : "Service unavailable"}. Retrying in ${waitTime / 1000} seconds... (attempt ${retryCount + 1}/${maxRetries})`,
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

  private async callGemini(prompt: string): Promise<AssetAnalysis> {
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
          `[AssetAgent] Trying model: ${name}${i > 0 ? " (fallback)" : ""}`,
        );
        return await this.callGeminiWithModel(prompt, model, name);
      } catch (error: any) {
        lastError = error;
        console.log(`[AssetAgent] Model ${name} failed:`, error.message);

        if (i === modelsToTry.length - 1) {
          console.log(
            `[AssetAgent] All models failed. Last error:`,
            error.message,
          );
        } else {
          console.log(`[AssetAgent] Falling back to next model...`);
        }
      }
    }

    throw lastError || new Error("All models failed");
  }

  private async saveToDB(
    analysis: AssetAnalysis,
    preprocessed: PreprocessedAssetData,
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
        unique_assets: preprocessed.total_assets,
        all_time_volume: preprocessed.all_time_volume,
        all_time_orders: preprocessed.all_time_orders,
        all_time_unique_wallets: preprocessed.all_time_unique_wallets,
        diversity_index: preprocessed.diversity_index,
      },
    });

    console.log(
      `[AssetAgent] ✓ Saved analysis to MongoDB (topic: ${this.topic})`,
    );
  }

  async run(): Promise<AssetAnalysis> {
    console.log(
      `\n[AssetAgent] ═══ Starting run at ${new Date().toISOString()} ═══`,
    );

    await connectMongo();

    console.log("[AssetAgent] Loading and preprocessing assets.json...");
    const preprocessed = this.preprocessor.process();

    console.log(
      `[AssetAgent] Preprocessed: ${preprocessed.total_assets} assets, ` +
        `${preprocessed.all_time_orders} orders, ` +
        `${preprocessed.all_time_unique_wallets} unique wallets`,
    );
    console.log(
      `[AssetAgent] All-time volume: ${preprocessed.all_time_volume_fmt}`,
    );
    console.log(
      `[AssetAgent] Top asset: ${preprocessed.top_asset_by_volume.name} (${preprocessed.top_asset_by_volume.volume_share_pct}% of volume)`,
    );
    console.log(
      `[AssetAgent] Diversity index: ${preprocessed.diversity_index.toFixed(2)}`,
    );

    console.log("[AssetAgent] Sending to Gemini for analysis...");
    const prompt = buildAnalysisPrompt(preprocessed);
    const analysis = await this.callGemini(prompt);

    console.log(`[AssetAgent] ✓ Analysis complete`);
    console.log(`[AssetAgent]   Summary: ${analysis.summary.slice(0, 120)}...`);
    console.log(`[AssetAgent]   Signals detected: ${analysis.signals.length}`);
    console.log(
      `[AssetAgent]   Tweet data points: ${analysis.tweet_data_points.length}`,
    );

    if (analysis.signals.length > 0) {
      console.log("[AssetAgent]   Signal list:");
      analysis.signals.forEach((s: AssetSignal) => {
        console.log(`[AssetAgent]     → [${s.type}] ${s.description}`);
      });
    }

    await this.saveToDB(analysis, preprocessed);

    return analysis;
  }
}

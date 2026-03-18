// backend/src/agents/superAgent.ts

import {
  GoogleGenerativeAI,
  type GenerativeModel,
} from "@google/generative-ai";
import { connectMongo, AgentOutputModel } from "../db/mongo.js";
import { CompetitorAgent } from "./competitor/competitorAgent.js";
import type { CompetitorAnalysis } from "../types/competitorTypes.js";

const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ── Types ──────────────────────────────────────────────────────────────────

export interface SuperAgentTweet {
  id: string;
  content: string;
  thread_position?: number;
  metrics?: {
    estimated_engagement: "high" | "medium" | "low";
    best_time_to_post?: string;
    target_audience: string[];
  };
}

export interface SuperAgentTweetThread {
  title: string;
  tweets: SuperAgentTweet[];
  total_tweets: number;
  estimated_read_time_minutes: number;
}

export interface SuperAgentAnalysis {
  summary: string;
  key_narratives: {
    title: string;
    description: string;
    supporting_data: string[];
    priority: "high" | "medium" | "low";
  }[];
  weekly_themes: {
    theme: string;
    rationale: string;
    suggested_tweet_count: number;
  }[];
  standalone_tweets: SuperAgentTweet[];
  tweet_threads: SuperAgentTweetThread[];
  content_calendar: {
    day: string;
    focus: string;
    suggested_tweet_ids: string[];
  }[];
  predicted_performance: {
    best_performing_tweet: string;
    most_controversial_topic?: string;
    most_educational_content: string;
  };
  metrics_summary: {
    garden_volume: string;
    competitor_volume: string;
    garden_market_share_pct: number;
    market_position: string;
    growth_story: string;
  };
  raw_tweet_count: number;
  raw_thread_count: number;
}

// ── System prompt ─────────────────────────────────────────────────────────────

const SUPER_AGENT_SYSTEM_PROMPT = `
You are the Chief Content Strategist for garden.finance — a leading Bitcoin-to-EVM 
cross-chain swap protocol. You receive competitive intelligence data comparing 
Garden's performance against Thorchain and broader market context.

Your job is to turn this data into a compelling content strategy: tweets, threads, 
narratives, and a weekly content calendar.

TWEET GENERATION RULES:
- Each tweet must be under 280 characters (hard limit)
- Include relevant emojis (1-3 per tweet max)
- Use exact numbers from the data
- Frame positively but credibly
- Include a clear call-to-action or takeaway where relevant

THREAD STRUCTURE:
- Tweet 1: Hook with the most compelling fact
- Tweets 2-4: Supporting data and context
- Tweets 5-6: Deeper insight and implications
- Tweet 7: Call to action or forward-looking close

Generate 10-15 standalone tweets and 2-4 threads of 3-7 tweets each.

OUTPUT FORMAT:
Respond ONLY with a valid JSON object matching this exact shape. No markdown, no extra text.

{
  "summary": "2-3 sentence overview of Garden's competitive position and content opportunity",
  "key_narratives": [
    {
      "title": "Narrative title",
      "description": "What this narrative is and why it matters",
      "supporting_data": ["data point 1", "data point 2"],
      "priority": "high | medium | low"
    }
  ],
  "weekly_themes": [
    {
      "theme": "Theme for the week",
      "rationale": "Why this theme matters now",
      "suggested_tweet_count": 5
    }
  ],
  "standalone_tweets": [
    {
      "id": "unique-id-1",
      "content": "Tweet content here under 280 chars",
      "metrics": {
        "estimated_engagement": "high | medium | low",
        "best_time_to_post": "9am EST",
        "target_audience": ["traders", "developers", "investors", "community"]
      }
    }
  ],
  "tweet_threads": [
    {
      "title": "Thread title",
      "tweets": [
        {
          "id": "thread-1-tweet-1",
          "content": "First tweet in thread...",
          "thread_position": 1,
          "metrics": {
            "estimated_engagement": "high",
            "target_audience": ["traders"]
          }
        }
      ],
      "total_tweets": 5,
      "estimated_read_time_minutes": 3
    }
  ],
  "content_calendar": [
    {
      "day": "Monday",
      "focus": "Competitive positioning",
      "suggested_tweet_ids": ["unique-id-1"]
    }
  ],
  "predicted_performance": {
    "best_performing_tweet": "ID of predicted best tweet",
    "most_controversial_topic": "Topic that might spark debate",
    "most_educational_content": "ID of most educational content"
  },
  "metrics_summary": {
    "garden_volume": "$Xm",
    "competitor_volume": "$Xm",
    "garden_market_share_pct": 0,
    "market_position": "Leading | Competitive | Emerging",
    "growth_story": "One sentence on growth narrative"
  },
  "raw_tweet_count": 0,
  "raw_thread_count": 0
}
`.trim();

// ── Prompt builder ────────────────────────────────────────────────────────────

function buildSuperAgentPrompt(competitor: CompetitorAnalysis): string {
  return `
SUPER AGENT ANALYSIS — COMPETITOR INTELLIGENCE DATA FOR GARDEN.FINANCE
Generated at: ${new Date().toISOString()}

═══════════════════════════════════════
COMPETITOR AGENT SUMMARY
═══════════════════════════════════════
${competitor.summary}

HIGHLIGHTS:
${competitor.highlights.map((h) => `  • ${h}`).join("\n")}

KEY METRICS:
  Garden Market Share:          ${competitor.metrics.garden_market_share_pct}%
  Competitor Market Share:      ${competitor.metrics.competitor_market_share_pct}%
  Volume Ratio (Garden:TC):     ${competitor.metrics.volume_ratio_garden_to_competitor.toFixed(2)}:1
  Garden Total Volume:          ${competitor.metrics.garden_total_volume_fmt}
  Competitor Total Volume:      ${competitor.metrics.competitor_total_volume_fmt}
  Garden 30d Growth:            ${competitor.metrics.garden_growth_30d_pct}%
  Competitor 30d Growth:        ${competitor.metrics.competitor_growth_30d_pct}%
  Growth Differential:          ${competitor.metrics.growth_differential_pct > 0 ? "+" : ""}${competitor.metrics.growth_differential_pct}%
  BTC Price:                    $${competitor.metrics.btc_price.toLocaleString()} (${competitor.metrics.btc_price_change_30d_pct > 0 ? "+" : ""}${competitor.metrics.btc_price_change_30d_pct}% 30d)

TWEET DATA POINTS:
${competitor.tweet_data_points.map((t) => `  • ${t}`).join("\n")}

CONTENT ANGLES:
${competitor.content_angles.map((a) => `  • ${a}`).join("\n")}

STRATEGIC RECOMMENDATIONS:
${competitor.strategic_recommendations.map((r) => `  • ${r}`).join("\n")}

SIGNALS DETECTED (${competitor.signals.length}):
${competitor.signals.map((s) => `  • [${s.type}] ${s.description} — ${s.value}`).join("\n")}

═══════════════════════════════════════
INSTRUCTIONS
═══════════════════════════════════════
Using the above competitive intelligence, generate a full content strategy:
1. Identify 3-5 key narratives from this data
2. Create weekly themes tied to Garden's competitive position
3. Generate 10-15 standalone tweets (each under 280 chars)
4. Create 2-4 tweet threads (3-7 tweets each) telling deeper stories
5. Suggest a content calendar spreading content across the week
6. Predict performance based on crypto Twitter patterns
  `.trim();
}

// ── Main Super Agent class ────────────────────────────────────────────────────

export class SuperAgent {
  public readonly name = "SuperAgent";
  public readonly topic = "super_analysis";

  private model: GenerativeModel;
  private fallbackModels: string[] = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
  ];

  private competitorAgent: CompetitorAgent;

  constructor() {
    this.competitorAgent = new CompetitorAgent(
      "garden_volume.json",
      "thorchain.json",
      "coinmarketcap.json",
    );
    this.model = this.createModel("gemini-2.5-flash");
  }

  private createModel(modelName: string): GenerativeModel {
    console.log(`[SuperAgent] Initializing model: ${modelName}`);
    return client.getGenerativeModel({
      model: modelName,
      systemInstruction: SUPER_AGENT_SYSTEM_PROMPT,
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 16384,
        temperature: 0.3,
      },
    });
  }

  private async callGeminiWithModel(
    prompt: string,
    model: GenerativeModel,
    modelName: string,
    retryCount = 0,
  ): Promise<SuperAgentAnalysis> {
    const maxRetries = 3;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      console.log(
        `[SuperAgent] Raw response length (${modelName}):`,
        text.length,
      );

      try {
        return JSON.parse(text) as SuperAgentAnalysis;
      } catch (error) {
        console.error(
          `[SuperAgent] Failed to parse JSON from ${modelName}:`,
          error,
        );
        console.error(
          `[SuperAgent] Response preview: ${text.slice(0, 500)}...`,
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
        const retryInfo = error.errorDetails?.find(
          (d: any) => d["@type"] === "type.googleapis.com/google.rpc.RetryInfo",
        );
        const retryDelaySec = retryInfo?.retryDelay
          ? parseInt(retryInfo.retryDelay.replace("s", ""), 10)
          : Math.pow(2, retryCount) * 3;

        const waitMs = (retryDelaySec + 1) * 1000;
        console.log(
          `[SuperAgent] ${error.status === 429 ? "Rate limited" : "Service unavailable"}. ` +
            `Waiting ${retryDelaySec}s... (attempt ${retryCount + 1}/${maxRetries})`,
        );
        await new Promise((resolve) => setTimeout(resolve, waitMs));
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

  private async callGemini(prompt: string): Promise<SuperAgentAnalysis> {
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
          `[SuperAgent] Trying model: ${name}${i > 0 ? " (fallback)" : ""}`,
        );
        return await this.callGeminiWithModel(prompt, model, name);
      } catch (error: any) {
        lastError = error;
        console.log(`[SuperAgent] Model ${name} failed:`, error.message);
        if (i < modelsToTry.length - 1) {
          console.log(`[SuperAgent] Falling back to next model...`);
        }
      }
    }

    throw lastError || new Error("All models failed");
  }

  private async saveToDB(analysis: SuperAgentAnalysis): Promise<void> {
    await AgentOutputModel.create({
      agent: this.name,
      topic: this.topic,
      analyzed_at: new Date(),
      data_from: new Date().toISOString().split("T")[0],
      data_to: new Date().toISOString().split("T")[0],
      summary: analysis.summary,
      highlights: analysis.key_narratives.map((n) => n.title),
      sentiment: "positive",
      signals: [],
      metrics: {
        total_tweets_generated: analysis.raw_tweet_count,
        total_threads_generated: analysis.raw_thread_count,
        ...analysis.metrics_summary,
      },
      tweet_data_points: analysis.standalone_tweets.map((t) => t.content),
      content_angles: analysis.key_narratives.map((n) => n.title),
      raw_summary: {
        generated_at: new Date().toISOString(),
        tweet_count: analysis.raw_tweet_count,
        thread_count: analysis.raw_thread_count,
      },
    });

    console.log(
      `[SuperAgent] ✓ Saved analysis to MongoDB (topic: ${this.topic})`,
    );
  }

  async run(): Promise<SuperAgentAnalysis> {
    console.log("\n" + "═".repeat(60));
    console.log("🏆 SUPER AGENT — MASTER CONTENT STRATEGIST 🏆");
    console.log("═".repeat(60));
    console.log(`Started at: ${new Date().toISOString()}`);
    console.log("═".repeat(60) + "\n");

    await connectMongo();

    console.log(`[SuperAgent] ▶ Running Competitor Agent...`);
    const competitorData = await this.competitorAgent.run();
    console.log(`[SuperAgent] ✓ Competitor Agent completed`);

    console.log(`\n[SuperAgent] Building analysis prompt...`);
    const prompt = buildSuperAgentPrompt(competitorData);
    console.log(`[SuperAgent] Prompt length: ${prompt.length} characters`);

    console.log(`\n[SuperAgent] Sending to Gemini for super analysis...`);
    const analysis = await this.callGemini(prompt);

    console.log(`\n[SuperAgent] ✓ Super analysis complete`);
    console.log(
      `[SuperAgent] Key narratives: ${analysis.key_narratives.length}`,
    );
    console.log(
      `[SuperAgent] Standalone tweets: ${analysis.standalone_tweets.length}`,
    );
    console.log(`[SuperAgent] Tweet threads: ${analysis.tweet_threads.length}`);

    if (analysis.standalone_tweets.length > 0) {
      console.log(`\n[SuperAgent] Sample tweets:`);
      analysis.standalone_tweets.slice(0, 3).forEach((t, i) => {
        console.log(`  ${i + 1}. ${t.content}`);
      });
    }

    await this.saveToDB(analysis);

    console.log("\n" + "═".repeat(60));
    console.log("🏆 SUPER AGENT COMPLETED SUCCESSFULLY 🏆");
    console.log("═".repeat(60) + "\n");

    return analysis;
  }
}

// ── Standalone execution ─────────────────────────────────────────────────────

if (import.meta.url === `file://${process.argv[1]}`) {
  import("dotenv/config").then(async () => {
    const agent = new SuperAgent();
    try {
      await agent.run();
      process.exit(0);
    } catch (err) {
      console.error("\n❌ Super Agent failed:", err);
      process.exit(1);
    }
  });
}

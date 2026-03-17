// src/baseAgent.ts

import Anthropic from "@anthropic-ai/sdk";
import { saveAgentOutput } from "./memoryStore.js";
import type { AgentOutput } from "./types.js";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// What Claude must return for every sub-agent run
interface AgentAnalysis {
  summary: string;
  highlights: string[];
  sentiment: "positive" | "neutral";
  metrics: Record<string, number | string>;
}

/**
 * BaseAgent<T> — generic over the shape of data each agent fetches.
 * Every concrete agent extends this and implements fetchData().
 */
export abstract class BaseAgent<T extends object> {
  constructor(
    public readonly name: string,
    public readonly topic: string,
    private readonly systemPrompt: string,
  ) {}

  /** Override in each subclass — return the raw data to analyze. */
  abstract fetchData(): Promise<T>;

  /** Call Claude to turn raw data into a structured summary. */
  private async analyze(rawData: T): Promise<AgentAnalysis> {
    const userMessage = `
Here is the latest data for your analysis:

\`\`\`json
${JSON.stringify(rawData, null, 2)}
\`\`\`

Respond ONLY with a valid JSON object in this exact shape (no markdown fences, no extra text):
{
  "summary": "2-3 sentence summary of the most important developments",
  "highlights": ["bullet 1", "bullet 2", "bullet 3"],
  "sentiment": "positive | neutral",
  "metrics": { "key_metric_name": value }
}
    `.trim();

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: this.systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean) as AgentAnalysis;
  }

  /** Main entry point — fetch → analyze → persist. Call this on each scheduled run. */
  async run(): Promise<AgentAnalysis> {
    console.log(`[${this.name}] Starting run at ${new Date().toISOString()}`);

    const rawData = await this.fetchData();
    const analysis = await this.analyze(rawData);

    const output: AgentOutput = {
      agent: this.name,
      topic: this.topic,
      timestamp: new Date().toISOString(),
      summary: analysis.summary,
      highlights: analysis.highlights,
      sentiment: analysis.sentiment,
      metrics: analysis.metrics,
      rawData: rawData as Record<string, unknown>,
    };

    saveAgentOutput(output);
    console.log(`[${this.name}] ✓ Done. Summary: ${analysis.summary}`);
    return analysis;
  }
}

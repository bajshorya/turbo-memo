import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  getRecentOutputs,
  saveSuperAgentRun,
  getRecentSuperAgentRuns,
} from "../memoryStore.js";
import type { AgentOutput, SuperAgentResult, SuperAgentRun } from "../types.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `
You are the marketing intelligence agent for garden.finance — a leading cross-chain swap protocol.

Your job is to read summarized data from multiple internal sub-agents and generate high-quality,
ready-to-use marketing content for the garden.finance social media and content team.

STRICT CONTENT RULES:
- Only produce positive, factual, and on-brand content
- Never mention competitors negatively or by real name
- Never fabricate or exaggerate statistics — only use numbers explicitly provided to you
- Never make forward-looking promises or financial claims (e.g. "prices will go up")
- Tone: confident, community-first, technically credible — never hype-y or spammy
- Use crypto-native language naturally (TVL, swaps, on-chain, liquidity, BPS, etc.)
- Do NOT use filler phrases like "excited to announce" unless there is a real milestone

TWEET STYLE GUIDE:
- Max 280 characters per tweet
- Strong hook in the first line
- Use real numbers wherever available
- 1–2 hashtags max per tweet, prefer $SEED or chain-specific tags
- End with insight or CTA

Respond ONLY with a valid JSON object matching this exact shape (no markdown, no extra text):
{
  "run_timestamp": "ISO timestamp",
  "data_summary": "2-3 sentence overview of what all the data shows",
  "tweets": [
    {
      "id": "t1",
      "type": "standalone",
      "content": "tweet text (max 280 chars)",
      "data_source": "which agent this is based on",
      "confidence": "high | medium",
      "tags": ["#tag"]
    }
  ],
  "thread": {
    "topic": "thread topic title",
    "tweets": [
      { "position": 1, "content": "tweet 1 text" },
      { "position": 2, "content": "tweet 2 text" },
      { "position": 3, "content": "tweet 3 text" }
    ]
  },
  "content_ideas": [
    {
      "format": "blog | infographic | space | newsletter",
      "title": "content title",
      "angle": "the story angle",
      "key_data_points": ["stat 1", "stat 2"]
    }
  ],
  "top_metrics_to_highlight": [
    { "label": "metric name", "value": "metric value", "context": "why this matters" }
  ]
}
`.trim();

// Initialize Gemini model once (with system prompt + strict JSON mode)
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro",
  systemInstruction: SYSTEM_PROMPT,
  generationConfig: {
    responseMimeType: "application/json",
    maxOutputTokens: 4000,
  },
});

// ── Context builder ───────────────────────────────────────────────────────────

function buildContextMessage(outputs: AgentOutput[]): string {
  if (outputs.length === 0) {
    throw new Error(
      "No agent outputs in memory store. Run sub-agents first with POST /api/run-agent/:name",
    );
  }

  const sections = outputs.map(
    (o) =>
      `## ${o.agent} — topic: ${o.topic}
Timestamp: ${o.timestamp}
Summary: ${o.summary}
Highlights:
${o.highlights.map((h) => `  - ${h}`).join("\n")}
Key Metrics: ${JSON.stringify(o.metrics, null, 2)}`,
  );

  return `Here is the latest intelligence from all sub-agents.
Use this data to generate marketing content for garden.finance.

${sections.join("\n\n---\n\n")}

Today's date: ${new Date().toISOString().split("T")[0]}`;
}

// ── Main run function ─────────────────────────────────────────────────────────

export interface SuperAgentOptions {
  limitPerTopic?: number;
  saveToDb?: boolean;
}

export async function runSuperAgent(
  options: SuperAgentOptions = {},
): Promise<SuperAgentResult> {
  const { limitPerTopic = 3, saveToDb = true } = options;

  console.log("[SuperAgent] Starting run at", new Date().toISOString());

  const outputs = getRecentOutputs(limitPerTopic);
  console.log(`[SuperAgent] Loaded ${outputs.length} agent output records`);

  const userMessage = buildContextMessage(outputs);

  console.log("[SuperAgent] Sending to Gemini for analysis...");

  const resultResponse = await model.generateContent(userMessage);
  const text = resultResponse.response.text().trim();

  let result: SuperAgentResult;
  try {
    result = JSON.parse(text) as SuperAgentResult;
  } catch {
    throw new Error(
      `[SuperAgent] Gemini returned invalid JSON.\nRaw response:\n${text.slice(0, 500)}`,
    );
  }

  // Attach run metadata
  result.run_timestamp = new Date().toISOString();
  result.agent_sources = [...new Set(outputs.map((o) => o.agent))];
  result.input_record_count = outputs.length;

  if (saveToDb) {
    saveSuperAgentRun(result);
  }

  console.log(
    `[SuperAgent] ✓ Generated ${result.tweets?.length ?? 0} tweets, ` +
      `${result.thread?.tweets?.length ?? 0} thread tweets, ` +
      `${result.content_ideas?.length ?? 0} content ideas`,
  );

  return result;
}

// ── Re-export DB helpers so scheduler only imports from here ──────────────────

export { getRecentSuperAgentRuns };
export type { SuperAgentRun };

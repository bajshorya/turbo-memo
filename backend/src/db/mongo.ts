// src/db/mongo.ts
// Single shared Mongoose connection for the entire project.
// Every agent imports { AgentOutputModel } from here to save its results.

import mongoose, { Schema, type Document, type Model } from "mongoose";

// ── Connection ────────────────────────────────────────────────────────────────

let isConnected = false;

export async function connectMongo(): Promise<void> {
  if (isConnected) return;

  const uri =
    process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/garden_agents";

  await mongoose.connect(uri);
  isConnected = true;
  console.log(`[MongoDB] Connected to ${uri}`);
}

export async function disconnectMongo(): Promise<void> {
  await mongoose.disconnect();
  isConnected = false;
}

// ── Generic agent output schema ───────────────────────────────────────────────
// Every sub-agent writes one document per run into this collection.
// The super agent queries this collection to build its context.

export interface IAgentOutput extends Document {
  agent: string; // "VolumeAgent", "QuoteAgent", etc.
  topic: string; // "swap_volume", "quote_analysis", etc.
  analyzed_at: Date;
  data_from: string; // earliest data point covered
  data_to: string; // latest data point covered
  summary: string; // 2-3 sentence human-readable summary
  highlights: string[]; // bullet points for the super agent
  sentiment: "positive" | "neutral";
  signals: object[]; // agent-specific signal array
  metrics: Record<string, unknown>; // key numbers
  tweet_data_points: string[]; // ready-made facts
  content_angles: string[]; // narrative hooks
  raw_summary: Record<string, unknown>; // lightweight metadata about source data
}

const AgentOutputSchema = new Schema<IAgentOutput>(
  {
    agent: { type: String, required: true, index: true },
    topic: { type: String, required: true, index: true },
    analyzed_at: { type: Date, required: true, default: Date.now },
    data_from: { type: String, required: true },
    data_to: { type: String, required: true },
    summary: { type: String, required: true },
    highlights: { type: [String], default: [] },
    sentiment: {
      type: String,
      enum: ["positive", "neutral"],
      default: "neutral",
    },
    signals: { type: [Schema.Types.Mixed], default: [] },
    metrics: { type: Schema.Types.Mixed, default: {} },
    tweet_data_points: { type: [String], default: [] },
    content_angles: { type: [String], default: [] },
    raw_summary: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true, // adds createdAt / updatedAt automatically
    collection: "agent_outputs",
  },
);

// Compound index so the super agent can quickly fetch latest per topic
AgentOutputSchema.index({ topic: 1, analyzed_at: -1 });

export const AgentOutputModel: Model<IAgentOutput> =
  mongoose.models.AgentOutput ??
  mongoose.model<IAgentOutput>("AgentOutput", AgentOutputSchema);

// ── Super agent runs schema ───────────────────────────────────────────────────

export interface ISuperAgentRun extends Document {
  run_at: Date;
  agent_sources: string[];
  input_record_count: number;
  data_summary: string;
  tweets: object[];
  thread: object;
  content_ideas: object[];
  top_metrics: object[];
}

const SuperAgentRunSchema = new Schema<ISuperAgentRun>(
  {
    run_at: { type: Date, required: true, default: Date.now },
    agent_sources: { type: [String], default: [] },
    input_record_count: { type: Number, default: 0 },
    data_summary: { type: String, required: true },
    tweets: { type: [Schema.Types.Mixed], default: [] },
    thread: { type: Schema.Types.Mixed, default: {} },
    content_ideas: { type: [Schema.Types.Mixed], default: [] },
    top_metrics: { type: [Schema.Types.Mixed], default: [] },
  },
  {
    timestamps: true,
    collection: "super_agent_runs",
  },
);

export const SuperAgentRunModel: Model<ISuperAgentRun> =
  mongoose.models.SuperAgentRun ??
  mongoose.model<ISuperAgentRun>("SuperAgentRun", SuperAgentRunSchema);

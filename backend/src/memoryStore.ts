// src/memoryStore.ts

import Database from "better-sqlite3";
import path from "path";
import type { AgentOutput, SuperAgentResult, SuperAgentRun } from "./types.js";

const DB_PATH = path.join(process.cwd(), "garden_memory.db");
const db = new Database(DB_PATH);

// ── Schema ────────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS agent_outputs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    agent       TEXT    NOT NULL,
    topic       TEXT    NOT NULL,
    timestamp   TEXT    NOT NULL,
    summary     TEXT    NOT NULL,
    highlights  TEXT    NOT NULL,
    sentiment   TEXT    NOT NULL DEFAULT 'neutral',
    metrics     TEXT    NOT NULL DEFAULT '{}',
    raw_data    TEXT    NOT NULL DEFAULT '{}'
  );

  CREATE INDEX IF NOT EXISTS idx_topic_time
    ON agent_outputs (topic, timestamp DESC);

  CREATE TABLE IF NOT EXISTS super_agent_runs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp   TEXT NOT NULL,
    result_json TEXT NOT NULL
  );
`);

// ── Agent output helpers ──────────────────────────────────────────────────────

const insertOutput = db.prepare<{
  agent: string;
  topic: string;
  timestamp: string;
  summary: string;
  highlights: string;
  sentiment: string;
  metrics: string;
  raw_data: string;
}>(`
  INSERT INTO agent_outputs
    (agent, topic, timestamp, summary, highlights, sentiment, metrics, raw_data)
  VALUES
    (@agent, @topic, @timestamp, @summary, @highlights, @sentiment, @metrics, @raw_data)
`);

export function saveAgentOutput(output: AgentOutput): void {
  insertOutput.run({
    agent: output.agent,
    topic: output.topic,
    timestamp: output.timestamp,
    summary: output.summary,
    highlights: JSON.stringify(output.highlights),
    sentiment: output.sentiment,
    metrics: JSON.stringify(output.metrics),
    raw_data: JSON.stringify(output.rawData ?? {}),
  });
}

export function getRecentOutputs(limitPerTopic = 3): AgentOutput[] {
  const topics = db
    .prepare("SELECT DISTINCT topic FROM agent_outputs")
    .all() as Array<{ topic: string }>;

  const results: AgentOutput[] = [];

  for (const { topic } of topics) {
    const rows = db
      .prepare(
        `SELECT * FROM agent_outputs
         WHERE topic = ?
         ORDER BY timestamp DESC
         LIMIT ?`,
      )
      .all(topic, limitPerTopic) as Array<Record<string, string>>;

    for (const row of rows) {
      results.push({
        agent: row.agent,
        topic: row.topic,
        timestamp: row.timestamp,
        summary: row.summary,
        highlights: JSON.parse(row.highlights),
        sentiment: row.sentiment as AgentOutput["sentiment"],
        metrics: JSON.parse(row.metrics),
        rawData: JSON.parse(row.raw_data),
      });
    }
  }

  return results;
}

export function getLatestForTopic(topic: string): AgentOutput | null {
  const row = db
    .prepare(
      `SELECT * FROM agent_outputs WHERE topic = ? ORDER BY timestamp DESC LIMIT 1`,
    )
    .get(topic) as Record<string, string> | undefined;

  if (!row) return null;

  return {
    agent: row.agent,
    topic: row.topic,
    timestamp: row.timestamp,
    summary: row.summary,
    highlights: JSON.parse(row.highlights),
    sentiment: row.sentiment as AgentOutput["sentiment"],
    metrics: JSON.parse(row.metrics),
  };
}

// ── Super agent run helpers ───────────────────────────────────────────────────

const insertRun = db.prepare<{ timestamp: string; result_json: string }>(
  "INSERT INTO super_agent_runs (timestamp, result_json) VALUES (@timestamp, @result_json)",
);

export function saveSuperAgentRun(result: SuperAgentResult): void {
  insertRun.run({
    timestamp: result.run_timestamp,
    result_json: JSON.stringify(result),
  });
}

export function getRecentSuperAgentRuns(limit = 10): SuperAgentRun[] {
  const rows = db
    .prepare("SELECT * FROM super_agent_runs ORDER BY timestamp DESC LIMIT ?")
    .all(limit) as Array<{
    id: number;
    timestamp: string;
    result_json: string;
  }>;

  return rows.map((row) => ({
    id: row.id,
    timestamp: row.timestamp,
    result: JSON.parse(row.result_json) as SuperAgentResult,
  }));
}

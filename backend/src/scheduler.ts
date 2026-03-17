// src/scheduler.ts
// Cron scheduler + Express API server.
// Start with: npm run dev  (or npm start after build)

import "dotenv/config";
import cron from "node-cron";
import express, { type Request, type Response } from "express";
import cors from "cors";
import {
  VolumeAgent,
  QuoteAgent,
  PartnerAgent,
  CompetitorAgent,
  TrendAgent,
} from "./agents/subAgents.js";
import { runSuperAgent, getRecentSuperAgentRuns } from "./agents/superAgent.js";
import { getRecentOutputs, getLatestForTopic } from "./memoryStore.js";

// ── Agent registry ────────────────────────────────────────────────────────────

const agents = {
  volume: new VolumeAgent(),
  quote: new QuoteAgent(),
  partner: new PartnerAgent(),
  competitor: new CompetitorAgent(),
  trend: new TrendAgent(),
} as const;

type AgentName = keyof typeof agents;

// ── Cron schedules ────────────────────────────────────────────────────────────

// Every hour — volume and quotes move fast
cron.schedule("0 * * * *", async () => {
  await agents.volume.run().catch(console.error);
  await agents.quote.run().catch(console.error);
});

// Every 2 hours — social trends
cron.schedule("0 */2 * * *", async () => {
  await agents.trend.run().catch(console.error);
});

// Every 6 hours — partners and competitors are slower moving
cron.schedule("0 */6 * * *", async () => {
  await agents.partner.run().catch(console.error);
  await agents.competitor.run().catch(console.error);
});

// Super agent every 6 hours, 30 min after sub-agents
cron.schedule("30 */6 * * *", async () => {
  await runSuperAgent({ limitPerTopic: 3, saveToDb: true }).catch(
    console.error,
  );
});

console.log("[Scheduler] All cron jobs registered.");

// ── Express API ───────────────────────────────────────────────────────────────

const app = express();
app.use(cors());
app.use(express.json());

// GET /api/runs — last N super agent runs
app.get("/api/runs", (_req: Request, res: Response) => {
  const limit = Number(_req.query.limit ?? 10);
  const runs = getRecentSuperAgentRuns(limit);
  res.json({ runs });
});

// GET /api/runs/latest — single most recent run
app.get("/api/runs/latest", (_req: Request, res: Response) => {
  const runs = getRecentSuperAgentRuns(1);
  if (!runs.length) {
    res.status(404).json({
      error: "No runs yet. POST /api/run-now to generate the first one.",
    });
    return;
  }
  res.json(runs[0]);
});

// GET /api/agent-data — all sub-agent summaries
app.get("/api/agent-data", (_req: Request, res: Response) => {
  const limit = Number(_req.query.limit ?? 3);
  const data = getRecentOutputs(limit);
  res.json({ data });
});

// GET /api/agent-data/:topic — latest for one topic
app.get("/api/agent-data/:topic", (req: Request, res: Response) => {
  const data = getLatestForTopic(req.params.topic);
  if (!data) {
    res.status(404).json({ error: `No data for topic: ${req.params.topic}` });
    return;
  }
  res.json(data);
});

// POST /api/run-now — manually trigger super agent (used by dashboard "Regenerate" button)
app.post("/api/run-now", async (_req: Request, res: Response) => {
  try {
    console.log("[API] Manual super agent run triggered");
    const result = await runSuperAgent({ limitPerTopic: 3, saveToDb: true });
    res.json({ success: true, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[API] Manual run error:", message);
    res.status(500).json({ success: false, error: message });
  }
});

// POST /api/run-agent/:name — manually trigger one sub-agent
app.post("/api/run-agent/:name", async (req: Request, res: Response) => {
  const name = req.params.name as AgentName;
  const agent = agents[name];

  if (!agent) {
    res.status(404).json({
      error: `Unknown agent: "${name}". Valid names: ${Object.keys(agents).join(", ")}`,
    });
    return;
  }

  try {
    const result = await agent.run();
    res.json({ success: true, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: message });
  }
});

// ── Start server ──────────────────────────────────────────────────────────────

const PORT = Number(process.env.PORT ?? 3001);
app.listen(PORT, () => {
  console.log(`[API] Server running at http://localhost:${PORT}`);
  console.log(`[API] Endpoints:`);
  console.log(`       GET  /api/runs/latest`);
  console.log(`       GET  /api/runs`);
  console.log(`       GET  /api/agent-data`);
  console.log(`       GET  /api/agent-data/:topic`);
  console.log(`       POST /api/run-now`);
  console.log(
    `       POST /api/run-agent/:name  (volume | quote | partner | competitor | trend)`,
  );
});

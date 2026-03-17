// src/seed.ts
// Run this once to populate the DB with one full cycle before testing the super agent.
// Usage: npm run seed

import "dotenv/config";
import {
  VolumeAgent,
  QuoteAgent,
  PartnerAgent,
  CompetitorAgent,
  TrendAgent,
} from "./agents/subAgents.js";
import { runSuperAgent } from "./agents/superAgent.js";

async function seed() {
  console.log("=== Seeding garden_memory.db ===\n");

  const agents = [
    new VolumeAgent(),
    new QuoteAgent(),
    new PartnerAgent(),
    new CompetitorAgent(),
    new TrendAgent(),
  ];

  for (const agent of agents) {
    try {
      await agent.run();
    } catch (err) {
      console.error(`Failed: ${agent.name}`, err);
    }
  }

  console.log("\n=== Running super agent ===\n");

  try {
    const result = await runSuperAgent({ limitPerTopic: 1, saveToDb: true });
    console.log("\n=== Super agent output ===\n");
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Super agent failed:", err);
  }
}

seed();

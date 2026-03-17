// backend/src/agents/fees/testFeesAgent.ts

import "dotenv/config";
import { FeesAgent } from "./feesAgent.js";
import { disconnectMongo } from "../../db/mongo.js";

async function main() {
  console.log("╔═══════════════════════════════════════════╗");
  console.log("║        Fees Agent — Standalone Test       ║");
  console.log("╚═══════════════════════════════════════════╝\n");

  const agent = new FeesAgent("fees.json");

  try {
    const result = await agent.run();

    console.log("\n═══ TWEET DATA POINTS ═══");
    result.tweet_data_points.forEach((p, i) => {
      console.log(`\n  ${i + 1}. ${p}`);
    });

    console.log("\n═══ CONTENT ANGLES ═══");
    result.content_angles.forEach((a, i) => {
      console.log(`\n  ${i + 1}. ${a}`);
    });

    console.log("\n═══ SIGNALS DETECTED ═══");
    if (result.signals.length === 0) {
      console.log("\n  No notable signals detected.");
    } else {
      result.signals.forEach((s, i) => {
        console.log(
          `\n  ${i + 1}. [${s.type.toUpperCase()}] ${s.description} — ${s.value}`,
        );
      });
    }

    console.log("\n═══ KEY METRICS ═══");
    console.log(
      `\n  Total Fees All-time: $${result.metrics.total_fees_all_time.toLocaleString()}`,
    );
    console.log(
      `  Avg Daily Fees (30d): $${result.metrics.avg_daily_fees_30d.toLocaleString()}`,
    );
    console.log(
      `  Annual Runrate: $${result.metrics.estimated_annual_fees_runrate.toLocaleString()}`,
    );
    console.log(`  Avg Fee Rate: ${result.metrics.avg_fee_rate_pct}%`);
    console.log(`  Fees per Order: $${result.metrics.fees_per_order_avg_usd}`);
    console.log(`  Fees Growth (30d): ${result.metrics.fees_growth_30d_pct}%`);

    console.log("\n✓ Fees Agent test completed successfully.\n");
  } catch (err) {
    console.error("\n✗ Fees Agent test failed:", err);
    process.exit(1);
  } finally {
    await disconnectMongo();
  }
}

main();

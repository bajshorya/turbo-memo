// backend/src/agents/competitor/testCompetitorAgent.ts

import "dotenv/config";
import { CompetitorAgent } from "./competitorAgent.js";
import { disconnectMongo } from "../../db/mongo.js";

async function main() {
  console.log("╔═══════════════════════════════════════════╗");
  console.log("║    Competitor Analysis Agent — Test       ║");
  console.log("╚═══════════════════════════════════════════╝\n");

  const agent = new CompetitorAgent(
    "garden_volume.json", // Your existing Garden data
    "thorchain.json", // Thorchain data
    "coinmarketcap.json", // CoinMarketCap data
  );

  try {
    const result = await agent.run();

    console.log("\n═══ COMPETITIVE HIGHLIGHTS ═══");
    result.highlights.forEach((h, i) => {
      console.log(`\n  ${i + 1}. ${h}`);
    });

    console.log("\n═══ TWEET DATA POINTS ═══");
    result.tweet_data_points.forEach((p, i) => {
      console.log(`\n  ${i + 1}. ${p}`);
    });

    console.log("\n═══ CONTENT ANGLES ═══");
    result.content_angles.forEach((a, i) => {
      console.log(`\n  ${i + 1}. ${a}`);
    });

    console.log("\n═══ STRATEGIC RECOMMENDATIONS ═══");
    if (result.strategic_recommendations.length === 0) {
      console.log("\n  No recommendations provided.");
    } else {
      result.strategic_recommendations.forEach((r, i) => {
        console.log(`\n  ${i + 1}. ${r}`);
      });
    }

    console.log("\n═══ SIGNALS DETECTED ═══");
    if (result.signals.length === 0) {
      console.log("\n  No notable signals detected.");
    } else {
      result.signals.forEach((s, i) => {
        const competitorInfo = s.competitor ? ` vs ${s.competitor}` : "";
        console.log(
          `\n  ${i + 1}. [${s.type.toUpperCase()}]${competitorInfo} ${s.description} — ${s.value}`,
        );
      });
    }

    console.log("\n═══ KEY METRICS ═══");
    console.log(
      `\n  Garden Total Volume: ${result.metrics.garden_total_volume_fmt}`,
    );
    console.log(
      `  Competitor Total Volume: ${result.metrics.competitor_total_volume_fmt}`,
    );
    console.log(
      `  Garden Market Share: ${result.metrics.garden_market_share_pct}%`,
    );
    console.log(
      `  Volume Ratio (Garden:Competitor): ${result.metrics.volume_ratio_garden_to_competitor.toFixed(2)}:1`,
    );
    console.log(
      `  Garden 30d Growth: ${result.metrics.garden_growth_30d_pct}%`,
    );
    console.log(
      `  Competitor 30d Growth: ${result.metrics.competitor_growth_30d_pct}%`,
    );
    console.log(
      `  Growth Differential: ${result.metrics.growth_differential_pct > 0 ? "+" : ""}${result.metrics.growth_differential_pct}%`,
    );

    if (result.metrics.btc_price > 0) {
      console.log(
        `  BTC Price: $${result.metrics.btc_price.toLocaleString()} (${result.metrics.btc_price_change_30d_pct > 0 ? "+" : ""}${result.metrics.btc_price_change_30d_pct}% 30d)`,
      );
    }

    console.log("\n✓ Competitor Agent test completed successfully.\n");
  } catch (err) {
    console.error("\n✗ Competitor Agent test failed:", err);
    process.exit(1);
  } finally {
    await disconnectMongo();
  }
}

main();

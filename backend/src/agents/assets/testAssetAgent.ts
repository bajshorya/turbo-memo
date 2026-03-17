
import "dotenv/config";
import { AssetAgent } from "./assetAgent.js";
import { disconnectMongo } from "../../db/mongo.js";

async function main() {
  console.log("╔═══════════════════════════════════════════╗");
  console.log("║        Asset Agent — Standalone Test       ║");
  console.log("╚═══════════════════════════════════════════╝\n");

  const agent = new AssetAgent("assets.json");

  try {
    const result = await agent.run();

    console.log("\n═══ ASSET HIGHLIGHTS ═══");
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

    console.log("\n═══ SIGNALS DETECTED ═══");
    if (result.signals.length === 0) {
      console.log("\n  No notable signals detected.");
    } else {
      result.signals.forEach((s, i) => {
        const assetInfo = s.asset ? ` (${s.asset})` : "";
        console.log(
          `\n  ${i + 1}. [${s.type.toUpperCase()}]${assetInfo} ${s.description} — ${s.value}`,
        );
      });
    }

    console.log("\n═══ KEY METRICS ═══");
    console.log(
      `\n  Total Volume All-time: $${result.metrics.total_volume_all_time.toLocaleString()}`,
    );
    console.log(
      `  Total Orders: ${result.metrics.total_orders_all_time.toLocaleString()}`,
    );
    console.log(
      `  Total Unique Wallets: ${result.metrics.total_unique_wallets.toLocaleString()}`,
    );
    console.log(
      `  Avg Order Size: $${result.metrics.avg_order_size_usd.toFixed(2)}`,
    );
    console.log(
      `  Dominant Asset: ${result.metrics.dominant_asset_name} (${result.metrics.dominant_asset_volume_share_pct}%)`,
    );
    console.log(
      `  Top 3 Assets Concentration: ${result.metrics.top3_assets_concentration_pct}%`,
    );
    console.log(
      `  Diversity Index: ${result.metrics.diversity_index.toFixed(2)}`,
    );
    console.log(
      `  Source/Destination Split: ${result.metrics.source_volume_pct}% / ${result.metrics.destination_volume_pct}%`,
    );

    console.log("\n✓ Asset Agent test completed successfully.\n");
  } catch (err) {
    console.error("\n✗ Asset Agent test failed:", err);
    process.exit(1);
  } finally {
    await disconnectMongo();
  }
}

main();

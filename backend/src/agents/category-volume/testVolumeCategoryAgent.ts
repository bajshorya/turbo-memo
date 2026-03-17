import "dotenv/config";
import { CategoryVolumeAgent } from "./volumeCategoryAgent";
import { disconnectMongo } from "../../db/mongo";

async function main() {
  console.log("╔═══════════════════════════════════════════╗");
  console.log("║    Category Volume Agent — Standalone Test║");
  console.log("╚═══════════════════════════════════════════╝\n");

  const agent = new CategoryVolumeAgent("category_volume.json");

  try {
    const result = await agent.run();

    console.log("\n═══ CATEGORY COMPOSITION HIGHLIGHTS ═══");
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

    console.log("\n═══ CATEGORY SIGNALS DETECTED ═══");
    if (result.signals.length === 0) {
      console.log("\n  No notable category signals detected.");
    } else {
      result.signals.forEach((s, i) => {
        console.log(
          `\n  ${i + 1}. [${s.type.toUpperCase()}] ${s.description} — ${s.value}`,
        );
      });
    }

    console.log("\n✓ Category Volume Agent test completed successfully.\n");
  } catch (err) {
    console.error("\n✗ Category Volume Agent test failed:", err);
    process.exit(1);
  } finally {
    await disconnectMongo();
  }
}

main();

import "dotenv/config";
import { VolumeAgent } from "./volumeAgent";
import { disconnectMongo } from "../../db/mongo";

async function main() {
  console.log("╔═══════════════════════════════════════════╗");
  console.log("║       Volume Agent — Standalone Test      ║");
  console.log("╚═══════════════════════════════════════════╝\n");

  const agent = new VolumeAgent("volume.json");

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
        console.log(`\n  ${i + 1}. [${s.type.toUpperCase()}] ${s.description} — ${s.value}`);
      });
    }

    console.log("\n✓ Volume Agent test completed successfully.\n");
  } catch (err) {
    console.error("\n✗ Volume Agent test failed:", err);
    process.exit(1);
  } finally {
    await disconnectMongo();
  }
}

main();

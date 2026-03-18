// backend/src/agents/testSuperAgent.ts

import "dotenv/config";
import { SuperAgent } from "./superAgent.js";
import { disconnectMongo } from "../db/mongo.js";

async function main() {
  console.log("\n" + "🌟".repeat(30));
  console.log("🌟   SUPER AGENT — MASTER CONTENT STRATEGIST   🌟");
  console.log("🌟".repeat(30) + "\n");

  const agent = new SuperAgent();

  try {
    const result = await agent.run();

    console.log("\n" + "📊".repeat(20));
    console.log("📊 EXECUTIVE SUMMARY");
    console.log("📊".repeat(20) + "\n");
    console.log(result.summary);

    console.log("\n" + "📈".repeat(20));
    console.log("📈 KEY NARRATIVES");
    console.log("📈".repeat(20) + "\n");

    result.key_narratives.forEach((narrative, i) => {
      console.log(
        `${i + 1}. ${narrative.title} [${narrative.priority} priority]`,
      );
      console.log(`   ${narrative.description}`);
      console.log(`   Supporting data:`);
      narrative.supporting_data.forEach((d) => console.log(`   • ${d}`));
      console.log();
    });

    console.log("\n" + "📅".repeat(20));
    console.log("📅 WEEKLY THEMES");
    console.log("📅".repeat(20) + "\n");

    result.weekly_themes.forEach((theme, i) => {
      console.log(
        `${i + 1}. ${theme.theme} (${theme.suggested_tweet_count} tweets)`,
      );
      console.log(`   ${theme.rationale}`);
      console.log();
    });

    console.log("\n" + "🐦".repeat(20));
    console.log("🐦 STANDALONE TWEETS");
    console.log("🐦".repeat(20) + "\n");

    result.standalone_tweets.forEach((tweet, i) => {
      console.log(
        `Tweet ${i + 1} [${tweet.metrics?.estimated_engagement} engagement]`,
      );
      console.log(`"${tweet.content}"`);
      console.log(`   Target: ${tweet.metrics?.target_audience.join(", ")}`);
      if (tweet.metrics?.best_time_to_post) {
        console.log(`   Best time: ${tweet.metrics.best_time_to_post}`);
      }
      console.log();
    });

    console.log("\n" + "🧵".repeat(20));
    console.log("🧵 TWEET THREADS");
    console.log("🧵".repeat(20) + "\n");

    result.tweet_threads.forEach((thread, i) => {
      console.log(`Thread ${i + 1}: ${thread.title}`);
      console.log(
        `(${thread.total_tweets} tweets · ${thread.estimated_read_time_minutes} min read)`,
      );
      console.log();

      thread.tweets.forEach((tweet, j) => {
        console.log(`  ${j + 1}/${thread.total_tweets}: ${tweet.content}`);
      });
      console.log();
    });

    console.log("\n" + "📋".repeat(20));
    console.log("📋 CONTENT CALENDAR");
    console.log("📋".repeat(20) + "\n");

    result.content_calendar.forEach((day) => {
      console.log(`${day.day}: ${day.focus}`);
      console.log(`   Tweets: ${day.suggested_tweet_ids.join(", ")}`);
      console.log();
    });

    console.log("\n" + "🔮".repeat(20));
    console.log("🔮 PERFORMANCE PREDICTIONS");
    console.log("🔮".repeat(20) + "\n");

    console.log(
      `Best performing tweet: "${result.predicted_performance.best_performing_tweet}"`,
    );
    if (result.predicted_performance.most_controversial_topic) {
      console.log(
        `Most controversial topic: ${result.predicted_performance.most_controversial_topic}`,
      );
    }
    console.log(
      `Most educational content: ${result.predicted_performance.most_educational_content}`,
    );

    console.log("\n" + "📊".repeat(20));
    console.log("📊 METRICS SUMMARY");
    console.log("📊".repeat(20) + "\n");

    console.log(`Garden Volume:       ${result.metrics_summary.garden_volume}`);
    console.log(
      `Competitor Volume:   ${result.metrics_summary.competitor_volume}`,
    );
    console.log(
      `Garden Market Share: ${result.metrics_summary.garden_market_share_pct}%`,
    );
    console.log(
      `Market Position:     ${result.metrics_summary.market_position}`,
    );
    console.log(`Growth Story:        ${result.metrics_summary.growth_story}`);

    console.log("\n" + "📊".repeat(20));
    console.log(
      `📊 Generated ${result.raw_tweet_count} tweets across ${result.raw_thread_count} threads`,
    );
    console.log("📊".repeat(20) + "\n");

    console.log("✅ Super Agent test completed successfully!\n");
  } catch (err) {
    console.error("\n❌ Super Agent test failed:", err);
    process.exit(1);
  } finally {
    await disconnectMongo();
  }
}

main();

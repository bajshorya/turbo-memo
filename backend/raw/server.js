const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Fisher-Yates shuffle to randomize array order on every request
function shuffle(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

app.get("/agent/volume-analyzer", (req, res) => {
  const dataPath = path.join(__dirname, "data", "volume_analyzer_data.json");
  setTimeout(() => {
    res.json(shuffle(JSON.parse(fs.readFileSync(dataPath, "utf8"))));
  }, 2000);
});

app.get("/agent/category-volume-analyzer", (req, res) => {
  const dataPath = path.join(__dirname, "data", "category_volume_data.json");
  setTimeout(() => {
    res.json(shuffle(JSON.parse(fs.readFileSync(dataPath, "utf8"))));
  }, 2000);
});

app.get("/agent/fees-analyzer", (req, res) => {
  const dataPath = path.join(__dirname, "data", "fees_volume_data.json");
  setTimeout(() => {
    res.json(shuffle(JSON.parse(fs.readFileSync(dataPath, "utf8"))));
  }, 2000);
});

app.get("/agent/asset-analyzer", (req, res) => {
  const dataPath = path.join(__dirname, "data", "asset_analyzer_data.json");
  setTimeout(() => {
    res.json(shuffle(JSON.parse(fs.readFileSync(dataPath, "utf8"))));
  }, 2000);
});

app.get("/agent/super-agent", (req, res) => {
  const dataPath = path.join(__dirname, "data", "super_agent_data.json");
  setTimeout(() => {
    res.json(shuffle(JSON.parse(fs.readFileSync(dataPath, "utf8"))));
  }, 2000);
});

app.get("/agent/competitor_analysis", (req, res) => {
  const cmcPath = path.join(__dirname, "data", "competitor.json");
  setTimeout(() => {
    res.json(shuffle(JSON.parse(fs.readFileSync(cmcPath, "utf8"))));
  }, 2000);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`  • GET /agent/volume-analyzer`);
  console.log(`  • GET /agent/category-volume-analyzer`);
  console.log(`  • GET /agent/fees-analyzer`);
  console.log(`  • GET /agent/asset-analyzer`);
  console.log(`  • GET /agent/super-agent`);
  console.log(`  • GET /agent/competitor_analysis`);
});

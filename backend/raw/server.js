const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/agent/volume-analyzer", (req, res) => {
  const dataPath = path.join(__dirname, "data", "volume_analyzer_data.json");
  setTimeout(() => {
    res.json(JSON.parse(fs.readFileSync(dataPath, "utf8")));
  }, 3000);
});

app.get("/agent/category-volume-analyzer", (req, res) => {
  const dataPath = path.join(__dirname, "data", "category_volume_data.json");
  setTimeout(() => {
    res.json(JSON.parse(fs.readFileSync(dataPath, "utf8")));
  }, 3000);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`  • GET /agent/volume-analyzer`);
  console.log(`  • GET /agent/category-volume-analyzer`);
});

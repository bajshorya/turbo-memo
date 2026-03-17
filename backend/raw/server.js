const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Load data from JSON file
function loadData() {
  try {
    const dataPath = path.join(__dirname, "data", "volume_analyzer_data.json");
    const jsonData = fs.readFileSync(dataPath, "utf8");
    return JSON.parse(jsonData);
  } catch (error) {
    console.error("Error loading data:", error);
    return [];
  }
}

const gardenData = loadData();

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    name: "Garden Finance API",
    description: "API for Garden Bitcoin bridge volume data",
    version: "1.0.0",
    endpoints: {
      "GET /agent/volume-analyzer": "Get all volume analyzer data",
      "GET /agent/volume-analyzer/:id":
        "Get specific data by ID (e.g., /agent/volume-analyzer/1)",
      "GET /agent/volume-analyzer/category/:category":
        "Filter by category (e.g., /agent/volume-analyzer/category/All-Time Milestone)",
      "GET /agent/volume-analyzer/metrics": "Get simplified metrics",
      "GET /agent/volume-analyzer/stats": "Get summary statistics",
      "GET /api/health": "Health check",
    },
  });
});

// Health check (keeping this as /api/health)
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    data_points: gardenData.length,
  });
});

// Get all volume analyzer data
app.get("/agent/volume-analyzer", (req, res) => {
  res.json(gardenData);
});

// Get volume analyzer data by ID
app.get("/agent/volume-analyzer/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const item = gardenData.find((item) => item.id === id);

  if (!item) {
    return res.status(404).json({
      error: "Item not found",
      available_ids: gardenData.map((item) => item.id),
    });
  }

  res.json(item);
});

// Get volume analyzer data by category
app.get("/agent/volume-analyzer/category/:category", (req, res) => {
  const category = req.params.category;
  const filtered = gardenData.filter(
    (item) => item.category.toLowerCase() === category.toLowerCase(),
  );

  if (filtered.length === 0) {
    return res.status(404).json({
      error: "Category not found",
      available_categories: [
        ...new Set(gardenData.map((item) => item.category)),
      ],
    });
  }

  res.json({
    category,
    count: filtered.length,
    data: filtered,
  });
});

// Get volume analyzer metrics only
app.get("/agent/volume-analyzer/metrics", (req, res) => {
  const metrics = gardenData.map((item) => ({
    id: item.id,
    metric: item.metric,
    value: item.value,
    category: item.category,
    raw_value: item.raw_value,
  }));

  res.json(metrics);
});

// Get volume analyzer statistics
app.get("/agent/volume-analyzer/stats", (req, res) => {
  const totalVolume = gardenData.find((item) => item.id === 1)?.raw_value || 0;
  const totalOrders = gardenData.find((item) => item.id === 2)?.raw_value || 0;
  const uniqueSources =
    gardenData.find((item) => item.id === 3)?.raw_value || 0;
  const volumePerSecond =
    gardenData.find((item) => item.id === 99)?.raw_value || 0;

  const categories = [...new Set(gardenData.map((item) => item.category))];
  const totalRawValue = gardenData.reduce(
    (sum, item) => sum + (item.raw_value || 0),
    0,
  );

  res.json({
    summary: {
      total_data_points: gardenData.length,
      categories: categories.length,
      unique_categories: categories,
    },
    key_metrics: {
      total_volume_usd: {
        value: totalVolume,
        formatted: `$${(totalVolume / 1e9).toFixed(2)} Billion`,
      },
      total_orders: totalOrders,
      unique_sources: uniqueSources,
      volume_per_second: `$${volumePerSecond.toFixed(2)}/second`,
    },
    aggregate: {
      total_raw_value_sum: totalRawValue,
      average_raw_value: totalRawValue / gardenData.length,
    },
    last_updated: new Date().toISOString(),
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    available_endpoints: [
      "/",
      "/api/health",
      "/agent/volume-analyzer",
      "/agent/volume-analyzer/:id",
      "/agent/volume-analyzer/category/:category",
      "/agent/volume-analyzer/metrics",
      "/agent/volume-analyzer/stats",
    ],
  });
});

app.listen(PORT, () => {
  console.log(`✅ Garden Finance API is running!`);
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`\nTry these endpoints:`);
  console.log(`   • http://localhost:${PORT}/agent/volume-analyzer`);
  console.log(`   • http://localhost:${PORT}/agent/volume-analyzer/1`);
  console.log(`   • http://localhost:${PORT}/agent/volume-analyzer/stats`);
  console.log(`   • http://localhost:${PORT}/api/health`);
});

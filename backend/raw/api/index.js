const fs = require("fs");
const path = require("path");

// Load data from JSON file
function loadData() {
  try {
    const dataPath = path.join(
      process.cwd(),
      "data",
      "volume_analyzer_data.json",
    );
    const jsonData = fs.readFileSync(dataPath, "utf8");
    return JSON.parse(jsonData);
  } catch (error) {
    console.error("Error loading data:", error);
    return [];
  }
}

export default function handler(req, res) {
  const gardenData = loadData();
  const { method, url, query } = req;

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Content-Type", "application/json");

  // Handle preflight requests
  if (method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Parse URL
  const pathParts = url
    .split("?")[0]
    .split("/")
    .filter((p) => p);

  // Route handling
  if (
    pathParts.length === 0 ||
    (pathParts.length === 1 && pathParts[0] === "api")
  ) {
    // Root endpoint
    return res.status(200).json({
      name: "Garden Finance API",
      description: "API for Garden Bitcoin bridge volume data",
      version: "1.0.0",
      endpoints: {
        "GET /api/data": "Get all volume data",
        "GET /api/data/:id": "Get specific data by ID",
        "GET /api/data/category/:category": "Filter by category",
        "GET /api/metrics": "Get simplified metrics",
        "GET /api/stats": "Get summary statistics",
        "GET /api/health": "Health check",
      },
      documentation: "https://github.com/yourusername/garden-api",
      data_source: "/data/volume.json",
    });
  }

  // Health check
  if (pathParts[0] === "api" && pathParts[1] === "health") {
    return res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      data_points: gardenData.length,
    });
  }

  // Get all data
  if (
    pathParts[0] === "api" &&
    pathParts[1] === "data" &&
    pathParts.length === 2
  ) {
    return res.status(200).json(gardenData);
  }

  // Get data by category
  if (
    pathParts[0] === "api" &&
    pathParts[1] === "data" &&
    pathParts[2] === "category" &&
    pathParts[3]
  ) {
    const category = decodeURIComponent(pathParts[3]);
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

    return res.status(200).json({
      category,
      count: filtered.length,
      data: filtered,
    });
  }

  // Get data by ID
  if (
    pathParts[0] === "api" &&
    pathParts[1] === "data" &&
    pathParts[2] &&
    !isNaN(pathParts[2])
  ) {
    const id = parseInt(pathParts[2]);
    const item = gardenData.find((item) => item.id === id);

    if (!item) {
      return res.status(404).json({
        error: "Item not found",
        available_ids: gardenData.map((item) => item.id),
      });
    }

    return res.status(200).json(item);
  }

  // Get metrics only
  if (pathParts[0] === "api" && pathParts[1] === "metrics") {
    const metrics = gardenData.map((item) => ({
      id: item.id,
      metric: item.metric,
      value: item.value,
      category: item.category,
      raw_value: item.raw_value,
    }));

    return res.status(200).json(metrics);
  }

  // Get statistics
  if (pathParts[0] === "api" && pathParts[1] === "stats") {
    const totalVolume =
      gardenData.find((item) => item.id === 1)?.raw_value || 0;
    const totalOrders =
      gardenData.find((item) => item.id === 2)?.raw_value || 0;
    const uniqueSources =
      gardenData.find((item) => item.id === 3)?.raw_value || 0;
    const volumePerSecond =
      gardenData.find((item) => item.id === 99)?.raw_value || 0;

    // Calculate additional stats
    const categories = [...new Set(gardenData.map((item) => item.category))];
    const totalRawValue = gardenData.reduce(
      (sum, item) => sum + (item.raw_value || 0),
      0,
    );

    return res.status(200).json({
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
        volume_per_second: volumePerSecond,
      },
      aggregate: {
        total_raw_value_sum: totalRawValue,
        average_raw_value: totalRawValue / gardenData.length,
      },
      last_updated: new Date().toISOString(),
    });
  }

  // 404 for unknown routes
  return res.status(404).json({
    error: "Endpoint not found",
    available_endpoints: [
      "/api",
      "/api/data",
      "/api/data/:id",
      "/api/data/category/:category",
      "/api/metrics",
      "/api/stats",
      "/api/health",
    ],
  });
}

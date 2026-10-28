require("dotenv").config();

const express = require("express");
const path = require("path");
const shoppingItemsRouter = require("./routes/shopping-items");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const frontendPath = path.join(__dirname, "..", "frontend");

app.disable("x-powered-by");
app.use(express.json({ limit: "20kb" }));

// Frontend and API share the same origin during local development.
app.use(express.static(frontendPath));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "shopping-list-manager" });
});

app.use("/api/shopping-items", shoppingItemsRouter);

app.use("/api", (_req, res) => {
  res.status(404).json({ error: "API endpoint not found." });
});

app.use((err, _req, res, _next) => {
  console.error("Server error:", err.message || err);
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ error: "Invalid JSON request body." });
  }
  return res.status(500).json({ error: "Unexpected server error." });
});

app.listen(PORT, () => {
  console.log(`Shopping List Manager running at http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

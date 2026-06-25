import express from "express";
import cors from "cors";
import { config } from "./config";
import { authenticate } from "./middleware/auth";

// Import routes
import ingestRoutes from "./routes/ingest";
import inboxRoutes from "./routes/inbox";
import searchRoutes from "./routes/search";
import topicsRoutes from "./routes/topics";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint (public)
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// API Routes
// Ingestion endpoint (can be called without auth for external AI providers)
app.use("/v1/ai", ingestRoutes);

// Protected endpoints (require authentication)
app.use("/v1/kb/inbox", authenticate, inboxRoutes);
app.use("/v1/kb/search", authenticate, searchRoutes);
app.use("/v1/kb/topics", authenticate, topicsRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: config.nodeEnv === "development" ? err.message : undefined,
  });
});

// Start server
const PORT = config.port;

app.listen(PORT, () => {
  console.log(`🚀 Knowledge Bank API running on port ${PORT}`);
  console.log(`   Environment: ${config.nodeEnv}`);
  console.log(`   GCP Project: ${config.gcp.projectId || "Not configured"}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
});

export default app;

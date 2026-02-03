import express from "express";
import dotenv from "dotenv";
import { withTenant, releasePg } from "./middleware/tenant";
import { searchRoute } from "./search/searchRoute";
import { checkDatabaseHealth } from "./db";

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    const dbHealth = await checkDatabaseHealth();
    res.json({
      status: "ok",
      database: {
        primary: dbHealth.primary ? "healthy" : "unhealthy",
        replicas: dbHealth.replicas.map((healthy, i) => ({
          replica: i + 1,
          status: healthy ? "healthy" : "unhealthy",
        })),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      error: error.message,
    });
  }
});

// Tenant middleware (must be before routes)
app.use(withTenant);
app.use(releasePg);

// Routes
app.use("/search", searchRoute);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Search service listening on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
});

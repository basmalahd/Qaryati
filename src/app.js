// Load environment variables before creating Prisma or JWT-backed routers.
require("./config/env.config");

const express = require("express");
const errorHandler = require("./middleware/error.middleware");
const { createPrismaRoutes } = require("./modules/auth/routes/prisma-routes");

const agricultureItemRoutes = require("./modules/agriculture-items/routes/agriculture-item.routes");
const economicActivityRoutes = require("./modules/economic-activities/routes/economic-activity.routes");
const heritageItemRoutes = require("./modules/heritage-items/routes/heritage-item.routes");
const historicalEventRoutes = require("./modules/historical-events/routes/historical-event.routes");
const landmarkRoutes = require("./modules/landmarks/routes/landmark.routes");
const publicFacilityRoutes = require("./modules/public-facilities/routes/public-facility.routes");

const app = express();

app.use(express.json());

// Liveness check (does not require a database query).
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Qaryati API is running"
  });
});

// Public read endpoints for the village information modules.
app.use("/api/v1/agriculture-items", agricultureItemRoutes);
app.use("/api/v1/economic-activities", economicActivityRoutes);
app.use("/api/v1/heritage-items", heritageItemRoutes);
app.use("/api/v1/historical-events", historicalEventRoutes);
app.use("/api/v1/landmarks", landmarkRoutes);
app.use("/api/v1/public-facilities", publicFacilityRoutes);

// Authentication and user-management endpoints.
app.use("/api/v1", createPrismaRoutes());

// Handle routes that do not exist.
app.use((req, res, next) => {
  const error = new Error("The requested endpoint does not exist.");
  error.status = 404;
  next(error);
});

// Centralized error handler - must be last.
app.use(errorHandler);

module.exports = app;

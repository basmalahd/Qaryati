// Load environment variables before creating Prisma or JWT-backed routers.
require("./config/env.config");

const express = require("express");
const errorHandler = require("./middleware/error.middleware");
const { createPrismaRoutes } = require("./modules/auth/routes/prisma-routes");

const app = express();

app.use(express.json());

// Liveness check (does not require a database query).
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Qaryati API is running"
  });
});

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

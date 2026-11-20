// Load environment variables before creating Prisma or JWT-backed routers.
const env = require("./config/env.config");
require("./shared/bigint");

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const prisma = require("./config/prisma.config");
const errorHandler = require("./middleware/error.middleware");
const { sendProblem } = require("./shared/http/send-problem");
const { createAuthenticateMiddleware } = require("./middleware/authenticate.middleware");
const { authorize } = require("./middleware/authorize.middleware");
const { createPrismaRoutes } = require("./modules/auth/routes/prisma-routes");
const { createPrismaUserRepository } = require("./modules/auth/repositories/prisma-user.repository");
const { createPrismaRefreshTokenRepository } = require("./modules/auth/repositories/prisma-refresh-token.repository");
const { createJwtService } = require("./modules/auth/services/jwt.service");
const { createVillageModule } = require("./modules/villages/village.module");

const agricultureItemRoutes = require("./modules/agriculture-items/routes/agriculture-item.routes");
const economicActivityRoutes = require("./modules/economic-activities/routes/economic-activity.routes");
const heritageItemRoutes = require("./modules/heritage-items/routes/heritage-item.routes");
const historicalEventRoutes = require("./modules/historical-events/routes/historical-event.routes");
const landmarkRoutes = require("./modules/landmarks/routes/landmark.routes");
const publicFacilityRoutes = require("./modules/public-facilities/routes/public-facility.routes");
const { createSourceRouter } = require("./modules/sources/routes/source.routes");

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGINS.length ? env.CORS_ORIGINS : false }));
app.use(express.json({ limit: "100kb" }));

const limiter = (max) => rateLimit({
  windowMs: 60 * 1000,
  limit: max,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (req, res) => sendProblem(req, res, 429, "Too Many Requests", "Rate limit exceeded. Try again later.", "RATE_LIMITED")
});
if (env.NODE_ENV !== "test") app.use("/api/", limiter(env.RATE_LIMIT_MAX));

// Liveness check (does not require a database query).
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Qaryati API is running"
  });
});

// Shared auth building blocks (one JWT service / repository for the whole app).
const userRepository = createPrismaUserRepository();
const tokenRepository = createPrismaRefreshTokenRepository();
const jwtService = createJwtService(process.env.JWT_ACCESS_SECRET);
const authenticate = createAuthenticateMiddleware(jwtService, userRepository);

// Authentication and user-management endpoints (login is throttled harder).
if (env.NODE_ENV !== "test") app.use("/api/v1/auth/login", limiter(env.AUTH_RATE_LIMIT_MAX));
app.use("/api/v1", createPrismaRoutes({ userRepository, tokenRepository, jwtService }));

// Core domain: villages, names, nearby villages, population history, governorates, review.
const village = createVillageModule({ express, prisma, authenticate, authorize });
app.use("/api/v1/villages", village.villages);
app.use("/api/v1/admin/villages", village.adminVillages);
app.use("/api/v1/governorates", village.governorates);
app.use("/api/v1/review/versions", village.review);

// Public read endpoints for supporting village information.
app.use("/api/v1/agriculture-items", agricultureItemRoutes);
app.use("/api/v1/economic-activities", economicActivityRoutes);
app.use("/api/v1/heritage-items", heritageItemRoutes);
app.use("/api/v1/historical-events", historicalEventRoutes);
app.use("/api/v1/landmarks", landmarkRoutes);
app.use("/api/v1/public-facilities", publicFacilityRoutes);
app.use("/api/v1/sources", createSourceRouter({ authenticate, authorize }));

// Handle routes that do not exist.
app.use((req, res, next) => {
  const error = new Error("The requested endpoint does not exist.");
  error.status = 404;
  next(error);
});

// Centralized error handler - must be last.
app.use(errorHandler);

module.exports = app;

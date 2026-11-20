require("dotenv").config();

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 3000),
  CORS_ORIGINS: (process.env.CORS_ORIGINS || "").split(",").map((o) => o.trim()).filter(Boolean),
  RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX || 300),
  AUTH_RATE_LIMIT_MAX: Number(process.env.AUTH_RATE_LIMIT_MAX || 20)
};

if (!Number.isInteger(env.PORT) || env.PORT < 1 || env.PORT > 65535) {
  throw new Error("PORT must be a valid port number");
}

// Fail fast instead of signing tokens with a missing/weak secret.
if (env.NODE_ENV !== "test" && (!process.env.JWT_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET.length < 32)) {
  throw new Error("JWT_ACCESS_SECRET must be set and at least 32 characters long");
}

module.exports = env;

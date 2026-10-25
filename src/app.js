
const express = require("express");
const errorHandler = require("./middleware/error.middleware");


const app = express();

// Parse incoming JSON requests
app.use(express.json());

// Health check endpoint
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Qaryati API is running"
  });
});

// Handle routes that do not exist
app.use((req, res, next) => {
  const error = new Error("The requested endpoint does not exist.");
  error.status = 404;
  next(error);
});

// Centralized error handler - must be last
app.use(errorHandler);

module.exports = app;

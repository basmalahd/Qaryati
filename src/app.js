
const express = require("express");

const app = express();

// Middleware to parse JSON requests
app.use(express.json());

// Health Check Endpoint
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Qaryati API is running"
  });
});

module.exports = app;

const express = require("express");
const path = require("path");
const fs = require("fs");
const { setupCors } = require("./services/cors.service");
const errorHandler = require("./modules/apiResponse/errorHandler");
const customResponse = require("./modules/apiResponse/customResponse");
const ApiResponseCode = require("./modules/apiResponse/apiResponseCode");

// Route imports
const authRouter = require("./modules/auth/routers/auth.router");
const userRouter = require("./modules/user/routers/user.router");
const noteRouter = require("./modules/note/routers/note.router");
const postRouter = require("./modules/post/routers/post.router");
const aggregationRouter = require("./modules/aggregation/routers/aggregation.router");

const app = express();

// Apply CORS middleware (Care Guide Interview configuration)
app.use(setupCors());

// Request parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend dashboard if built
const frontendDist = path.resolve(__dirname, "../../interview-font-end/dist");
const localPublic = path.resolve(__dirname, "../public");

if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
}
if (fs.existsSync(localPublic)) {
  app.use(express.static(localPublic));
}

// API Root Information & Health Check
app.get("/health", (req, res) => {
  return customResponse(
    res,
    ApiResponseCode.ALLOWED_HTTP_COD.ok,
    "API is healthy and running.",
    {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      service: "Secure Note-Taking REST API",
      architecture: "Care Guide Interview Modular Domain Architecture (Node.js Express + Mongoose)",
    }
  );
});

// API v1 Welcome & Index route
app.get("/api/v1", (req, res) => {
  return customResponse(
    res,
    ApiResponseCode.ALLOWED_HTTP_COD.ok,
    "Care Guide Interview REST API v1 is active and ready.",
    {
      status: "online",
      version: "1.0.0",
      architecture: "Node.js Express + Mongoose (Care Guide Interview)",
      endpoints: {
        health: "/health",
        auth: ["POST /api/v1/auth/login", "POST /api/v1/auth/register", "GET /api/v1/auth/me"],
        notes: ["GET /api/v1/notes", "POST /api/v1/notes", "PUT /api/v1/notes/:id", "DELETE /api/v1/notes/:id"],
        posts: ["GET /api/v1/posts", "POST /api/v1/posts"],
        admin: ["GET /api/v1/admin/users", "POST /api/v1/admin/users", "PUT /api/v1/admin/users/:id", "DELETE /api/v1/admin/users/:id"],
        aggregations: [
          "GET /api/v1/aggregations/group-by-interests",
          "GET /api/v1/aggregations/user-posts",
          "GET /api/v1/aggregations/indexes"
        ],
      },
    }
  );
});

// Mount Domain Routers (Prefix: /api/v1)
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/admin/users", userRouter);
app.use("/api/v1/notes", noteRouter);
app.use("/api/v1/posts", postRouter);
app.use("/api/v1/aggregations", aggregationRouter);

// SPA fallback for non-API GET requests
app.get("*", (req, res, next) => {
  if (req.originalUrl.startsWith("/api") || req.originalUrl.startsWith("/health")) {
    return next();
  }
  const indexDist = path.resolve(__dirname, "../../interview-font-end/dist/index.html");
  const indexPublic = path.resolve(__dirname, "../public/index.html");
  if (fs.existsSync(indexDist)) {
    return res.sendFile(indexDist);
  }
  if (fs.existsSync(indexPublic)) {
    return res.sendFile(indexPublic);
  }
  next();
});

// Handle 404 Not Found for unregistered API routes
app.use((req, res) => {
  return customResponse(
    res,
    ApiResponseCode.ALLOWED_HTTP_COD.not_found,
    `Resource not found: ${req.method} ${req.originalUrl}`,
    null,
    "ROUTE_NOT_FOUND"
  );
});

// Global Error Handler Middleware (Mirrors TripBackend custom_error_handler)
app.use(errorHandler);

module.exports = app;


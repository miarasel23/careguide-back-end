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
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
}
app.use(express.static(path.join(__dirname, "public")));

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

// Root path serving frontend index.html if available
app.get("/", (req, res, next) => {
  const indexHtml = path.resolve(__dirname, "../../interview-font-end/dist/index.html");
  if (fs.existsSync(indexHtml)) {
    return res.sendFile(indexHtml);
  }
  next();
});

// Mount Domain Routers (Prefix: /api/v1)
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/admin/users", userRouter);
app.use("/api/v1/notes", noteRouter);
app.use("/api/v1/posts", postRouter);
app.use("/api/v1/aggregations", aggregationRouter);

// Handle 404 Not Found for unregistered routes
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


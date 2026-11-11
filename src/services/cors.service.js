const cors = require("cors");
const config = require("../core/config");

/**
 * CORS Configuration Service
 * Mirrors TripBackend/services/cors_service.py
 */
function setupCors() {
  return cors({
    origin: (origin, callback) => {
      // Allow all origins (including github.io, localhost, render.com, etc.)
      callback(null, origin || true);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "X-Requested-With",
      "X-Pinggy-No-Screen",
      "x-pinggy-no-screen",
      "x-render-routing",
    ],
    credentials: true,
    optionsSuccessStatus: 204,
  });
}

module.exports = { setupCors };


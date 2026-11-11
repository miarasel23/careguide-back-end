const cors = require("cors");
const config = require("../core/config");

/**
 * CORS Configuration Service
 * Mirrors TripBackend/services/cors_service.py
 */
function setupCors() {
  const allowedOrigin = config.corsOrigin;

  return cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman) or matching origin
      if (!origin || allowedOrigin === "*" || allowedOrigin.split(",").includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Not allowed by CORS: ${origin}`));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With"],
    credentials: true,
  });
}

module.exports = { setupCors };


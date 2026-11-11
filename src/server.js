const app = require("./app");
const config = require("./core/config");
const { connectDB, disconnectDB } = require("./core/database");
const runSeeder = require("./seeds/seeder");

let server;

async function startServer() {
  try {
    // 1. Establish MongoDB connection
    await connectDB();

    // 2. Synchronize indexes and run seeder if database is fresh
    if (config.env !== "test") {
      await runSeeder();
    }

    // 3. Start Express HTTP Server
    server = app.listen(config.port, "0.0.0.0", () => {
      console.log(`=======================================================`);
      console.log(`  🚀 Secure Note-Taking REST API Server Running`);
      console.log(`  📡 Port: http://localhost:${config.port}`);
      console.log(`  🌍 Environment: ${config.env}`);
      console.log(`  📊 Architecture: Care Guide Interview Modular Pattern (Node.js Express + Mongoose)`);
      console.log(`  ⚡ Aggregations: Scenario 1 & 2 Active`);
      console.log(`  🔍 Indexes: Explicit schema.index defined & verified`);
      console.log(`  🖥️ Frontend UI: http://localhost:${config.port}`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error("[Server] Fatal error during startup:", err);
    process.exit(1);
  }
}

// Handle graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`[Server] Received ${signal}. Gracefully shutting down...`);
  if (server) {
    server.close(async () => {
      console.log("[Server] HTTP server closed.");
      await disconnectDB();
      process.exit(0);
    });
  } else {
    await disconnectDB();
    process.exit(0);
  }
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

if (require.main === module) {
  startServer();
}

module.exports = { startServer, app };


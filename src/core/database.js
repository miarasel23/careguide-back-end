const mongoose = require("mongoose");
const config = require("./config");

let mongodInstance = null;

/**
 * Connect to MongoDB with fallback to MongoDB Memory Server if local daemon is unreachable
 */
async function connectDB(customUri = null) {
  const uriToTry = customUri || config.mongoUri;

  // Set mongoose options
  mongoose.set("strictQuery", true);

  try {
    // Attempt connection to configured URI with short timeout for initial probe
    await mongoose.connect(uriToTry, {
      serverSelectionTimeoutMS: 2500,
    });
    console.log(`[Database] MongoDB connected successfully to: ${mongoose.connection.host}/${mongoose.connection.name}`);
    return mongoose.connection;
  } catch (error) {
    console.warn(`[Database] Could not connect to primary URI (${uriToTry}): ${error.message}`);

    // If already in test or if local daemon not reachable, spin up in-memory MongoDB instance
    console.log("[Database] Starting embedded MongoDB Server (mongodb-memory-server)...");
    try {
      const { MongoMemoryServer } = require("mongodb-memory-server");
      mongodInstance = await MongoMemoryServer.create();
      const memoryUri = mongodInstance.getUri();

      await mongoose.connect(memoryUri, {
        serverSelectionTimeoutMS: 10000,
      });

      console.log(`[Database] Connected to embedded in-memory MongoDB at: ${memoryUri}`);
      return mongoose.connection;
    } catch (fallbackError) {
      console.error("[Database] Failed to initialize embedded MongoDB server:", fallbackError.message);
      throw fallbackError;
    }
  }
}

/**
 * Disconnect from MongoDB and stop in-memory server if running
 */
async function disconnectDB() {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongodInstance) {
      await mongodInstance.stop();
      mongodInstance = null;
    }
    console.log("[Database] Disconnected from MongoDB.");
  } catch (err) {
    console.error("[Database] Error disconnecting:", err.message);
  }
}

module.exports = {
  connectDB,
  disconnectDB,
  getConnection: () => mongoose.connection,
};


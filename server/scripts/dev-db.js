/** Starts a persistent local MongoDB (mongodb-memory-server) on 127.0.0.1:27017; data in server/.mongo-data. */
const fs = require("fs");
const path = require("path");
const { MongoMemoryServer } = require("mongodb-memory-server");

const dbPath = path.join(__dirname, "..", ".mongo-data");

/** Starts the local dev MongoDB instance and returns it (caller stops it). */
async function startDevDb() {
  fs.mkdirSync(dbPath, { recursive: true });
  return MongoMemoryServer.create({
    instance: {
      port: 27017,
      ip: "127.0.0.1",
      dbPath,
      storageEngine: "wiredTiger",
    },
  });
}

module.exports = { startDevDb, dbPath };

if (require.main === module) {
  (async () => {
    const server = await startDevDb();
    console.log(
      `MongoDB running at ${server.getUri()} (data: ${dbPath}). Press Ctrl+C to stop.`,
    );
    const stop = async () => {
      await server.stop({ doCleanup: false });
      process.exit(0);
    };
    process.on("SIGINT", stop);
    process.on("SIGTERM", stop);
  })().catch((err) => {
    console.error("Could not start local MongoDB:", err.message);
    process.exit(1);
  });
}

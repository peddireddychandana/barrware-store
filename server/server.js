const net = require("net");
const env = require("./config/env");
const { connectDb } = require("./config/db");
const createApp = require("./app");
const { runSeed } = require("./seed/seed");

const isPortOpen = (host, port) =>
  new Promise((resolve) => {
    const socket = net.connect({ host, port });
    const finish = (open) => {
      socket.destroy();
      resolve(open);
    };
    socket.setTimeout(1000);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
  });

/** In development without MONGO_URI, start the bundled local MongoDB unless one is already running. */
async function ensureDevDatabase() {
  if (env.isProduction || process.env.MONGO_URI) return null;
  if (await isPortOpen("127.0.0.1", 27017)) {
    console.log("MongoDB already running on 127.0.0.1:27017; using it.");
    return null;
  }
  const { startDevDb } = require("./scripts/dev-db");
  const db = await startDevDb();
  console.log(`Started local MongoDB at ${db.getUri()}`);
  return db;
}

async function main() {
  const devDb = await ensureDevDatabase();
  let connection;
  try {
    connection = await connectDb();
    await connection.db.admin().ping();
    console.log(
      `MongoDB connected: ${connection.host}/${connection.name} (${
        devDb ? "local" : "remote"
      })`,
    );
  } catch (err) {
    if (devDb) await devDb.stop({ doCleanup: false });
    throw new Error(`MongoDB connection failed: ${err.message}`);
  }

  connection.on("disconnected", () =>
    console.warn("MongoDB disconnected; reconnecting..."),
  );
  connection.on("reconnected", () =>
    console.log("MongoDB reconnected"),
  );

  if (!env.isProduction) await runSeed();

  const server = createApp().listen(env.port, () =>
    console.log(
      `API listening on http://localhost:${env.port} (${env.nodeEnv})`,
    ),
  );

  // Release stock held by unpaid UPI orders whose payment window has elapsed.
  const { expirePendingOrders } = require("./services/orderService");
  const sweep = () =>
    expirePendingOrders()
      .then((count) => {
        if (count) console.log(`Auto-cancelled ${count} expired UPI order(s)`);
      })
      .catch((err) => console.warn("UPI expiry sweep failed:", err.message));
  sweep();
  const sweepTimer = setInterval(sweep, 5 * 60 * 1000);
  sweepTimer.unref();

  const shutdown = () =>
    server.close(async () => {
      clearInterval(sweepTimer);
      if (devDb) await devDb.stop({ doCleanup: false });
      process.exit(0);
    });
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("Failed to start server:", err.message);
  process.exit(1);
});

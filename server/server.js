const env = require("./config/env");
const { connectDb } = require("./config/db");
const createApp = require("./app");

async function main() {
  await connectDb();
  const server = createApp().listen(env.port, () =>
    console.log(
      `API listening on http://localhost:${env.port} (${env.nodeEnv})`,
    ),
  );
  const shutdown = () => server.close(() => process.exit(0));
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("Failed to start server:", err.message);
  process.exit(1);
});

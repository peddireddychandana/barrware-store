const { MongoMemoryServer } = require("mongodb-memory-server");

module.exports = async () => {
  const server = await MongoMemoryServer.create();
  process.env.TEST_MONGO_URI = server.getUri();
  globalThis.__MMS__ = server;
};

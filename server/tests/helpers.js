process.env.NODE_ENV = "test";
process.env.CLIENT_URL = "http://localhost:3000";
process.env.ADMIN_EMAIL = "admin@barware.test";
process.env.ADMIN_PASSWORD = "Admin@12345";

const mongoose = require("mongoose");
const request = require("supertest");
const createApp = require("../app");
const { runSeed } = require("../seed/seed");

const app = createApp();
const CUSTOMER = { email: "aarav@example.com", password: "Customer@123" };
const ADMIN = { email: "admin@barware.test", password: "Admin@12345" };

/** Connects to a fresh per-file database on the shared in-memory server and seeds it. */
async function setupDb(name) {
  await mongoose.connect(`${process.env.TEST_MONGO_URI}${name}`);
  await runSeed({ log: () => {} });
}

const teardownDb = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
};

async function loginAs({ email, password }) {
  const agent = request.agent(app);
  const res = await agent.post("/api/auth/login").send({ email, password });
  if (res.status !== 200)
    throw new Error(`login failed: ${res.status} ${JSON.stringify(res.body)}`);
  return agent;
}

const shippingAddress = {
  fullName: "Aarav Mehta",
  email: "aarav@example.com",
  phone: "9876543210",
  line1: "12 MG Road",
  city: "Bengaluru",
  state: "Karnataka",
  pincode: "560001",
};

module.exports = {
  app,
  request,
  setupDb,
  teardownDb,
  loginAs,
  CUSTOMER,
  ADMIN,
  shippingAddress,
  mongoose,
};

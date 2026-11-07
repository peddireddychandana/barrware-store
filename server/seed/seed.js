/** Ensures the store admin account exists. Does not seed any categories or products. */
const mongoose = require("mongoose");
const env = require("../config/env");
const { connectDb } = require("../config/db");
const { User } = require("../models");

async function runSeed({ log = console.log } = {}) {
  const email = env.adminEmail.toLowerCase().trim();
  const existing = await User.findOne({ email });

  if (existing) {
    existing.role = "admin";
    await existing.save();
    log(`Admin already existed; ensured admin role for ${email}.`);
    return { admin: existing };
  }

  const admin = await User.create({
    name: "Store Admin",
    email,
    password: env.adminPassword,
    role: "admin",
  });
  log(`Created admin ${email}. No default products or categories were added.`);
  return { admin };
}

module.exports = { runSeed };

if (require.main === module) {
  (async () => {
    await connectDb();
    await runSeed();
    console.log(`Admin login: ${env.adminEmail} / (ADMIN_PASSWORD from .env)`);
    await mongoose.disconnect();
  })().catch((err) => {
    console.error("Seed failed:", err.message);
    process.exit(1);
  });
}

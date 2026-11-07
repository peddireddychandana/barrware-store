/** Creates (or promotes) the store admin without seeding any categories or products. */
const mongoose = require("mongoose");
const env = require("../config/env");
const { connectDb } = require("../config/db");
const { User } = require("../models");

const argValue = (name) => {
  const index = process.argv.indexOf(name);
  return index !== -1 ? process.argv[index + 1] : undefined;
};

async function run() {
  const email = (argValue("--email") || env.adminEmail).toLowerCase().trim();
  const name = argValue("--name") || "Store Admin";
  const customPassword = argValue("--password");
  const password = customPassword || env.adminPassword;

  await connectDb();

  const existing = await User.findOne({ email });
  if (existing) {
    existing.role = "admin";
    if (customPassword) existing.password = customPassword;
    await existing.save();
    console.log(`Admin already existed; ensured admin role for ${email}.`);
  } else {
    await User.create({ name, email, password, role: "admin" });
    console.log(`Created admin ${email}.`);
  }

  console.log(
    `Admin login: ${email} / ${
      customPassword ? "--password argument" : "ADMIN_PASSWORD from .env"
    }`,
  );
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Create admin failed:", err.message);
  process.exit(1);
});

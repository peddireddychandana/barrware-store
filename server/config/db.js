const mongoose = require("mongoose");

/** Connects mongoose to the given URI (defaults to env config). */
async function connectDb(uri) {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri || require("./env").mongoUri, {
    serverSelectionTimeoutMS: 8000,
  });
  return mongoose.connection;
}

module.exports = { connectDb };

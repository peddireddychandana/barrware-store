const mongoose = require("mongoose");

const uploadSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true, unique: true, index: true },
    contentType: {
      type: String,
      default: "application/octet-stream",
      trim: true,
    },
    size: { type: Number, default: 0, min: 0 },
    data: { type: Buffer, required: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Upload", uploadSchema);

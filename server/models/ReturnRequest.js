const mongoose = require("mongoose");

const returnItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const returnRequestSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    items: { type: [returnItemSchema], validate: (v) => v.length > 0 },
    reason: { type: String, required: true, trim: true, maxlength: 500 },
    status: {
      type: String,
      enum: ["requested", "approved", "rejected", "received", "refunded"],
      default: "requested",
      index: true,
    },
    adminNote: { type: String, trim: true, maxlength: 500, default: "" },
    refundAmount: { type: Number, default: 0, min: 0 },
    resolvedAt: { type: Date },
  },
  { timestamps: true },
);

module.exports = mongoose.model("ReturnRequest", returnRequestSchema);

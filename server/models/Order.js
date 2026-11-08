const mongoose = require("mongoose");
const { buildUpiUri } = require("../utils/upi");

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: { type: String, required: true },
    image: { type: String, default: "" },
    sku: { type: String, default: "" },
    variantId: { type: mongoose.Schema.Types.ObjectId },
    variantSku: { type: String, default: "" },
    variantName: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    kitId: { type: String },
  },
  { _id: false },
);

const addressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true, default: "" },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, match: /^\d{6}$/ },
  },
  { _id: false },
);

const statusEntrySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    at: { type: Date, default: Date.now },
    note: { type: String, default: "" },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    /** SHA-256 of the bearer token emailed to guest customers for order access. */
    guestTokenHash: { type: String, select: false, index: true },
    items: { type: [orderItemSchema], validate: (v) => v.length > 0 },
    shippingAddress: { type: addressSchema, required: true },
    paymentMethod: { type: String, enum: ["COD", "UPI"], default: "COD" },
    paymentStatus: {
      type: String,
      enum: ["not_required", "pending", "paid", "failed"],
      default: "not_required",
      index: true,
    },
    paymentReference: { type: String, trim: true, maxlength: 80, default: "" },
    paymentSubmittedAt: { type: Date },
    paidAt: { type: Date },
    /** Unpaid UPI orders are auto-cancelled and restocked after this time. */
    paymentExpiresAt: { type: Date, index: true },
    idempotencyKey: { type: String, unique: true, sparse: true, select: false },
    summary: {
      subtotal: { type: Number, required: true },
      discount: { type: Number, required: true },
      kitDiscount: { type: Number, required: true },
      couponCode: { type: String, default: "" },
      couponDiscount: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      shipping: { type: Number, required: true },
      total: { type: Number, required: true },
    },
    tracking: {
      carrier: { type: String, trim: true, default: "" },
      number: { type: String, trim: true, default: "" },
      url: { type: String, trim: true, default: "" },
      updatedAt: { type: Date },
    },
    status: {
      type: String,
      enum: [
        "placed",
        "confirmed",
        "packed",
        "shipped",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
      default: "placed",
      index: true,
    },
    statusHistory: { type: [statusEntrySchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_d, ret) => {
        delete ret.__v;
        delete ret.id;
        delete ret.idempotencyKey;
        delete ret.guestTokenHash;
        return ret;
      },
    },
  },
);

/** Payment deep link shown as a QR while a UPI order is unpaid. */
orderSchema.virtual("upiUri").get(function () {
  if (this.paymentMethod !== "UPI" || this.paymentStatus === "paid") return "";
  return buildUpiUri({ amount: this.summary?.total, note: this.orderNumber });
});

orderSchema.virtual("isGuest").get(function () {
  return !this.user;
});

orderSchema.index({ createdAt: -1 });
orderSchema.index({ paymentStatus: 1, paymentExpiresAt: 1 });

module.exports = mongoose.model("Order", orderSchema);

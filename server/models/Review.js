const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, default: "", maxlength: 120 },
    comment: { type: String, trim: true, default: "", maxlength: 2000 },
    verifiedPurchase: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: true },
    isHidden: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_d, ret) => {
        delete ret.__v;
        delete ret.updatedAt;
        return ret;
      },
    },
  },
);

reviewSchema.index({ user: 1, product: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);

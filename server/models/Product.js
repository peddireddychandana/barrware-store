const mongoose = require("mongoose");
const { PRODUCT_TYPES } = require("../config/store");

const keyValue = new mongoose.Schema(
  {
    key: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false },
);

const faq = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true, maxlength: 200 },
    answer: { type: String, required: true, trim: true, maxlength: 1200 },
  },
  { _id: false },
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 140 },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    shortDescription: { type: String, trim: true, default: "", maxlength: 300 },
    description: { type: String, trim: true, default: "", maxlength: 4000 },
    metaTitle: { type: String, trim: true, default: "", maxlength: 65 },
    metaDescription: { type: String, trim: true, default: "", maxlength: 160 },
    imageAltText: { type: String, trim: true, default: "", maxlength: 200 },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, required: true, min: 0 },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    productType: {
      type: String,
      required: true,
      enum: Object.keys(PRODUCT_TYPES),
      index: true,
    },
    material: { type: String, trim: true, default: "" },
    colour: { type: String, trim: true, default: "" },
    size: { type: String, trim: true, default: "" },
    capacity: { type: String, trim: true, default: "" },
    weight: { type: String, trim: true, default: "" },
    specifications: { type: [keyValue], default: [] },
    features: { type: [String], default: [] },
    highlights: { type: [keyValue], default: [] },
    faqs: { type: [faq], default: [] },
    images: { type: [String], default: [] },
    stock: { type: Number, required: true, min: 0, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0, min: 0 },
    featured: { type: Boolean, default: false, index: true },
    bestSeller: { type: Boolean, default: false, index: true },
    premium: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true, index: true },
    sold: { type: Number, default: 0, min: 0, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_d, ret) => {
        delete ret.id;
        delete ret.__v;
        delete ret.updatedAt;
        delete ret.sold;
        return ret;
      },
    },
  },
);

productSchema.virtual("discountPercent").get(function discountPercent() {
  if (!this.originalPrice || this.originalPrice <= this.price) return 0;
  return Math.round(
    ((this.originalPrice - this.price) / this.originalPrice) * 100,
  );
});

productSchema.pre("validate", function checkPrices() {
  if (this.originalPrice < this.price) this.originalPrice = this.price;
});

productSchema.index(
  {
    name: "text",
    shortDescription: "text",
    description: "text",
    material: "text",
  },
  { weights: { name: 10, material: 3, shortDescription: 2, description: 1 } },
);
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Product", productSchema);

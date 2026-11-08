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
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
  },
  { _id: false },
);
const variantSchema = new mongoose.Schema(
  {
    variantName: { type: String, trim: true, default: "" },
    colorName: { type: String, trim: true, default: "" },
    colorHex: { type: String, trim: true, default: "" },
    finishType: { type: String, trim: true, default: "" },
    sku: { type: String, required: true, uppercase: true, trim: true },
    barcode: { type: String, trim: true, default: "" },
    sellingPrice: { type: Number, required: true, min: 0, default: 0 },
    compareAtPrice: { type: Number, min: 0, default: 0 },
    costPerItem: { type: Number, min: 0, default: 0 },
    stock: { type: Number, min: 0, default: 0 },
    lowStockThreshold: { type: Number, min: 0, default: 10 },
    images: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { _id: true },
);
const mediaAssetSchema = new mongoose.Schema(
  {
    originalName: { type: String, trim: true, default: "" },
    webpUrl: { type: String, trim: true, default: "" },
    thumbnailUrl: { type: String, trim: true, default: "" },
    mediumUrl: { type: String, trim: true, default: "" },
    largeUrl: { type: String, trim: true, default: "" },
    altText: { type: String, trim: true, default: "" },
    assetType: {
      type: String,
      enum: [
        "hero",
        "lifestyle",
        "dimension-chart",
        "gift-box",
        "gallery",
      ],
      default: "gallery",
    },
    order: { type: Number, default: 0 },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    fileSize: { type: Number, default: 0 },
  },
  { _id: true },
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    title: { type: String, trim: true, default: "" },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    subtitle: { type: String, trim: true, default: "" },
    brand: { type: String, trim: true, default: "" },
    vendor: { type: String, trim: true, default: "" },
    sku: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    shortDescription: { type: String, trim: true, default: "" },
    description: { type: String, default: "" },
    metaTitle: { type: String, trim: true, default: "" },
    metaDescription: { type: String, trim: true, default: "" },
    imageAltText: { type: String, trim: true, default: "" },
    price: { type: Number, required: true, min: 0, default: 0 },
    originalPrice: { type: Number, required: true, min: 0, default: 0 },
    costPerItem: { type: Number, min: 0, default: 0 },
    gstRate: { type: Number, min: 0, default: 18 },
    taxInclusive: { type: Boolean, default: true },
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
    keyFeatures: { type: [String], default: [] },
    highlights: { type: [keyValue], default: [] },
    faqs: { type: [faq], default: [] },
    images: { type: [String], default: [] },
    mediaAssets: { type: [mediaAssetSchema], default: [] },
    collections: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    variantsEnabled: { type: Boolean, default: false },
    variants: { type: [variantSchema], default: [] },

    relatedProducts: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    ],

    salesChannels: { type: [String], default: ["online"] },
    status: {
      type: String,
      enum: ["draft", "active", "archived"],
      default: "active",
      index: true,
    },
    publishedAt: { type: Date },

    giftPackaging: {
      enabled: { type: Boolean, default: false },
      eligible: { type: Boolean, default: false },
      description: { type: String, trim: true, default: "" },
      giftCard: { type: Boolean, default: false },
      additionalInfo: { type: String, trim: true, default: "" },
    },

    seo: {
      metaTitle: { type: String, trim: true, default: "" },
      metaDescription: { type: String, trim: true, default: "" },
      slug: { type: String, trim: true, default: "" },
    },
    barcode: { type: String, trim: true, default: "" },
    lowStockThreshold: { type: Number, min: 0, default: 10 },
    packageWeight: { type: Number, min: 0, default: 0 },
    dimensions: {
      length: { type: Number, min: 0, default: 0 },
      width: { type: Number, min: 0, default: 0 },
      height: { type: Number, min: 0, default: 0 },
    },
    fragile: { type: Boolean, default: false },
    printLabelWarning: { type: Boolean, default: false },

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
productSchema.virtual("inventoryStatus").get(function inventoryStatus() {
  const threshold = Number.isFinite(this.lowStockThreshold)
    ? this.lowStockThreshold
    : 10;
  if (this.stock <= 0) return "out_of_stock";
  if (this.stock <= threshold) return "low_stock";
  return "in_stock";
});

productSchema.pre("validate", function checkPrices() {
  if (this.originalPrice < this.price) this.originalPrice = this.price;
});
productSchema.pre("save", function syncTitle() {
  if (!this.title && this.name) this.title = this.name;
  if (this.title && !this.name) this.name = this.title;
});

productSchema.index(
  {
    name: "text",
    shortDescription: "text",
    description: "text",
    material: "text",
    brand: "text",
    tags: "text",
  },
  {
    weights: {
      name: 10,
      brand: 4,
      material: 3,
      shortDescription: 2,
      description: 1,
    },
  },
);
productSchema.index({ "variants.sku": 1 }, { unique: true, sparse: true });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Product", productSchema);

const mongoose = require("mongoose");

const faq = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true, maxlength: 200 },
    answer: { type: String, required: true, trim: true, maxlength: 1200 },
  },
  { _id: false },
);

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 80,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: { type: String, trim: true, default: "", maxlength: 600 },
    metaTitle: { type: String, trim: true, default: "", maxlength: 65 },
    metaDescription: { type: String, trim: true, default: "", maxlength: 160 },
    imageAltText: { type: String, trim: true, default: "", maxlength: 200 },
    seoContent: { type: String, trim: true, default: "", maxlength: 5000 },
    faqs: { type: [faq], default: [] },
    image: { type: String, trim: true, default: "" },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_d, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  },
);

module.exports = mongoose.model("Category", categorySchema);

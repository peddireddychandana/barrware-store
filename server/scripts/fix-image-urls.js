/**
 * Rewrites stored image URLs that point at a local dev server (e.g.
 * http://localhost:5000/uploads/...) to the public API base URL.
 *
 * Usage:
 *   IMAGE_BASE_URL=https://barware-store-server.onrender.com node scripts/fix-image-urls.js
 */
const mongoose = require("mongoose");
const { connectDb } = require("../config/db");
const { Product, Category, Order } = require("../models");

const LOCAL_UPLOAD = /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?\/uploads\//i;
const RELATIVE_UPLOAD = /^\/uploads\//i;

function makeRewriter(base) {
  return (url) => {
    if (typeof url !== "string" || !url) return url;
    if (LOCAL_UPLOAD.test(url)) return url.replace(LOCAL_UPLOAD, `${base}/uploads/`);
    if (RELATIVE_UPLOAD.test(url)) return `${base}${url}`;
    return url;
  };
}

async function main() {
  const base = (process.env.IMAGE_BASE_URL || process.argv[2] || "").replace(/\/+$/, "");
  if (!base) {
    throw new Error(
      "Provide the public API base URL via IMAGE_BASE_URL (e.g. https://barware-store-server.onrender.com)",
    );
  }
  const rewrite = makeRewriter(base);

  await connectDb();
  console.log(`Connected. Rewriting localhost/relative upload URLs -> ${base}`);

  const products = await Product.find({ images: { $exists: true, $ne: [] } });
  let productCount = 0;
  for (const product of products) {
    const images = (product.images || []).map(rewrite);
    if (images.some((img, i) => img !== product.images[i])) {
      product.images = images;
      await product.save();
      productCount += 1;
    }
  }
  console.log(`Products updated: ${productCount}`);

  const categories = await Category.find({ image: { $ne: "" } });
  let categoryCount = 0;
  for (const category of categories) {
    const image = rewrite(category.image);
    if (image !== category.image) {
      category.image = image;
      await category.save();
      categoryCount += 1;
    }
  }
  console.log(`Categories updated: ${categoryCount}`);

  const orders = await Order.find({ "items.image": { $exists: true, $ne: "" } });
  let orderCount = 0;
  for (const order of orders) {
    let changed = false;
    for (const item of order.items || []) {
      const image = rewrite(item.image);
      if (image !== item.image) {
        item.image = image;
        changed = true;
      }
    }
    if (changed) {
      order.markModified("items");
      await order.save();
      orderCount += 1;
    }
  }
  console.log(`Orders updated: ${orderCount}`);

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((err) => {
  console.error("Fix failed:", err.message);
  process.exit(1);
});

const mongoose = require("mongoose");
const Review = require("../models/Review");
const Product = require("../models/Product");

/** Recomputes a product's rating (1 decimal) and numReviews from its reviews. */
async function recalculateProductRating(productId) {
  const [agg] = await Review.aggregate([
    {
      $match: {
        product: new mongoose.Types.ObjectId(String(productId)),
        isApproved: true,
        isHidden: false,
      },
    },
    {
      $group: { _id: "$product", avg: { $avg: "$rating" }, count: { $sum: 1 } },
    },
  ]);
  await Product.updateOne(
    { _id: productId },
    {
      rating: agg ? Math.round(agg.avg * 10) / 10 : 0,
      numReviews: agg ? agg.count : 0,
    },
  );
}

module.exports = { recalculateProductRating };

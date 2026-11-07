const Review = require("../models/Review");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Subscriber = require("../models/Subscriber");
const AppError = require("../utils/AppError");
const { sendSuccess, sendList, parsePagination } = require("../utils/response");
const { recalculateProductRating } = require("../services/reviewService");
const { storeImages } = require("../services/uploadService");

exports.createReview = async (req, res) => {
  const { productId, rating, title, comment } = req.body;
  if (!(await Product.exists({ _id: productId, isActive: true })))
    throw new AppError("Product not found", 404);
  if (await Review.exists({ user: req.user._id, product: productId }))
    throw new AppError("You have already reviewed this product", 409);
  const verifiedPurchase = Boolean(
    await Order.exists({
      user: req.user._id,
      status: "delivered",
      "items.product": productId,
    }),
  );
  const review = await Review.create({
    user: req.user._id,
    product: productId,
    rating,
    title,
    comment,
    verifiedPurchase,
  });
  await recalculateProductRating(productId);
  await review.populate("user", "name");
  sendSuccess(res, review, { status: 201, message: "Review submitted" });
};

/** Latest reviews across products, 4-5 star reviews first (newest within each group). */
exports.latestReviews = async (req, res) => {
  const { limit } = parsePagination(req.query, {
    defaultLimit: 6,
    maxLimit: 20,
  });
  const populate = [
    { path: "user", select: "name" },
    { path: "product", select: "name slug images" },
  ];
  const visible = { isApproved: true, isHidden: false };
  let reviews = await Review.find({ ...visible, rating: { $gte: 4 } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate(populate);
  if (reviews.length < limit) {
    const rest = await Review.find({ ...visible, rating: { $lt: 4 } })
      .sort({ createdAt: -1 })
      .limit(limit - reviews.length)
      .populate(populate);
    reviews = [...reviews, ...rest];
  }
  const data = reviews
    .filter((r) => r.product && r.user)
    .map((r) => ({
      _id: r._id,
      user: { _id: r.user._id, name: r.user.name },
      product: {
        _id: r.product._id,
        name: r.product.name,
        slug: r.product.slug,
        images: r.product.images.slice(0, 1),
      },
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      createdAt: r.createdAt,
    }));
  sendList(res, data, { page: 1, limit, total: data.length });
};

exports.subscribe = async (req, res) => {
  await Subscriber.updateOne(
    { email: req.body.email },
    { $setOnInsert: { email: req.body.email } },
    { upsert: true },
  );
  sendSuccess(res, null, { message: "Thanks for subscribing!" });
};

exports.upload = async (req, res) =>
  sendSuccess(
    res,
    { urls: await storeImages(req.files, req) },
    { status: 201 },
  );

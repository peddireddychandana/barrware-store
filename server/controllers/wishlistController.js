const Wishlist = require("../models/Wishlist");
const Product = require("../models/Product");
const AppError = require("../utils/AppError");
const { sendSuccess, sendList } = require("../utils/response");

const PRODUCT_FIELDS =
  "name slug images price originalPrice stock isActive category rating numReviews";

async function getOrCreate(userId) {
  return (
    (await Wishlist.findOne({ user: userId })) ||
    Wishlist.create({ user: userId, products: [] })
  );
}

async function view(userId) {
  const list = await Wishlist.findOne({ user: userId }).populate({
    path: "products.product",
    select: PRODUCT_FIELDS,
    populate: { path: "category", select: "name slug" },
  });
  if (!list) return [];
  return list.products
    .filter((entry) => entry.product && entry.product.isActive)
    .map((entry) => ({ ...entry.product.toJSON(), addedAt: entry.addedAt }));
}

exports.get = async (req, res) => {
  const products = await view(req.user._id);
  sendList(res, products, { page: 1, limit: 100, total: products.length });
};

exports.toggle = async (req, res) => {
  if (!(await Product.exists({ _id: req.body.productId, isActive: true })))
    throw new AppError("Product not found", 404);
  const list = await getOrCreate(req.user._id);
  const index = list.products.findIndex(
    (entry) => String(entry.product) === String(req.body.productId),
  );
  let added;
  if (index >= 0) {
    list.products.splice(index, 1);
    added = false;
  } else {
    list.products.push({ product: req.body.productId });
    added = true;
  }
  await list.save();
  sendSuccess(
    res,
    {
      added,
      productIds: list.products.map((entry) => String(entry.product)),
    },
    { message: added ? "Added to wishlist" : "Removed from wishlist" },
  );
};

exports.remove = async (req, res) => {
  const list = await getOrCreate(req.user._id);
  list.products = list.products.filter(
    (entry) => String(entry.product) !== String(req.params.productId),
  );
  await list.save();
  sendSuccess(res, { productIds: list.products.map((e) => String(e.product)) });
};

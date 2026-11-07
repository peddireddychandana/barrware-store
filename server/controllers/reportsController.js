const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");
const Subscriber = require("../models/Subscriber");
const Review = require("../models/Review");
const AppError = require("../utils/AppError");
const { sendCsv } = require("../utils/csv");
const { sendSuccess, sendList, parsePagination } = require("../utils/response");
const { recalculateProductRating } = require("../services/reviewService");

const rangeFilter = (query) => {
  const filter = {};
  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = new Date(query.from);
    if (query.to) filter.createdAt.$lte = new Date(query.to);
  }
  if (typeof query.status === "string" && query.status)
    filter.status = query.status;
  return filter;
};

exports.sales = async (req, res) => {
  const filter = rangeFilter(req.query);
  const deliveredFilter = { ...filter, status: "delivered" };
  const [totalOrders, byStatus, revenue, topProducts, daily] = await Promise.all([
    Order.countDocuments(filter),
    Order.aggregate([
      { $match: filter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Order.aggregate([
      { $match: deliveredFilter },
      {
        $group: {
          _id: null,
          total: { $sum: "$summary.total" },
          tax: { $sum: "$summary.tax" },
          discount: { $sum: "$summary.discount" },
          couponDiscount: { $sum: "$summary.couponDiscount" },
        },
      },
    ]),
    Order.aggregate([
      { $match: filter },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          name: { $first: "$items.name" },
          units: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]),
    Order.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          orders: { $sum: 1 },
          revenue: { $sum: "$summary.total" },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  sendSuccess(res, {
    totalOrders,
    byStatus: byStatus.map((row) => ({ status: row._id, count: row.count })),
    revenue: revenue[0] || {
      total: 0,
      tax: 0,
      discount: 0,
      couponDiscount: 0,
    },
    topProducts,
    daily: daily.map((row) => ({
      date: row._id,
      orders: row.orders,
      revenue: row.revenue,
    })),
  });
};

exports.exportOrders = async (req, res) => {
  const orders = await Order.find(rangeFilter(req.query))
    .sort({ createdAt: -1 })
    .limit(10000)
    .populate("user", "name email");
  sendCsv(res, "orders.csv", [
    [
      "Order Number",
      "Date",
      "Customer",
      "Email",
      "Phone",
      "Status",
      "Payment",
      "Payment Status",
      "Subtotal",
      "Discount",
      "Coupon",
      "Coupon Discount",
      "GST",
      "Shipping",
      "Total",
      "City",
      "State",
      "Pincode",
      "Carrier",
      "Tracking Number",
    ],
    ...orders.map((order) => [
      order.orderNumber,
      order.createdAt.toISOString(),
      order.shippingAddress.fullName,
      order.shippingAddress.email,
      order.shippingAddress.phone,
      order.status,
      order.paymentMethod,
      order.paymentStatus,
      order.summary.subtotal,
      order.summary.discount,
      order.summary.couponCode,
      order.summary.couponDiscount,
      order.summary.tax,
      order.summary.shipping,
      order.summary.total,
      order.shippingAddress.city,
      order.shippingAddress.state,
      order.shippingAddress.pincode,
      order.tracking?.carrier || "",
      order.tracking?.number || "",
    ]),
  ]);
};

exports.exportCustomers = async (_req, res) => {
  const customers = await User.find({ role: "customer" }).sort({
    createdAt: -1,
  });
  sendCsv(res, "customers.csv", [
    ["Name", "Email", "Phone", "City", "State", "Joined"],
    ...customers.map((user) => [
      user.name,
      user.email,
      user.phone,
      user.address?.city || "",
      user.address?.state || "",
      user.createdAt.toISOString(),
    ]),
  ]);
};

exports.subscribers = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, {
    defaultLimit: 50,
    maxLimit: 200,
  });
  const [data, total] = await Promise.all([
    Subscriber.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    Subscriber.countDocuments(),
  ]);
  sendList(res, data, { page, limit, total });
};

exports.exportSubscribers = async (_req, res) => {
  const subscribers = await Subscriber.find().sort({ createdAt: -1 });
  sendCsv(res, "subscribers.csv", [
    ["Email", "Subscribed At"],
    ...subscribers.map((row) => [row.email, row.createdAt.toISOString()]),
  ]);
};

exports.customerDetail = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError("Customer not found", 404);
  const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 });
  const spent = orders
    .filter((order) => order.status !== "cancelled")
    .reduce((sum, order) => sum + order.summary.total, 0);
  const products = new Set(
    orders.flatMap((order) => order.items.map((item) => String(item.product))),
  );
  sendSuccess(res, {
    user,
    stats: {
      orderCount: orders.length,
      totalSpent: Math.round(spent * 100) / 100,
      productsPurchased: products.size,
    },
    orders,
  });
};

exports.reviews = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, {
    defaultLimit: 20,
    maxLimit: 100,
  });
  const filter = {};
  if (req.query.hidden === "true") filter.isHidden = true;
  if (req.query.product) filter.product = req.query.product;
  const [data, total] = await Promise.all([
    Review.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "name email")
      .populate("product", "name slug"),
    Review.countDocuments(filter),
  ]);
  sendList(res, data, { page, limit, total });
};

exports.moderateReview = async (req, res) => {
  const review = await Review.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!review) throw new AppError("Review not found", 404);
  await recalculateProductRating(review.product);
  sendSuccess(res, review, { message: "Review updated" });
};

exports.removeReview = async (req, res) => {
  const review = await Review.findByIdAndDelete(req.params.id);
  if (!review) throw new AppError("Review not found", 404);
  await recalculateProductRating(review.product);
  sendSuccess(res, null, { message: "Review deleted" });
};

exports.productCatalogue = async (_req, res) => {
  const products = await Product.find()
    .sort({ createdAt: -1 })
    .populate("category", "name");
  sendCsv(res, "products.csv", [
    [
      "Name",
      "SKU",
      "Category",
      "Price",
      "Original Price",
      "Stock",
      "Sold",
      "Active",
    ],
    ...products.map((product) => [
      product.name,
      product.sku,
      product.category?.name || "",
      product.price,
      product.originalPrice,
      product.stock,
      product.sold || 0,
      product.isActive,
    ]),
  ]);
};

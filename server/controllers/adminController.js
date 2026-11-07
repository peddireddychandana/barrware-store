const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const orderService = require("../services/orderService");
const { LOW_STOCK_THRESHOLD, ORDER_FLOW } = require("../config/store");
const { sendSuccess, sendList, parsePagination } = require("../utils/response");

/**
 * Revenue rule: Cash on Delivery is collected on delivery, so totalRevenue sums summary.total of
 * orders with status "delivered". Open (non-cancelled, undelivered) orders are reported as pendingRevenue.
 */
exports.dashboard = async (_req, res) => {
  const openStatuses = ORDER_FLOW.filter((s) => s !== "delivered");
  const [
    revenue,
    pending,
    totalOrders,
    totalCustomers,
    totalProducts,
    lowStockProducts,
    recentOrders,
  ] = await Promise.all([
    Order.aggregate([
      { $match: { status: "delivered" } },
      { $group: { _id: null, total: { $sum: "$summary.total" } } },
    ]),
    Order.aggregate([
      { $match: { status: { $in: openStatuses } } },
      { $group: { _id: null, total: { $sum: "$summary.total" } } },
    ]),
    Order.countDocuments(),
    User.countDocuments({ role: "customer" }),
    Product.countDocuments(),
    Product.find({ stock: { $lte: LOW_STOCK_THRESHOLD } })
      .populate("category", "name slug")
      .sort({ stock: 1 }),
    Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "name email"),
  ]);
  sendSuccess(res, {
    totalRevenue: revenue[0]?.total || 0,
    pendingRevenue: pending[0]?.total || 0,
    totalOrders,
    totalCustomers,
    totalProducts,
    lowStockProducts,
    recentOrders,
  });
};

exports.orders = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, {
    defaultLimit: 20,
    maxLimit: 100,
  });
  const filter =
    typeof req.query.status === "string" && req.query.status
      ? { status: req.query.status }
      : {};
  const [data, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "name email phone"),
    Order.countDocuments(filter),
  ]);
  sendList(res, data, { page, limit, total });
};

exports.updateOrderStatus = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    throw new AppError("Order not found", 404);
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError("Order not found", 404);
  const updated = await orderService.adminSetStatus(
    order,
    req.body.status,
    req.body.note,
    req.body.tracking,
  );
  sendSuccess(res, updated, { message: `Order marked ${updated.status}` });
};

exports.updateTracking = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    throw new AppError("Order not found", 404);
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError("Order not found", 404);
  const updated = await orderService.setTracking(order, req.body);
  sendSuccess(res, updated, { message: "Tracking details saved" });
};

exports.updatePaymentStatus = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    throw new AppError("Order not found", 404);
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError("Order not found", 404);
  const updated = await orderService.adminSetPaymentStatus(
    order,
    req.body.status,
    req.body.note,
  );
  sendSuccess(res, updated, {
    message: `Payment marked ${req.body.status}`,
  });
};

exports.customers = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, {
    defaultLimit: 20,
    maxLimit: 100,
  });
  const [rows, total] = await Promise.all([
    User.aggregate([
      { $match: { role: "customer" } },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "orders",
          localField: "_id",
          foreignField: "user",
          as: "orders",
        },
      },
      {
        $project: {
          name: 1,
          email: 1,
          role: 1,
          phone: 1,
          address: 1,
          createdAt: 1,
          orderCount: { $size: "$orders" },
          totalSpent: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$orders",
                    cond: { $ne: ["$$this.status", "cancelled"] },
                  },
                },
                in: "$$this.summary.total",
              },
            },
          },
        },
      },
    ]),
    User.countDocuments({ role: "customer" }),
  ]);
  sendList(res, rows, { page, limit, total });
};

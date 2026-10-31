const mongoose = require("mongoose");
const Order = require("../models/Order");
const AppError = require("../utils/AppError");
const orderService = require("../services/orderService");
const { sendSuccess, sendList, parsePagination } = require("../utils/response");

async function loadOwnedOrder(req, { allowAdmin = false } = {}) {
  if (!mongoose.isValidObjectId(req.params.id))
    throw new AppError("Order not found", 404);
  const order = await Order.findById(req.params.id);
  const isOwner = order && String(order.user) === String(req.user._id);
  if (!order || !(isOwner || (allowAdmin && req.user.role === "admin")))
    throw new AppError("Order not found", 404);
  return order;
}

exports.create = async (req, res) => {
  const order = await orderService.placeOrder(
    req.user,
    req.body.shippingAddress,
  );
  sendSuccess(res, order, {
    status: 201,
    message: "Order placed successfully",
  });
};

exports.myOrders = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, {
    defaultLimit: 10,
    maxLimit: 50,
  });
  const [data, total] = await Promise.all([
    Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments({ user: req.user._id }),
  ]);
  sendList(res, data, { page, limit, total });
};

exports.getOne = async (req, res) =>
  sendSuccess(res, await loadOwnedOrder(req, { allowAdmin: true }));

exports.cancel = async (req, res) => {
  const order = await loadOwnedOrder(req);
  sendSuccess(res, await orderService.cancelByCustomer(order), {
    message: "Order cancelled",
  });
};

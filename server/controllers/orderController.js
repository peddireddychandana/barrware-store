const mongoose = require("mongoose");
const Order = require("../models/Order");
const AppError = require("../utils/AppError");
const orderService = require("../services/orderService");
const { sendSuccess, sendList, parsePagination } = require("../utils/response");

/** Loads an order the caller may see: owner, admin, or guest holding the emailed token. */
async function loadAccessibleOrder(req, { allowAdmin = false } = {}) {
  if (!mongoose.isValidObjectId(req.params.id))
    throw new AppError("Order not found", 404);
  const order = await Order.findById(req.params.id).select(
    "+guestTokenHash +idempotencyKey",
  );
  if (!order) throw new AppError("Order not found", 404);

  const isOwner = req.user && String(order.user) === String(req.user._id);
  const isAdmin = req.user && allowAdmin && req.user.role === "admin";
  const token = req.query.token || req.get("x-order-token");
  const isGuest =
    !order.user &&
    token &&
    order.guestTokenHash &&
    order.guestTokenHash === orderService.hashToken(token);

  if (!isOwner && !isAdmin && !isGuest) throw new AppError("Order not found", 404);
  return order;
}

exports.create = async (req, res) => {
  const { order, guestToken, existing } = await orderService.placeOrder(
    req.user,
    req.body.shippingAddress,
    req.body.paymentMethod,
    {
      items: req.body.items,
      couponCode: req.body.couponCode,
      idempotencyKey: req.get("Idempotency-Key"),
    },
  );
  const data = order.toJSON();
  if (guestToken) data.guestToken = guestToken;
  sendSuccess(res, data, {
    status: existing ? 200 : 201,
    message: existing ? "Order already placed" : "Order placed successfully",
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
  sendSuccess(res, await loadAccessibleOrder(req, { allowAdmin: true }));

exports.track = async (req, res) => {
  const order = await Order.findOne({
    orderNumber: req.body.orderNumber.trim().toUpperCase(),
    "shippingAddress.email": req.body.email.trim().toLowerCase(),
  });
  if (!order)
    throw new AppError(
      "No order found for that order number and email address",
      404,
    );
  sendSuccess(res, order);
};

exports.cancel = async (req, res) => {
  const order = await loadAccessibleOrder(req);
  sendSuccess(res, await orderService.cancelByCustomer(order), {
    message: "Order cancelled",
  });
};

exports.submitPayment = async (req, res) => {
  const order = await loadAccessibleOrder(req);
  const updated = await orderService.submitUpiReference(
    order,
    req.body.reference,
  );
  sendSuccess(res, updated, {
    message: "Payment reference submitted. We will confirm it shortly.",
  });
};

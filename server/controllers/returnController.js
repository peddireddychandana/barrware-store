const mongoose = require("mongoose");
const Order = require("../models/Order");
const ReturnRequest = require("../models/ReturnRequest");
const AppError = require("../utils/AppError");
const { RETURN_WINDOW_DAYS } = require("../config/store");
const { sendSuccess, sendList, parsePagination } = require("../utils/response");

const ACTIVE_STATUSES = ["requested", "approved", "received"];

const deliveredAt = (order) => {
  const entry = [...(order.statusHistory || [])]
    .reverse()
    .find((item) => item.status === "delivered");
  return entry ? entry.at : order.updatedAt;
};

exports.create = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    throw new AppError("Order not found", 404);
  const order = await Order.findOne({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!order) throw new AppError("Order not found", 404);
  if (order.status !== "delivered")
    throw new AppError("Only delivered orders can be returned", 400);

  const deliveredOn = deliveredAt(order);
  const days = (Date.now() - new Date(deliveredOn).getTime()) / 86400000;
  if (days > RETURN_WINDOW_DAYS)
    throw new AppError(
      `Returns are accepted within ${RETURN_WINDOW_DAYS} days of delivery`,
      400,
    );

  if (
    await ReturnRequest.exists({
      order: order._id,
      status: { $in: ACTIVE_STATUSES },
    })
  )
    throw new AppError("A return request is already open for this order", 409);

  const items = req.body.items.map((requested) => {
    const ordered = order.items.find(
      (item) => String(item.product) === String(requested.productId),
    );
    if (!ordered)
      throw new AppError("One of the items is not part of this order", 400);
    if (requested.quantity > ordered.quantity)
      throw new AppError(
        `You can return at most ${ordered.quantity} of ${ordered.name}`,
        400,
      );
    return {
      product: ordered.product,
      name: ordered.name,
      quantity: requested.quantity,
    };
  });

  const request = await ReturnRequest.create({
    order: order._id,
    user: req.user._id,
    items,
    reason: req.body.reason,
  });
  sendSuccess(res, request, {
    status: 201,
    message: "Return request submitted",
  });
};

exports.my = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, {
    defaultLimit: 10,
    maxLimit: 50,
  });
  const [data, total] = await Promise.all([
    ReturnRequest.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("order", "orderNumber summary total status"),
    ReturnRequest.countDocuments({ user: req.user._id }),
  ]);
  sendList(res, data, { page, limit, total });
};

exports.adminList = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, {
    defaultLimit: 20,
    maxLimit: 100,
  });
  const filter =
    typeof req.query.status === "string" && req.query.status
      ? { status: req.query.status }
      : {};
  const [data, total] = await Promise.all([
    ReturnRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("order", "orderNumber summary total status")
      .populate("user", "name email phone"),
    ReturnRequest.countDocuments(filter),
  ]);
  sendList(res, data, { page, limit, total });
};

exports.adminUpdate = async (req, res) => {
  const request = await ReturnRequest.findById(req.params.id).populate(
    "order",
    "summary",
  );
  if (!request) throw new AppError("Return request not found", 404);
  request.status = req.body.status;
  if (req.body.note !== undefined) request.adminNote = req.body.note;
  if (req.body.refundAmount !== undefined)
    request.refundAmount = req.body.refundAmount;
  if (["rejected", "refunded", "received"].includes(request.status))
    request.resolvedAt = new Date();
  if (request.status === "refunded" && !request.refundAmount)
    request.refundAmount = request.order?.summary?.total || 0;
  await request.save();
  sendSuccess(res, request, {
    message: `Return marked ${request.status}`,
  });
};

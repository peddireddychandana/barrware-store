const Coupon = require("../models/Coupon");
const AppError = require("../utils/AppError");
const { sendSuccess, sendList, parsePagination } = require("../utils/response");

const normalizePayload = (body) => {
  const payload = { ...body };
  if (payload.code !== undefined)
    payload.code = String(payload.code).trim().toUpperCase();
  if (payload.type === "percent" && payload.value > 100)
    throw new AppError("Percentage discount cannot exceed 100", 400);
  return payload;
};

exports.adminList = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, {
    defaultLimit: 20,
    maxLimit: 100,
  });
  const [data, total] = await Promise.all([
    Coupon.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    Coupon.countDocuments(),
  ]);
  sendList(res, data, { page, limit, total });
};

exports.create = async (req, res) => {
  const payload = normalizePayload(req.body);
  if (await Coupon.exists({ code: payload.code }))
    throw new AppError("A coupon with this code already exists", 409);
  const coupon = await Coupon.create(payload);
  sendSuccess(res, coupon, { status: 201, message: "Coupon created" });
};

exports.update = async (req, res) => {
  const payload = normalizePayload(req.body);
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true,
  });
  if (!coupon) throw new AppError("Coupon not found", 404);
  sendSuccess(res, coupon, { message: "Coupon updated" });
};

exports.remove = async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) throw new AppError("Coupon not found", 404);
  sendSuccess(res, null, { message: "Coupon deleted" });
};

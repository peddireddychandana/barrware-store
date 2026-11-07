const Inquiry = require("../models/Inquiry");
const Subscriber = require("../models/Subscriber");
const AppError = require("../utils/AppError");
const { sendSuccess, sendList, parsePagination } = require("../utils/response");

exports.create = async (req, res) => {
  const inquiry = await Inquiry.create(req.body);
  sendSuccess(res, inquiry, {
    status: 201,
    message: "Thanks for reaching out. We will reply within one business day.",
  });
};

exports.unsubscribe = async (req, res) => {
  await Subscriber.deleteOne({ email: req.body.email });
  sendSuccess(res, null, { message: "You have been unsubscribed" });
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
    Inquiry.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Inquiry.countDocuments(filter),
  ]);
  sendList(res, data, { page, limit, total });
};

exports.adminUpdate = async (req, res) => {
  const inquiry = await Inquiry.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true },
  );
  if (!inquiry) throw new AppError("Inquiry not found", 404);
  sendSuccess(res, inquiry, { message: `Inquiry marked ${inquiry.status}` });
};

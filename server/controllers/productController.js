const productService = require("../services/productService");
const Review = require("../models/Review");
const { sendSuccess, sendList, parsePagination } = require("../utils/response");

exports.list = async (req, res) => {
  const result = await productService.list(
    req.query,
    parsePagination(req.query),
  );
  sendList(res, result.data, result);
};

exports.filters = async (req, res) =>
  sendSuccess(res, await productService.filterOptions(req.query.category));

exports.getOne = async (req, res) => {
  const product = await productService.findByIdOrSlug(req.params.idOrSlug);
  const relatedProducts = await productService.related(product);
  sendSuccess(res, { ...product.toJSON(), relatedProducts });
};

exports.create = async (req, res) =>
  sendSuccess(res, await productService.create(req.body), {
    status: 201,
    message: "Product created",
  });

exports.update = async (req, res) =>
  sendSuccess(res, await productService.update(req.params.id, req.body), {
    message: "Product updated",
  });

exports.remove = async (req, res) => {
  await productService.remove(req.params.id);
  sendSuccess(res, null, { message: "Product deleted" });
};

exports.reviews = async (req, res) => {
  const product = await productService.findByIdOrSlug(req.params.idOrSlug, {
    includeInactive: true,
  });
  const { page, limit, skip } = parsePagination(req.query, {
    defaultLimit: 10,
    maxLimit: 50,
  });
  const filter = {
    product: product._id,
    isApproved: true,
    isHidden: false,
  };
  const [data, total] = await Promise.all([
    Review.find(filter)
      .populate("user", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments(filter),
  ]);
  sendList(res, data, { page, limit, total });
};

exports.adminList = async (req, res) => {
  const result = await productService.list(
    req.query,
    parsePagination(req.query, { defaultLimit: 20, maxLimit: 100 }),
    { includeInactive: true },
  );
  sendList(res, result.data, result);
};

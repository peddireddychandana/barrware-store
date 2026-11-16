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

exports.adminGetOne = async (req, res) => {
  const product = await productService.findByIdOrSlug(req.params.id, {
    includeInactive: true,
  });
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

const SORT_MAP = {
  recent: { createdAt: -1 },
  highest: { rating: -1, createdAt: -1 },
  lowest: { rating: 1, createdAt: -1 },
};

exports.reviews = async (req, res) => {
  const product = await productService.findByIdOrSlug(req.params.idOrSlug, {
    includeInactive: true,
  });
  const { page, limit, skip } = parsePagination(req.query, {
    defaultLimit: 10,
    maxLimit: 50,
  });
  const sort = SORT_MAP[String(req.query.sort)] ?? SORT_MAP.recent;
  const filter = {
    product: product._id,
    isApproved: true,
    isHidden: false,
  };
  const [data, total] = await Promise.all([
    Review.find(filter)
      .populate("user", "name")
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Review.countDocuments(filter),
  ]);
  sendList(res, data, { page, limit, total });
};

/** Average rating, review count and 5→1 star distribution for a product. */
exports.reviewsSummary = async (req, res) => {
  const product = await productService.findByIdOrSlug(req.params.idOrSlug, {
    includeInactive: true,
  });
  const filter = {
    product: product._id,
    isApproved: true,
    isHidden: false,
  };
  const [summary] = await Review.aggregate([
    { $match: filter },
    {
      $group: {
        _id: "$product",
        average: { $avg: "$rating" },
        total: { $sum: 1 },
      },
    },
  ]);
  const distributionRows = await Review.aggregate([
    { $match: filter },
    { $group: { _id: "$rating", count: { $sum: 1 } } },
  ]);
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  for (const row of distributionRows)
    if (row._id >= 1 && row._id <= 5) distribution[row._id] = row.count;
  sendSuccess(res, {
    average: summary ? Math.round(summary.average * 10) / 10 : 0,
    total: summary ? summary.total : 0,
    distribution,
  });
};

exports.adminList = async (req, res) => {
  const result = await productService.list(
    req.query,
    parsePagination(req.query, { defaultLimit: 20, maxLimit: 100 }),
    { includeInactive: true },
  );
  sendList(res, result.data, result);
};

exports.preview = async (req, res) =>
  sendSuccess(res, await productService.preview(req.params.id));

exports.publish = async (req, res) =>
  sendSuccess(res, await productService.publish(req.params.id), {
    message: "Product published",
  });

exports.draft = async (req, res) =>
  sendSuccess(res, await productService.saveDraft(req.params.id), {
    message: "Draft saved",
  });

exports.addVariant = async (req, res) =>
  sendSuccess(
    res,
    await productService.addVariant(req.params.id, req.body),
    { status: 201, message: "Variant added" },
  );

exports.updateVariant = async (req, res) =>
  sendSuccess(
    res,
    await productService.updateVariant(
      req.params.id,
      req.params.variantId,
      req.body,
    ),
    { message: "Variant updated" },
  );

exports.deleteVariant = async (req, res) =>
  sendSuccess(
    res,
    await productService.deleteVariant(req.params.id, req.params.variantId),
    { message: "Variant deleted" },
  );

exports.addImages = async (req, res) =>
  sendSuccess(
    res,
    await productService.addImages(req.params.id, req.body.assets),
    { status: 201, message: "Images added" },
  );

exports.deleteImage = async (req, res) =>
  sendSuccess(
    res,
    await productService.deleteImage(req.params.id, req.params.imageId),
    { message: "Image deleted" },
  );

exports.reorderImages = async (req, res) =>
  sendSuccess(
    res,
    await productService.reorderImages(req.params.id, req.body.order),
    { message: "Images reordered" },
  );

exports.addRelated = async (req, res) =>
  sendSuccess(
    res,
    await productService.addRelated(req.params.id, req.body.relatedProductId),
    { status: 201, message: "Related product linked" },
  );

exports.removeRelated = async (req, res) =>
  sendSuccess(
    res,
    await productService.removeRelated(
      req.params.id,
      req.params.relatedProductId,
    ),
    { message: "Related product removed" },
  );

exports.slugCheck = async (req, res) =>
  sendSuccess(
    res,
    await productService.slugAvailability(req.query.slug, req.query.excludeId),
  );

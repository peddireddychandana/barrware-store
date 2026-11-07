const Category = require("../models/Category");
const Product = require("../models/Product");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/response");
const { slugify } = require("../utils/slugify");

exports.list = async (_req, res) => {
  const [categories, counts] = await Promise.all([
    Category.find().sort({ name: 1 }),
    Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$category", n: { $sum: 1 } } },
    ]),
  ]);
  const countById = new Map(counts.map((c) => [String(c._id), c.n]));
  sendSuccess(
    res,
    categories.map((c) => ({
      ...c.toJSON(),
      productCount: countById.get(String(c._id)) || 0,
    })),
  );
};

exports.create = async (req, res) => {
  const category = await Category.create({
    ...req.body,
    slug: req.body.slug || slugify(req.body.name),
  });
  sendSuccess(res, category, { status: 201, message: "Category created" });
};

exports.update = async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new AppError("Category not found", 404);
  const patch = { ...req.body };
  if (req.body.slug !== undefined)
    patch.slug = req.body.slug || slugify(req.body.name || category.name);
  category.set(patch);
  await category.save();
  sendSuccess(res, category, { message: "Category updated" });
};

exports.remove = async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new AppError("Category not found", 404);
  const inUse = await Product.countDocuments({ category: category._id });
  if (inUse > 0)
    throw new AppError(
      `Cannot delete a category with ${inUse} product(s); move or delete them first`,
      400,
    );
  await category.deleteOne();
  sendSuccess(res, null, { message: "Category deleted" });
};

const mongoose = require("mongoose");
const Product = require("../models/Product");
const Category = require("../models/Category");
const Review = require("../models/Review");
const AppError = require("../utils/AppError");
const { PRODUCT_TYPES } = require("../config/store");
const { slugify, escapeRegex } = require("../utils/slugify");

const SORTS = {
  price_asc: { price: 1, _id: 1 },
  price_desc: { price: -1, _id: 1 },
  newest: { createdAt: -1, _id: 1 },
  popular: { sold: -1, numReviews: -1, rating: -1, _id: 1 },
};

const str = (v) => (typeof v === "string" ? v.trim() : "");
const flag = (v) => v === "true" || v === "1";

/** Builds a Mongo filter from the public product query params. */
async function buildFilter(query, { includeInactive = false } = {}) {
  const filter = includeInactive ? {} : { isActive: true };

  const search = str(query.search);
  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    const cats = await Category.find({ name: rx }).select("_id");
    const typeSlugs = Object.entries(PRODUCT_TYPES)
      .filter(([slug, name]) => rx.test(name) || rx.test(slug))
      .map(([slug]) => slug);
    filter.$or = [
      { name: rx },
      { material: rx },
      { shortDescription: rx },
      { sku: rx },
      { category: { $in: cats.map((c) => c._id) } },
      { productType: { $in: typeSlugs } },
    ];
  }
  const category = str(query.category);
  if (category) {
    const cat = await Category.findOne({ slug: category });
    filter.category = cat ? cat._id : null;
  }
  if (str(query.productType)) filter.productType = str(query.productType);
  if (str(query.material))
    filter.material = new RegExp(`^${escapeRegex(str(query.material))}$`, "i");
  const min = Number(query.minPrice);
  const max = Number(query.maxPrice);
  if (str(query.minPrice) && Number.isFinite(min))
    filter.price = { ...filter.price, $gte: min };
  if (str(query.maxPrice) && Number.isFinite(max))
    filter.price = { ...filter.price, $lte: max };
  for (const key of ["featured", "bestSeller", "premium"])
    if (flag(query[key])) filter[key] = true;
  return filter;
}

async function list(query, { page, limit, skip }, options) {
  const filter = await buildFilter(query, options);
  const sort = SORTS[query.sort] || SORTS.newest;
  const [data, total] = await Promise.all([
    Product.find(filter)
      .populate("category", "name slug")
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Product.countDocuments(filter),
  ]);
  return { data, total, page, limit };
}

async function filterOptions(categorySlug) {
  const match = { isActive: true };
  if (str(categorySlug)) {
    const cat = await Category.findOne({ slug: str(categorySlug) });
    match.category = cat ? cat._id : null;
  }
  const [materials, types, range] = await Promise.all([
    Product.distinct("material", match),
    Product.aggregate([
      { $match: match },
      { $group: { _id: "$productType", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Product.aggregate([
      { $match: match },
      {
        $group: { _id: null, min: { $min: "$price" }, max: { $max: "$price" } },
      },
    ]),
  ]);
  return {
    materials: materials.filter(Boolean).sort(),
    productTypes: types.map((t) => ({
      slug: t._id,
      name: PRODUCT_TYPES[t._id] || t._id,
      count: t.count,
    })),
    priceRange: range[0]
      ? { min: range[0].min, max: range[0].max }
      : { min: 0, max: 0 },
  };
}

/** Finds a product by ObjectId or slug. */
async function findByIdOrSlug(idOrSlug, { includeInactive = false } = {}) {
  const query =
    mongoose.isValidObjectId(idOrSlug) && String(idOrSlug).length === 24
      ? { _id: idOrSlug }
      : { slug: String(idOrSlug).toLowerCase() };
  if (!includeInactive) query.isActive = true;
  const product = await Product.findOne(query).populate(
    "category",
    "name slug",
  );
  if (!product) throw new AppError("Product not found", 404);
  return product;
}

async function related(product) {
  return Product.find({
    category: product.category._id || product.category,
    _id: { $ne: product._id },
    isActive: true,
  })
    .populate("category", "name slug")
    .sort({ bestSeller: -1, rating: -1, _id: 1 })
    .limit(4);
}

async function resolveCategory(ref) {
  const cat = mongoose.isValidObjectId(ref)
    ? await Category.findById(ref)
    : await Category.findOne({ slug: String(ref).toLowerCase() });
  if (!cat)
    throw new AppError("Category not found", 400, [
      { field: "category", message: "Category not found" },
    ]);
  return cat;
}

function assertType(productType) {
  if (productType && !PRODUCT_TYPES[productType])
    throw new AppError(`Unknown productType: ${productType}`, 400, [
      { field: "productType", message: "Unknown product type" },
    ]);
}

/** Generates a unique SKU like BW-SHK-014 from the product type. */
async function generateSku(productType) {
  const prefix = `BW-${productType
    .replace(/[^a-z]/g, "")
    .slice(0, 3)
    .toUpperCase()}`;
  const count = await Product.countDocuments({
    sku: new RegExp(`^${prefix}-`),
  });
  for (let n = count + 1; ; n += 1) {
    const sku = `${prefix}-${String(n).padStart(3, "0")}`;
    if (!(await Product.exists({ sku }))) return sku;
  }
}

async function create(input) {
  assertType(input.productType);
  const category = await resolveCategory(input.category);
  const slug = input.slug || slugify(input.name);
  const product = await Product.create({
    ...input,
    category: category._id,
    slug,
    sku: input.sku || (await generateSku(input.productType)),
    originalPrice: input.originalPrice ?? input.price,
  });
  return findByIdOrSlug(product._id, { includeInactive: true });
}

async function update(id, input) {
  const product = await Product.findById(id);
  if (!product) throw new AppError("Product not found", 404);
  if (input.productType) assertType(input.productType);
  const patch = { ...input };
  if (input.category)
    patch.category = (await resolveCategory(input.category))._id;
  product.set(patch);
  await product.save();
  return findByIdOrSlug(product._id, { includeInactive: true });
}

async function remove(id) {
  const product = await Product.findByIdAndDelete(id);
  if (!product) throw new AppError("Product not found", 404);
  await Review.deleteMany({ product: product._id });
}

module.exports = {
  list,
  filterOptions,
  findByIdOrSlug,
  related,
  create,
  update,
  remove,
};

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

const SALES_CHANNELS = ["online", "meta", "amazon"];
const ASSET_TYPES = [
  "hero",
  "lifestyle",
  "dimension-chart",
  "gift-box",
  "gallery",
];
const STATUSES = ["draft", "active", "archived"];

const str = (v) => (typeof v === "string" ? v.trim() : "");
const flag = (v) => v === "true" || v === "1";
const num = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};
const uniqueStrings = (list) =>
  [...new Set((Array.isArray(list) ? list : []).map(str).filter(Boolean))];

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
      { title: rx },
      { brand: rx },
      { material: rx },
      { shortDescription: rx },
      { sku: rx },
      { tags: rx },
      { "variants.sku": rx },
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
  if (str(query.brand))
    filter.brand = new RegExp(`^${escapeRegex(str(query.brand))}$`, "i");
  const min = Number(query.minPrice);
  const max = Number(query.maxPrice);
  if (str(query.minPrice) && Number.isFinite(min))
    filter.price = { ...filter.price, $gte: min };
  if (str(query.maxPrice) && Number.isFinite(max))
    filter.price = { ...filter.price, $lte: max };
  if (str(query.status) && includeInactive) filter.status = str(query.status);
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

async function findByIdOrSlug(idOrSlug, { includeInactive = false } = {}) {
  const query =
    mongoose.isValidObjectId(idOrSlug) && String(idOrSlug).length === 24
      ? { _id: idOrSlug }
      : { slug: String(idOrSlug).toLowerCase() };
  if (!includeInactive) query.isActive = true;
  const product = await Product.findOne(query)
    .populate("category", "name slug")
    .populate("relatedProducts", "name slug price originalPrice images stock rating numReviews category");
  if (!product) throw new AppError("Product not found", 404);
  return product;
}

async function related(product) {
  if (product.relatedProducts?.length) {
    const relatedIds = product.relatedProducts
      .map((item) => item?._id || item)
      .filter(Boolean);
    const manual = await Product.find({
      _id: { $in: relatedIds, $ne: product._id },
      isActive: true,
    }).populate("category", "name slug");
    if (manual.length) return manual;
  }
  const categoryId = product.category?._id || product.category;
  return Product.find({
    category: categoryId,
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

function normalizeVariants(list) {
  if (!Array.isArray(list)) return [];
  return list.map((variant) => ({
    ...(mongoose.isValidObjectId(variant._id) ? { _id: variant._id } : {}),
    variantName: str(variant.variantName) || str(variant.colorName),
    colorName: str(variant.colorName),
    colorHex: str(variant.colorHex),
    finishType: str(variant.finishType),
    sku: str(variant.sku).toUpperCase(),
    barcode: str(variant.barcode),
    sellingPrice: num(variant.sellingPrice),
    compareAtPrice: num(variant.compareAtPrice),
    costPerItem: num(variant.costPerItem),
    stock: Math.floor(num(variant.stock)),
    lowStockThreshold: Math.floor(num(variant.lowStockThreshold, 10)),
    images: uniqueStrings(variant.images),
    status: variant.status === "inactive" ? "inactive" : "active",
  }));
}

function normalizeMedia(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((asset) => asset && (asset.webpUrl || asset.url))
    .map((asset, index) => ({
      ...(mongoose.isValidObjectId(asset._id) ? { _id: asset._id } : {}),
      originalName: str(asset.originalName),
      webpUrl: str(asset.webpUrl) || str(asset.url),
      thumbnailUrl: str(asset.thumbnailUrl) || str(asset.webpUrl) || str(asset.url),
      mediumUrl: str(asset.mediumUrl) || str(asset.webpUrl) || str(asset.url),
      largeUrl: str(asset.largeUrl) || str(asset.webpUrl) || str(asset.url),
      altText: str(asset.altText),
      assetType: ASSET_TYPES.includes(asset.assetType)
        ? asset.assetType
        : "gallery",
      order: Number.isFinite(Number(asset.order)) ? Number(asset.order) : index,
      width: num(asset.width),
      height: num(asset.height),
      fileSize: num(asset.fileSize),
    }))
    .sort((a, b) => a.order - b.order)
    .map((asset, index) => ({ ...asset, order: index }));
}

async function assertVariantSkus(variants, productId = null) {
  const skus = variants.map((v) => v.sku).filter(Boolean);
  const duplicate = skus.find((sku, index) => skus.indexOf(sku) !== index);
  if (duplicate)
    throw new AppError(`Duplicate variant SKU: ${duplicate}`, 409, [
      { field: "variants.sku", message: `SKU ${duplicate} is used twice` },
    ]);
  if (!skus.length) return;
  const baseMatch = { sku: { $in: skus } };
  const variantMatch = { "variants.sku": { $in: skus } };
  if (productId) {
    baseMatch._id = { $ne: productId };
    variantMatch._id = { $ne: productId };
  }
  const [baseClash, variantClash] = await Promise.all([
    Product.findOne(baseMatch).select("sku"),
    Product.findOne(variantMatch).select("variants.sku"),
  ]);
  if (baseClash || variantClash) {
    const clash =
      baseClash?.sku ||
      variantClash?.variants?.find((v) => skus.includes(v.sku))?.sku ||
      skus[0];
    throw new AppError(`SKU ${clash} is already in use`, 409, [
      { field: "variants.sku", message: `SKU ${clash} is already in use` },
    ]);
  }
}

function syncVariantBase(product) {
  if (!product.variants?.length) return;
  const usable = product.variants.filter((v) => v.status !== "inactive");
  const list = usable.length ? usable : product.variants;
  const prices = list.map((v) => v.sellingPrice).filter(Number.isFinite);
  if (prices.length) product.price = Math.min(...prices);
  const compare = list
    .map((v) => v.compareAtPrice || 0)
    .filter((v) => v >= product.price);
  product.originalPrice = compare.length
    ? Math.max(product.price, ...compare)
    : product.price;
  product.stock = list.reduce((sum, v) => sum + (v.stock || 0), 0);
  if (!product.colour && list[0]?.colorName) product.colour = list[0].colorName;
}

function syncMediaImages(product) {
  if (!product.mediaAssets?.length) return;
  const sorted = [...product.mediaAssets].sort((a, b) => a.order - b.order);
  product.images = sorted.map((a) => a.webpUrl).filter(Boolean);
}

function buildPatch(input, { isCreate = false } = {}) {
  const patch = {};
  const source = { ...input };

  const name = str(source.name) || str(source.title);
  if (name) {
    patch.name = name;
    patch.title = name;
  }
  if (source.slug !== undefined) patch.slug = str(source.slug).toLowerCase();
  if (source.seo?.slug && source.slug === undefined)
    patch.slug = str(source.seo.slug).toLowerCase();

  for (const field of [
    "subtitle",
    "brand",
    "vendor",
    "shortDescription",
    "metaTitle",
    "metaDescription",
    "imageAltText",
    "material",
    "colour",
    "size",
    "capacity",
    "weight",
    "barcode",
  ]) {
    if (source[field] !== undefined) patch[field] = str(source[field]);
  }
  if (source.description !== undefined)
    patch.description = String(source.description ?? "");

  for (const field of [
    "price",
    "originalPrice",
    "costPerItem",
    "gstRate",
    "lowStockThreshold",
    "packageWeight",
  ]) {
    if (source[field] !== undefined) patch[field] = num(source[field]);
  }
  if (source.stock !== undefined) patch.stock = Math.floor(num(source.stock));
  for (const field of ["taxInclusive", "fragile", "printLabelWarning"])
    if (source[field] !== undefined) patch[field] = Boolean(source[field]);

  if (source.dimensions) {
    patch.dimensions = {
      length: num(source.dimensions.length),
      width: num(source.dimensions.width),
      height: num(source.dimensions.height),
    };
  }

  if (source.features !== undefined)
    patch.features = uniqueStrings(source.features);
  if (source.keyFeatures !== undefined)
    patch.keyFeatures = uniqueStrings(source.keyFeatures);
  if (source.keyFeatures !== undefined && source.features === undefined)
    patch.features = uniqueStrings(source.keyFeatures);
  if (source.tags !== undefined) patch.tags = uniqueStrings(source.tags);
  if (source.collections !== undefined)
    patch.collections = uniqueStrings(source.collections);

  if (source.salesChannels !== undefined)
    patch.salesChannels = uniqueStrings(source.salesChannels).filter((c) =>
      SALES_CHANNELS.includes(c),
    );

  if (source.variants !== undefined) {
    patch.variants = normalizeVariants(source.variants);
    patch.variantsEnabled =
      source.variantsEnabled !== undefined
        ? Boolean(source.variantsEnabled)
        : patch.variants.length > 0;
  } else if (source.variantsEnabled !== undefined) {
    patch.variantsEnabled = Boolean(source.variantsEnabled);
  }

  if (source.mediaAssets !== undefined)
    patch.mediaAssets = normalizeMedia(source.mediaAssets);
  else if (source.images !== undefined && Array.isArray(source.images)) {
    patch.images = uniqueStrings(source.images);
  }

  if (source.relatedProducts !== undefined) {
    const ids = (source.relatedProducts || [])
      .map((item) => item?._id || item)
      .filter((id) => mongoose.isValidObjectId(id))
      .map(String);
    patch.relatedProducts = [...new Set(ids)];
  }

  if (source.giftPackaging) {
    patch.giftPackaging = {
      enabled: Boolean(source.giftPackaging.enabled),
      eligible: Boolean(source.giftPackaging.eligible),
      description: str(source.giftPackaging.description),
      giftCard: Boolean(source.giftPackaging.giftCard),
      additionalInfo: str(source.giftPackaging.additionalInfo),
    };
  }

  const seo = source.seo || {};
  if (
    source.seo !== undefined ||
    source.metaTitle !== undefined ||
    source.metaDescription !== undefined
  ) {
    patch.seo = {
      metaTitle: str(seo.metaTitle ?? source.metaTitle),
      metaDescription: str(seo.metaDescription ?? source.metaDescription),
      slug: str(seo.slug ?? patch.slug ?? ""),
    };
    if (patch.seo.metaTitle) patch.metaTitle = patch.seo.metaTitle;
    if (patch.seo.metaDescription)
      patch.metaDescription = patch.seo.metaDescription;
  }

  if (source.status !== undefined && STATUSES.includes(source.status)) {
    patch.status = source.status;
    patch.isActive = source.status === "active";
  } else if (source.isActive !== undefined) {
    patch.status = source.isActive ? "active" : "draft";
    patch.isActive = Boolean(source.isActive);
  }

  if (isCreate && !patch.status) {
    patch.status = "active";
    patch.isActive = true;
  }

  for (const field of ["featured", "bestSeller", "premium"])
    if (source[field] !== undefined) patch[field] = Boolean(source[field]);

  if (source.productType !== undefined)
    patch.productType = str(source.productType);

  return patch;
}

function finalize(product) {
  if (!product.seo) product.seo = {};
  product.seo.slug = product.slug;
  if (!product.seo.metaTitle && product.metaTitle)
    product.seo.metaTitle = product.metaTitle;
  if (!product.seo.metaDescription && product.metaDescription)
    product.seo.metaDescription = product.metaDescription;
  if (!product.metaTitle && product.seo.metaTitle)
    product.metaTitle = product.seo.metaTitle;
  if (!product.metaDescription && product.seo.metaDescription)
    product.metaDescription = product.seo.metaDescription;
  syncVariantBase(product);
  syncMediaImages(product);
  if (product.status === "active" && !product.publishedAt)
    product.publishedAt = new Date();
  if (product.status !== "active") product.isActive = false;
  else product.isActive = true;
}

async function create(input) {
  assertType(input.productType);
  const category = await resolveCategory(input.category);
  const patch = buildPatch(input, { isCreate: true });
  const slug = patch.slug || slugify(patch.name || "product");
  const variants = patch.variants || [];
  await assertVariantSkus(variants);

  const product = new Product({
    ...patch,
    category: category._id,
    slug,
    sku: str(input.sku).toUpperCase() || (await generateSku(input.productType)),
    price: patch.price ?? 0,
    originalPrice: patch.originalPrice ?? patch.price ?? 0,
    stock: patch.stock ?? 0,
  });
  finalize(product);
  await product.save();
  return findByIdOrSlug(product._id, { includeInactive: true });
}

async function update(id, input) {
  const product = await Product.findById(id);
  if (!product) throw new AppError("Product not found", 404);
  if (input.productType) assertType(input.productType);
  const patch = buildPatch(input);
  if (patch.variants) await assertVariantSkus(patch.variants, product._id);
  if (input.category) patch.category = (await resolveCategory(input.category))._id;
  if (input.slug !== undefined && !str(input.slug))
    patch.slug = slugify(input.name || product.name);
  if (input.sku !== undefined) patch.sku = str(input.sku).toUpperCase();
  product.set(patch);
  if (input.slug !== undefined && !str(input.slug))
    product.slug = slugify(input.name || product.name);
  finalize(product);
  await product.save();
  return findByIdOrSlug(product._id, { includeInactive: true });
}

async function remove(id) {
  const product = await Product.findByIdAndDelete(id);
  if (!product) throw new AppError("Product not found", 404);
  await Review.deleteMany({ product: product._id });
  await Product.updateMany(
    { relatedProducts: product._id },
    { $pull: { relatedProducts: product._id } },
  );
}

async function preview(id) {
  const product = await findByIdOrSlug(id, { includeInactive: true });
  const relatedProducts = await related(product);
  return { ...product.toJSON(), relatedProducts };
}

async function setStatus(id, status) {
  if (!STATUSES.includes(status))
    throw new AppError("Invalid product status", 400);
  const product = await Product.findById(id);
  if (!product) throw new AppError("Product not found", 404);
  if (status === "active") {
    if (!product.images.length && !product.mediaAssets.length)
      throw new AppError("Add at least one product image before publishing", 400);
    if (!product.price && !product.variants.length)
      throw new AppError("Set a selling price before publishing", 400);
    if (product.variantsEnabled) {
      const invalid = product.variants.find((v) => !v.sku);
      if (invalid)
        throw new AppError("Every variant needs a unique SKU before publishing", 400);
    }
  }
  product.status = status;
  product.isActive = status === "active";
  if (status === "active") product.publishedAt = product.publishedAt || new Date();
  finalize(product);
  await product.save();
  return findByIdOrSlug(product._id, { includeInactive: true });
}

async function publish(id) {
  return setStatus(id, "active");
}

async function saveDraft(id) {
  return setStatus(id, "draft");
}

async function addVariant(id, payload) {
  const product = await Product.findById(id);
  if (!product) throw new AppError("Product not found", 404);
  const variant = normalizeVariants([payload])[0];
  await assertVariantSkus([variant], product._id);
  product.variants.push(variant);
  product.variantsEnabled = true;
  finalize(product);
  await product.save();
  return findByIdOrSlug(product._id, { includeInactive: true });
}

async function updateVariant(id, variantId, payload) {
  const product = await Product.findById(id);
  if (!product) throw new AppError("Product not found", 404);
  const variant = product.variants.id(variantId);
  if (!variant) throw new AppError("Variant not found", 404);
  const normalized = normalizeVariants([{ ...variant.toObject(), ...payload }])[0];
  await assertVariantSkus([normalized], product._id);
  variant.set(normalized);
  finalize(product);
  await product.save();
  return findByIdOrSlug(product._id, { includeInactive: true });
}

async function deleteVariant(id, variantId) {
  const product = await Product.findById(id);
  if (!product) throw new AppError("Product not found", 404);
  const variant = product.variants.id(variantId);
  if (!variant) throw new AppError("Variant not found", 404);
  variant.deleteOne();
  if (!product.variants.length) product.variantsEnabled = false;
  finalize(product);
  await product.save();
  return findByIdOrSlug(product._id, { includeInactive: true });
}

async function addImages(id, assets) {
  const product = await Product.findById(id);
  if (!product) throw new AppError("Product not found", 404);
  const normalized = normalizeMedia(assets);
  if (!normalized.length) throw new AppError("No valid image assets", 400);
  const offset = product.mediaAssets.length;
  normalized.forEach((asset, index) => {
    product.mediaAssets.push({ ...asset, order: offset + index });
  });
  finalize(product);
  await product.save();
  return findByIdOrSlug(product._id, { includeInactive: true });
}

async function deleteImage(id, imageId) {
  const product = await Product.findById(id);
  if (!product) throw new AppError("Product not found", 404);
  const asset = product.mediaAssets.id(imageId);
  if (!asset) throw new AppError("Image not found", 404);
  asset.deleteOne();
  product.mediaAssets.forEach((item, index) => {
    item.order = index;
  });
  finalize(product);
  await product.save();
  return findByIdOrSlug(product._id, { includeInactive: true });
}

async function reorderImages(id, orderIds) {
  const product = await Product.findById(id);
  if (!product) throw new AppError("Product not found", 404);
  const order = (orderIds || []).map(String);
  product.mediaAssets.forEach((asset) => {
    const index = order.indexOf(String(asset._id));
    asset.order = index === -1 ? order.length : index;
  });
  product.mediaAssets.sort((a, b) => a.order - b.order);
  product.mediaAssets.forEach((asset, index) => {
    asset.order = index;
  });
  finalize(product);
  await product.save();
  return findByIdOrSlug(product._id, { includeInactive: true });
}

async function addRelated(id, relatedId) {
  const product = await Product.findById(id);
  if (!product) throw new AppError("Product not found", 404);
  if (String(id) === String(relatedId))
    throw new AppError("A product cannot be related to itself", 400);
  if (!(await Product.exists({ _id: relatedId })))
    throw new AppError("Related product not found", 404);
  if (!product.relatedProducts.some((item) => String(item) === String(relatedId)))
    product.relatedProducts.push(relatedId);
  await product.save();
  return findByIdOrSlug(product._id, { includeInactive: true });
}

async function removeRelated(id, relatedId) {
  const product = await Product.findById(id);
  if (!product) throw new AppError("Product not found", 404);
  product.relatedProducts = product.relatedProducts.filter(
    (item) => String(item) !== String(relatedId),
  );
  await product.save();
  return findByIdOrSlug(product._id, { includeInactive: true });
}

async function slugAvailability(slug, excludeId = null) {
  const normalized = slugify(slug);
  if (!normalized) return { slug: normalized, available: false };
  const query = { slug: normalized };
  if (excludeId) query._id = { $ne: excludeId };
  const exists = await Product.exists(query);
  return { slug: normalized, available: !exists };
}

module.exports = {
  list,
  filterOptions,
  findByIdOrSlug,
  related,
  create,
  update,
  remove,
  preview,
  publish,
  saveDraft,
  setStatus,
  addVariant,
  updateVariant,
  deleteVariant,
  addImages,
  deleteImage,
  reorderImages,
  addRelated,
  removeRelated,
  slugAvailability,
};

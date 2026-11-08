const crypto = require("crypto");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const AppError = require("../utils/AppError");
const { MAX_ITEM_QUANTITY } = require("../config/store");
const { computeSummary } = require("./pricing");
const couponService = require("./couponService");

const PRODUCT_POPULATE = {
  path: "items.product",
  populate: { path: "category", select: "name slug" },
};

const getOrCreateCart = async (userId) =>
  (await Cart.findOne({ user: userId })) ||
  Cart.create({ user: userId, items: [] });

function resolveVariant(product, variantId) {
  if (!product?.variants?.length) return null;
  if (variantId) {
    const variant =
      product.variants.id(variantId) ||
      product.variants.find((v) => String(v._id) === String(variantId));
    if (!variant) throw new AppError("Selected variant is not available", 404);
    return variant;
  }
  if (!product.variantsEnabled) return null;
  return (
    product.variants.find((v) => v.status !== "inactive") || product.variants[0]
  );
}

const variantLabel = (product, variant) =>
  variant
    ? `${product.name} (${variant.variantName || variant.colorName || "variant"})`
    : product.name;

const quantityInCart = (cart, productId, variantId) =>
  cart.items
    .filter(
      (i) =>
        String(i.product) === String(productId) &&
        String(i.variantId || "") === String(variantId || ""),
    )
    .reduce((s, i) => s + i.quantity, 0);

async function loadActiveProduct(productId) {
  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) throw new AppError("Product not found", 404);
  return product;
}

function assertStock(product, wantedTotal, variant = null) {
  const available = variant ? variant.stock : product.stock;
  if (wantedTotal > available) {
    const label = variantLabel(product, variant);
    const msg =
      available === 0
        ? `${label} is out of stock`
        : `Only ${available} unit(s) of ${label} available`;
    throw new AppError(msg, 400);
  }
  if (wantedTotal > MAX_ITEM_QUANTITY)
    throw new AppError(`Maximum ${MAX_ITEM_QUANTITY} units per product`, 400);
}

const variantFields = (variant) =>
  variant
    ? {
        variantId: variant._id,
        variantSku: variant.sku,
        variantName: variant.variantName || variant.colorName || "",
      }
    : {};

async function buildCartView(cart) {
  await cart.populate(PRODUCT_POPULATE);
  const live = cart.items.filter((i) => i.product && i.product.isActive);
  if (live.length !== cart.items.length) {
    cart.items = live.map((i) => ({
      product: i.product._id,
      quantity: i.quantity,
      kitId: i.kitId,
      kitSlot: i.kitSlot,
      variantId: i.variantId,
      variantSku: i.variantSku,
      variantName: i.variantName,
    }));
    await cart.save();
    await cart.populate(PRODUCT_POPULATE);
  }
  const items = cart.items.map((i) => {
    const variant = resolveVariant(i.product, i.variantId);
    const item = {
      product: i.product,
      quantity: i.quantity,
      ...(i.kitId ? { kitId: i.kitId } : {}),
    };
    if (i.variantId && variant) {
      item.variantId = String(variant._id);
      item.variantSku = variant.sku;
      item.variantName = variant.variantName || variant.colorName || "";
      item.price = variant.sellingPrice;
      item.originalPrice = variant.compareAtPrice || variant.sellingPrice;
      item.variant = {
        _id: variant._id,
        variantName: variant.variantName,
        colorName: variant.colorName,
        colorHex: variant.colorHex,
        finishType: variant.finishType,
        sku: variant.sku,
        stock: variant.stock,
        images: variant.images,
      };
    }
    return item;
  });

  const base = viewSummary(items);
  let coupon = null;
  if (cart.couponCode) {
    const doc = await couponService.findByCode(cart.couponCode);
    const payable = round2(base.total - base.shipping);
    if (couponService.isValid(doc, payable, cart.user)) {
      coupon = couponService.toDescriptor(doc);
    } else {
      cart.couponCode = "";
      await cart.save();
    }
  }

  return {
    items,
    summary: viewSummary(items, coupon),
    coupon: coupon ? { code: coupon.code, description: "" } : null,
  };
}

const round2 = (n) => Math.round(n * 100) / 100;

const viewSummary = (items, coupon = null) =>
  computeSummary(
    items.map((i) => ({
      price: i.price ?? i.product.price,
      originalPrice: i.originalPrice ?? i.product.originalPrice,
      quantity: i.quantity,
      kitId: i.kitId,
    })),
    coupon,
  );

async function addItem(userId, productId, qty, variantId) {
  const product = await loadActiveProduct(productId);
  const variant = resolveVariant(product, variantId);
  const cart = await getOrCreateCart(userId);
  const keyVariantId = variant ? variant._id : null;
  assertStock(
    product,
    quantityInCart(cart, productId, keyVariantId) + qty,
    variant,
  );
  const line = cart.items.find(
    (i) =>
      String(i.product) === String(productId) &&
      String(i.variantId || "") === String(keyVariantId || "") &&
      !i.kitId,
  );
  if (line) line.quantity += qty;
  else
    cart.items.push({
      product: product._id,
      quantity: qty,
      ...variantFields(variant),
    });
  await cart.save();
  return buildCartView(cart);
}

async function setQuantity(userId, productId, qty, variantId) {
  const cart = await getOrCreateCart(userId);
  let line = cart.items.find(
    (i) =>
      String(i.product) === String(productId) &&
      String(i.variantId || "") === String(variantId || "") &&
      !i.kitId,
  );
  if (!line && !variantId)
    line = cart.items.find((i) => String(i.product) === String(productId));
  if (!line) throw new AppError("Item not in cart", 404);
  if (qty === 0) {
    cart.items = cart.items.filter((i) => i !== line);
  } else {
    const product = await loadActiveProduct(productId);
    const variant = resolveVariant(product, line.variantId || variantId);
    const others = cart.items
      .filter(
        (i) =>
          i !== line &&
          String(i.product) === String(productId) &&
          String(i.variantId || "") === String(line.variantId || ""),
      )
      .reduce((s, i) => s + i.quantity, 0);
    assertStock(product, others + qty, variant);
    line.quantity = qty;
  }
  await cart.save();
  return buildCartView(cart);
}

async function removeItem(userId, productId, variantId) {
  const cart = await getOrCreateCart(userId);
  cart.items = cart.items.filter(
    (i) =>
      String(i.product) !== String(productId) ||
      (variantId && String(i.variantId || "") !== String(variantId)),
  );
  await cart.save();
  return buildCartView(cart);
}

async function clearCart(userId) {
  const cart = await getOrCreateCart(userId);
  cart.items = [];
  cart.couponCode = "";
  await cart.save();
  return buildCartView(cart);
}

async function applyCoupon(userId, code) {
  const cart = await getOrCreateCart(userId);
  const view = await buildCartView(cart);
  const payable = round2(view.summary.total - view.summary.shipping);
  const coupon = await couponService.requireValid(code, payable, userId);
  cart.couponCode = coupon.code;
  await cart.save();
  return buildCartView(cart);
}

async function removeCoupon(userId) {
  const cart = await getOrCreateCart(userId);
  cart.couponCode = "";
  await cart.save();
  return buildCartView(cart);
}

async function addKit(userId, kitItems) {
  const cart = await getOrCreateCart(userId);
  const kitId = crypto.randomUUID();
  for (const { slot, product } of kitItems) {
    assertStock(product, quantityInCart(cart, product._id, null) + 1);
    cart.items.push({
      product: product._id,
      quantity: 1,
      kitId,
      kitSlot: slot,
    });
  }
  await cart.save();
  return buildCartView(cart);
}

async function quote(requested, code = "") {
  const totals = new Map();
  for (const { productId, variantId, quantity } of requested) {
    const key = `${productId}:${variantId || ""}`;
    const current = totals.get(key) || {
      productId,
      variantId: variantId || null,
      quantity: 0,
    };
    current.quantity += quantity;
    totals.set(key, current);
  }
  const products = await Product.find({
    _id: { $in: [...new Set([...totals.values()].map((v) => String(v.productId)))] },
    isActive: true,
  }).populate("category", "name slug");
  const byId = new Map(products.map((p) => [String(p._id), p]));
  const items = [];
  for (const { productId, variantId, quantity } of totals.values()) {
    const product = byId.get(String(productId));
    if (!product) throw new AppError("Product not found", 404);
    const variant = resolveVariant(product, variantId);
    assertStock(product, quantity, variant);
    items.push({
      product,
      quantity,
      ...variantFields(variant),
      ...(variant
        ? {
            price: variant.sellingPrice,
            originalPrice: variant.compareAtPrice || variant.sellingPrice,
          }
        : {}),
    });
  }
  const base = viewSummary(items);
  let coupon = null;
  if (code) {
    const payable = round2(base.total - base.shipping);
    const doc = await couponService.requireValid(code, payable, null);
    coupon = couponService.toDescriptor(doc);
  }
  return { items, summary: viewSummary(items, coupon) };
}

module.exports = {
  getOrCreateCart,
  buildCartView,
  addItem,
  setQuantity,
  removeItem,
  clearCart,
  applyCoupon,
  removeCoupon,
  addKit,
  quote,
  resolveVariant,
  variantFields,
};

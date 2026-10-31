const crypto = require("crypto");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const AppError = require("../utils/AppError");
const { MAX_ITEM_QUANTITY } = require("../config/store");
const { computeSummary } = require("./pricing");

const PRODUCT_POPULATE = {
  path: "items.product",
  populate: { path: "category", select: "name slug" },
};

const getOrCreateCart = async (userId) =>
  (await Cart.findOne({ user: userId })) ||
  Cart.create({ user: userId, items: [] });

/** Total quantity of a product already in the cart across all lines. */
const quantityInCart = (cart, productId) =>
  cart.items
    .filter((i) => String(i.product) === String(productId))
    .reduce((s, i) => s + i.quantity, 0);

async function loadActiveProduct(productId) {
  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) throw new AppError("Product not found", 404);
  return product;
}

function assertStock(product, wantedTotal) {
  if (wantedTotal > product.stock) {
    const msg =
      product.stock === 0
        ? `${product.name} is out of stock`
        : `Only ${product.stock} unit(s) of ${product.name} available`;
    throw new AppError(msg, 400);
  }
  if (wantedTotal > MAX_ITEM_QUANTITY)
    throw new AppError(`Maximum ${MAX_ITEM_QUANTITY} units per product`, 400);
}

/** Builds { items, summary } for a cart document, dropping lines whose product is gone or inactive. */
async function buildCartView(cart) {
  await cart.populate(PRODUCT_POPULATE);
  const live = cart.items.filter((i) => i.product && i.product.isActive);
  if (live.length !== cart.items.length) {
    cart.items = live.map((i) => ({
      product: i.product._id,
      quantity: i.quantity,
      kitId: i.kitId,
      kitSlot: i.kitSlot,
    }));
    await cart.save();
    await cart.populate(PRODUCT_POPULATE);
  }
  const items = cart.items.map((i) => ({
    product: i.product,
    quantity: i.quantity,
    ...(i.kitId ? { kitId: i.kitId } : {}),
  }));
  return { items, summary: viewSummary(items) };
}

const viewSummary = (items) =>
  computeSummary(
    items.map((i) => ({
      price: i.product.price,
      originalPrice: i.product.originalPrice,
      quantity: i.quantity,
      kitId: i.kitId,
    })),
  );

async function addItem(userId, productId, qty) {
  const product = await loadActiveProduct(productId);
  const cart = await getOrCreateCart(userId);
  assertStock(product, quantityInCart(cart, productId) + qty);
  const line = cart.items.find(
    (i) => String(i.product) === String(productId) && !i.kitId,
  );
  if (line) line.quantity += qty;
  else cart.items.push({ product: product._id, quantity: qty });
  await cart.save();
  return buildCartView(cart);
}

/** Sets the quantity of the product's plain line (or first kit line); 0 removes it. */
async function setQuantity(userId, productId, qty) {
  const cart = await getOrCreateCart(userId);
  const line =
    cart.items.find(
      (i) => String(i.product) === String(productId) && !i.kitId,
    ) || cart.items.find((i) => String(i.product) === String(productId));
  if (!line) throw new AppError("Item not in cart", 404);
  if (qty === 0) {
    cart.items = cart.items.filter((i) => i !== line);
  } else {
    const product = await loadActiveProduct(productId);
    const others = cart.items
      .filter((i) => i !== line && String(i.product) === String(productId))
      .reduce((s, i) => s + i.quantity, 0);
    assertStock(product, others + qty);
    line.quantity = qty;
  }
  await cart.save();
  return buildCartView(cart);
}

async function removeItem(userId, productId) {
  const cart = await getOrCreateCart(userId);
  cart.items = cart.items.filter(
    (i) => String(i.product) !== String(productId),
  );
  await cart.save();
  return buildCartView(cart);
}

async function clearCart(userId) {
  const cart = await getOrCreateCart(userId);
  cart.items = [];
  await cart.save();
  return buildCartView(cart);
}

/** Adds validated kit products to the cart under one shared kitId. */
async function addKit(userId, kitItems) {
  const cart = await getOrCreateCart(userId);
  const kitId = crypto.randomUUID();
  for (const { slot, product } of kitItems) {
    assertStock(product, quantityInCart(cart, product._id) + 1);
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

/** Guest quote: same shape as the cart view, nothing persisted. */
async function quote(requested) {
  const totals = new Map();
  for (const { productId, quantity } of requested)
    totals.set(productId, (totals.get(productId) || 0) + quantity);
  const products = await Product.find({
    _id: { $in: [...totals.keys()] },
    isActive: true,
  }).populate("category", "name slug");
  const byId = new Map(products.map((p) => [String(p._id), p]));
  const items = [];
  for (const [productId, qty] of totals) {
    const product = byId.get(productId);
    if (!product) throw new AppError("Product not found", 404);
    assertStock(product, qty);
    items.push({ product, quantity: qty });
  }
  return { items, summary: viewSummary(items) };
}

module.exports = {
  getOrCreateCart,
  buildCartView,
  addItem,
  setQuantity,
  removeItem,
  clearCart,
  addKit,
  quote,
};

const Product = require("../models/Product");
const AppError = require("../utils/AppError");
const { KIT_SLOTS, KIT_DISCOUNT_TIERS } = require("../config/store");
const { kitPercentFor, round2 } = require("./pricing");

/** Slots with their selectable (active, in-stock) products, plus discount tiers. */
async function getConfig() {
  const products = await Product.find({
    isActive: true,
    stock: { $gt: 0 },
    productType: { $in: KIT_SLOTS.map((s) => s.slot) },
  })
    .populate("category", "name slug")
    .sort({ price: 1 });
  return {
    slots: KIT_SLOTS.map(({ slot, label }) => ({
      slot,
      label,
      products: products.filter((p) => p.productType === slot),
    })),
    discountTiers: KIT_DISCOUNT_TIERS,
  };
}

/** Validates kit selections against slots/products/stock and returns resolved items. */
async function resolveItems(selections) {
  const validSlots = new Set(KIT_SLOTS.map((s) => s.slot));
  const seen = new Set();
  for (const { slot } of selections) {
    if (!validSlots.has(slot))
      throw new AppError(`Unknown kit slot: ${slot}`, 400);
    if (seen.has(slot))
      throw new AppError(`Only one product allowed per slot (${slot})`, 400);
    seen.add(slot);
  }
  const products = await Product.find({
    _id: { $in: selections.map((s) => s.productId) },
    isActive: true,
  }).populate("category", "name slug");
  const byId = new Map(products.map((p) => [String(p._id), p]));
  return selections.map(({ slot, productId }) => {
    const product = byId.get(String(productId));
    if (!product) throw new AppError("Product not found", 404);
    if (product.productType !== slot)
      throw new AppError(
        `${product.name} cannot be used in the ${slot} slot`,
        400,
      );
    if (product.stock < 1)
      throw new AppError(`${product.name} is out of stock`, 400);
    return { slot, product, quantity: 1 };
  });
}

async function quote(selections) {
  const items = await resolveItems(selections);
  const subtotal = round2(items.reduce((s, i) => s + i.product.price, 0));
  const kitDiscountPercent = kitPercentFor(items.length);
  const kitDiscount = round2((subtotal * kitDiscountPercent) / 100);
  return {
    items,
    subtotal,
    kitDiscountPercent,
    kitDiscount,
    total: round2(subtotal - kitDiscount),
  };
}

module.exports = { getConfig, resolveItems, quote };

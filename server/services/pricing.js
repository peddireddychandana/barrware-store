const {
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FEE,
  KIT_DISCOUNT_TIERS,
} = require("../config/store");

const round2 = (n) => Math.round(n * 100) / 100;

/** Returns the kit discount percent for a number of kit items (0 below the first tier). */
function kitPercentFor(itemCount) {
  let percent = 0;
  for (const tier of KIT_DISCOUNT_TIERS)
    if (itemCount >= tier.minItems) percent = tier.percent;
  return percent;
}

/**
 * Computes the cart/order summary from DB-sourced lines.
 * lines: [{ price, originalPrice, quantity, kitId? }]. Kit discount applies per kitId group
 * to the group's sale-price total. subtotal = list price total; discount = list savings + kit discount.
 */
function computeSummary(lines) {
  let subtotal = 0;
  let saleTotal = 0;
  let itemCount = 0;
  const kits = new Map();
  for (const line of lines) {
    subtotal += line.originalPrice * line.quantity;
    saleTotal += line.price * line.quantity;
    itemCount += line.quantity;
    if (line.kitId) {
      const kit = kits.get(line.kitId) || { lines: 0, total: 0 };
      kit.lines += 1;
      kit.total += line.price * line.quantity;
      kits.set(line.kitId, kit);
    }
  }
  let kitDiscount = 0;
  for (const kit of kits.values())
    kitDiscount += (kit.total * kitPercentFor(kit.lines)) / 100;
  kitDiscount = round2(kitDiscount);
  const payable = round2(saleTotal - kitDiscount);
  const shipping =
    lines.length === 0 || payable >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  return {
    subtotal: round2(subtotal),
    discount: round2(subtotal - saleTotal + kitDiscount),
    kitDiscount,
    shipping,
    total: round2(payable + shipping),
    itemCount,
  };
}

module.exports = { computeSummary, kitPercentFor, round2 };

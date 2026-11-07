const {
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FEE,
  KIT_DISCOUNT_TIERS,
  GST_RATE,
  GST_ENABLED,
} = require("../config/store");

const round2 = (n) => Math.round(n * 100) / 100;

/** Returns the kit discount percent for a number of kit items (0 below the first tier). */
function kitPercentFor(itemCount) {
  let percent = 0;
  for (const tier of KIT_DISCOUNT_TIERS)
    if (itemCount >= tier.minItems) percent = tier.percent;
  return percent;
}

/** Discount in rupees for a coupon descriptor against a payable amount. */
function couponDiscountFor(coupon, payable) {
  if (!coupon || !coupon.value) return 0;
  let discount =
    coupon.type === "percent"
      ? (payable * coupon.value) / 100
      : coupon.value;
  if (coupon.type === "percent" && coupon.maxDiscount > 0)
    discount = Math.min(discount, coupon.maxDiscount);
  return round2(Math.min(Math.max(discount, 0), payable));
}

/**
 * Computes the cart/order summary from DB-sourced lines.
 * lines: [{ price, originalPrice, quantity, kitId? }]. Kit discount applies per kitId group
 * to the group's sale-price total. subtotal = list price total; discount = list savings + kit discount.
 * coupon (optional): { code, type, value, maxDiscount }.
 * GST is inclusive: tax is the portion of the total already collected as GST.
 */
function computeSummary(lines, coupon = null) {
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
  const couponDiscount = couponDiscountFor(coupon, payable);
  const afterCoupon = round2(payable - couponDiscount);
  const shipping =
    lines.length === 0 || afterCoupon >= FREE_SHIPPING_THRESHOLD
      ? 0
      : SHIPPING_FEE;
  const total = round2(afterCoupon + shipping);
  const tax =
    GST_ENABLED && GST_RATE > 0
      ? round2(total - total / (1 + GST_RATE))
      : 0;

  return {
    subtotal: round2(subtotal),
    discount: round2(subtotal - saleTotal + kitDiscount),
    kitDiscount,
    couponCode: coupon ? coupon.code : "",
    couponDiscount,
    tax,
    shipping,
    total,
    itemCount,
  };
}

module.exports = { computeSummary, couponDiscountFor, kitPercentFor, round2 };

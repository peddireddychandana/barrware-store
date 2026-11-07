const Coupon = require("../models/Coupon");
const AppError = require("../utils/AppError");

const normalize = (code) => String(code || "").trim().toUpperCase();

/** Plain descriptor consumed by the pricing engine. */
const toDescriptor = (coupon) =>
  coupon
    ? {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        maxDiscount: coupon.maxDiscount,
      }
    : null;

const reasonFor = (coupon, amount, userId) => {
  if (!coupon || !coupon.isActive) return "Coupon code is not valid";
  const now = Date.now();
  if (coupon.startsAt && coupon.startsAt.getTime() > now)
    return "Coupon is not active yet";
  if (coupon.expiresAt && coupon.expiresAt.getTime() < now)
    return "Coupon has expired";
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit)
    return "Coupon usage limit reached";
  if (coupon.minSubtotal > amount)
    return `Minimum order of ₹${coupon.minSubtotal} required for this coupon`;
  if (coupon.perUserLimit > 0 && userId) {
    const used = coupon.usedBy.find((u) => String(u.user) === String(userId));
    if (used && used.count >= coupon.perUserLimit)
      return "You have already used this coupon";
  }
  return "";
};

/** Loads a coupon by code; returns null instead of throwing for unknown codes. */
async function findByCode(code) {
  const normalized = normalize(code);
  if (!normalized) return null;
  return Coupon.findOne({ code: normalized });
}

/**
 * Validates a coupon against an amount. Throws a 400 AppError when unusable.
 * Returns the coupon document when valid.
 */
async function requireValid(code, amount, userId) {
  const coupon = await findByCode(code);
  const reason = reasonFor(coupon, amount, userId);
  if (reason) throw new AppError(reason, 400);
  return coupon;
}

/** Silent variant used when re-pricing a cart (invalid coupons are dropped). */
function isValid(coupon, amount, userId) {
  return !reasonFor(coupon, amount, userId);
}

/** Records one redemption after an order is created. */
async function recordUsage(coupon, userId) {
  if (!coupon) return;
  await Coupon.updateOne({ _id: coupon._id }, { $inc: { usedCount: 1 } });
  if (!userId) return;
  const res = await Coupon.updateOne(
    { _id: coupon._id, "usedBy.user": userId },
    { $inc: { "usedBy.$.count": 1 } },
  );
  if (res.matchedCount === 0)
    await Coupon.updateOne(
      { _id: coupon._id },
      { $push: { usedBy: { user: userId, count: 1 } } },
    );
}

module.exports = {
  normalize,
  toDescriptor,
  findByCode,
  requireValid,
  isValid,
  reasonFor,
  recordUsage,
};

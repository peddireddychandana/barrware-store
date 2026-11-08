const crypto = require("crypto");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Product = require("../models/Product");
const env = require("../config/env");
const AppError = require("../utils/AppError");
const {
  ORDER_FLOW,
  CUSTOMER_CANCELLABLE,
  MAX_ITEM_QUANTITY,
  UPI_PAYMENT_WINDOW_MINUTES,
} = require("../config/store");
const { computeSummary } = require("./pricing");
const couponService = require("./couponService");
const cartService = require("./cartService");
const {
  notifyOrderPlaced,
  notifyOrderStatus,
  notifyPaymentReceived,
} = require("./emailService");

const ORDER_NUMBER_ALPHABET = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";

const round2 = (n) => Math.round(n * 100) / 100;
const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

/** Generates BW-YYYYMMDD-xxxx; uniqueness is enforced by the DB index and retried by the caller. */
function generateOrderNumber() {
  const d = new Date();
  const date = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  const suffix = Array.from(
    crypto.randomBytes(4),
    (b) => ORDER_NUMBER_ALPHABET[b % ORDER_NUMBER_ALPHABET.length],
  ).join("");
  return `BW-${date}-${suffix}`;
}

/** Conditionally decrements stock for each line; undoes partial work and throws if any is short. */
async function reserveStock(entries) {
  const done = [];
  for (const entry of entries) {
    const { productId, variantId, qty } = entry;
    const filter = variantId
      ? {
          _id: productId,
          isActive: true,
          "variants._id": variantId,
          "variants.stock": { $gte: qty },
        }
      : { _id: productId, isActive: true, stock: { $gte: qty } };
    const update = variantId
      ? { $inc: { "variants.$.stock": -qty, sold: qty } }
      : { $inc: { stock: -qty, sold: qty } };
    const res = await Product.updateOne(filter, update);
    if (res.modifiedCount !== 1) {
      await releaseStock(done);
      const p = await Product.findById(productId);
      const variant = variantId
        ? p?.variants?.id(variantId)
        : null;
      const label = variant
        ? `${p.name} (${variant.variantName || variant.colorName || "variant"})`
        : p?.name;
      throw new AppError(
        variant
          ? `Only ${variant.stock} unit(s) of ${label} available`
          : p
            ? `Only ${p.stock} unit(s) of ${p.name} available`
            : "A product in your cart is no longer available",
        400,
      );
    }
    done.push(entry);
  }
}

const releaseStock = (entries) =>
  Promise.all(
    entries.map(({ productId, variantId, qty }) =>
      variantId
        ? Product.updateOne(
            { _id: productId, "variants._id": variantId },
            { $inc: { "variants.$.stock": qty, sold: -qty } },
          )
        : Product.updateOne(
            { _id: productId },
            { $inc: { stock: qty, sold: -qty } },
          ),
    ),
  );

/** Resolves product lines from either the user's cart or a guest item list. */
async function resolveLines(user, guestItems) {
  let source;
  if (user) {
    const cart = await Cart.findOne({ user: user._id });
    if (!cart || cart.items.length === 0)
      throw new AppError("Your cart is empty", 400);
    source = cart.items.map((i) => ({
      productId: i.product,
      quantity: i.quantity,
      kitId: i.kitId,
      variantId: i.variantId,
    }));
  } else {
    if (!Array.isArray(guestItems) || guestItems.length === 0)
      throw new AppError("Your cart is empty", 400);
    const totals = new Map();
    for (const item of guestItems) {
      const key = `${item.productId}:${item.variantId || ""}`;
      const current = totals.get(key) || {
        productId: item.productId,
        quantity: 0,
        kitId: item.kitId,
        variantId: item.variantId,
      };
      current.quantity += item.quantity;
      if (item.kitId) current.kitId = item.kitId;
      totals.set(key, current);
    }
    source = [...totals.values()];
  }

  const products = await Product.find({
    _id: { $in: source.map((i) => i.productId) },
    isActive: true,
  });
  const byId = new Map(products.map((p) => [String(p._id), p]));
  const lines = source.map((item) => {
    const product = byId.get(String(item.productId));
    if (!product)
      throw new AppError("A product in your cart is no longer available", 400);
    if (item.quantity > MAX_ITEM_QUANTITY)
      throw new AppError(`Maximum ${MAX_ITEM_QUANTITY} units per product`, 400);
    const variant = cartService.resolveVariant(product, item.variantId);
    return {
      product,
      quantity: item.quantity,
      kitId: item.kitId,
      variant,
      variantId: variant ? variant._id : undefined,
      variantSku: variant ? variant.sku : "",
      variantName: variant
        ? variant.variantName || variant.colorName || ""
        : "",
      price: variant ? variant.sellingPrice : product.price,
      originalPrice: variant
        ? variant.compareAtPrice || variant.sellingPrice
        : product.originalPrice,
    };
  });
  return lines;
}

/**
 * Creates an order from the user's server-side cart, or from a guest item list.
 * Prices always come from the DB. Returns { order, guestToken, existing }.
 */
async function placeOrder(
  user,
  shippingAddress,
  paymentMethod = "COD",
  { items: guestItems, couponCode = "", idempotencyKey } = {},
) {
  if (paymentMethod === "UPI" && !env.payment.upiId)
    throw new AppError("UPI payment is not available right now", 400);

  if (idempotencyKey) {
    const existing = await Order.findOne({ idempotencyKey });
    if (existing) return { order: existing, guestToken: null, existing: true };
  }

  const lines = await resolveLines(user, guestItems);

  // Coupon comes from the cart for members, from the request for guests.
  let code = couponCode;
  let cart = null;
  if (user) {
    cart = await Cart.findOne({ user: user._id });
    if (!code && cart.couponCode) code = cart.couponCode;
  }

  const baseItems = lines.map(({ price, originalPrice, quantity, kitId }) => ({
    price,
    originalPrice,
    quantity,
    kitId,
  }));
  const base = computeSummary(baseItems);
  const payable = round2(base.total - base.shipping);

  let coupon = null;
  if (code) {
    const doc = await couponService.requireValid(code, payable, user?._id);
    coupon = couponService.toDescriptor(doc);
  }

  const quantities = [];
  const quantityIndex = new Map();
  for (const line of lines) {
    const key = `${line.product._id}:${line.variantId || ""}`;
    const existing = quantityIndex.get(key);
    if (existing) existing.qty += line.quantity;
    else {
      const entry = {
        productId: line.product._id,
        variantId: line.variantId,
        qty: line.quantity,
      };
      quantityIndex.set(key, entry);
      quantities.push(entry);
    }
  }

  const items = lines.map(
    ({ product, quantity, kitId, variantId, variantSku, variantName, price, originalPrice }) => ({
      product: product._id,
      name: product.name,
      image: product.images[0] || "",
      sku: product.sku,
      variantId,
      variantSku,
      variantName,
      price,
      originalPrice,
      quantity,
      kitId,
    }),
  );
  const { itemCount, ...summary } = computeSummary(items, coupon);

  await reserveStock(quantities);

  let order;
  const guestToken = user
    ? null
    : crypto.randomBytes(24).toString("hex");
  try {
    const isUpi = paymentMethod === "UPI";
    for (let attempt = 0; attempt < 5 && !order; attempt += 1) {
      try {
        order = await Order.create({
          orderNumber: generateOrderNumber(),
          user: user ? user._id : undefined,
          guestTokenHash: guestToken ? hashToken(guestToken) : undefined,
          idempotencyKey: idempotencyKey || undefined,
          items,
          shippingAddress,
          paymentMethod,
          paymentStatus: isUpi ? "pending" : "not_required",
          paymentExpiresAt: isUpi
            ? new Date(Date.now() + UPI_PAYMENT_WINDOW_MINUTES * 60 * 1000)
            : undefined,
          summary,
          status: "placed",
          statusHistory: [
            {
              status: "placed",
              note: isUpi
                ? "Order placed (UPI payment pending)"
                : "Order placed (Cash on Delivery)",
            },
          ],
        });
      } catch (err) {
        if (err.code === 11000 && err.keyPattern?.idempotencyKey) {
          const existing = await Order.findOne({ idempotencyKey });
          if (existing) return { order: existing, guestToken: null, existing: true };
        }
        if (
          !(err.code === 11000 && err.keyPattern && err.keyPattern.orderNumber)
        )
          throw err;
      }
    }
    if (!order)
      throw new AppError(
        "Could not generate an order number, please retry",
        500,
      );
  } catch (err) {
    await releaseStock(quantities);
    throw err;
  }

  if (coupon) await couponService.recordUsage(coupon, user?._id).catch(() => {});
  if (cart) {
    cart.items = [];
    cart.couponCode = "";
    await cart.save();
  }
  notifyOrderPlaced(order).catch(() => {});
  return { order, guestToken, existing: false };
}

/** Marks an order cancelled and restores stock. Caller checks permissions. */
async function cancelAndRestock(order, note) {
  const res = await Order.updateOne(
    { _id: order._id, status: order.status },
    {
      $set: { status: "cancelled" },
      $push: { statusHistory: { status: "cancelled", at: new Date(), note } },
    },
  );
  if (res.modifiedCount !== 1)
    throw new AppError("Order was modified, please retry", 409);
  const quantities = [];
  const index = new Map();
  for (const item of order.items) {
    const key = `${item.product}:${item.variantId || ""}`;
    const existing = index.get(key);
    if (existing) existing.qty += item.quantity;
    else {
      const entry = {
        productId: item.product,
        variantId: item.variantId,
        qty: item.quantity,
      };
      index.set(key, entry);
      quantities.push(entry);
    }
  }
  await releaseStock(quantities);
  return Order.findById(order._id);
}

async function cancelByCustomer(order) {
  if (!CUSTOMER_CANCELLABLE.includes(order.status))
    throw new AppError(
      `Order can no longer be cancelled (status: ${order.status})`,
      400,
    );
  const cancelled = await cancelAndRestock(order, "Cancelled by customer");
  notifyOrderStatus(cancelled, "cancelled", "Cancelled by customer").catch(
    () => {},
  );
  return cancelled;
}

/** Deletes an order, restoring stock when it was still in progress. */
async function deleteOrder(order) {
  if (order.status !== "cancelled" && order.status !== "delivered") {
    const quantities = [];
    const index = new Map();
    for (const item of order.items) {
      const key = `${item.product}:${item.variantId || ""}`;
      const existing = index.get(key);
      if (existing) existing.qty += item.quantity;
      else {
        const entry = {
          productId: item.product,
          variantId: item.variantId,
          qty: item.quantity,
        };
        index.set(key, entry);
        quantities.push(entry);
      }
    }
    await releaseStock(quantities);
  }
  await Order.deleteOne({ _id: order._id });
}

/** Admin transition: forward-only along the flow, or cancel before delivery. */
async function adminSetStatus(order, status, note = "", tracking = null) {
  if (order.status === "cancelled" || order.status === "delivered")
    throw new AppError(`Order is already ${order.status}`, 400);
  if (status === "cancelled") {
    const cancelled = await cancelAndRestock(
      order,
      note || "Cancelled by admin",
    );
    notifyOrderStatus(cancelled, "cancelled", note || "Cancelled by admin").catch(
      () => {},
    );
    return cancelled;
  }
  if (ORDER_FLOW.indexOf(status) <= ORDER_FLOW.indexOf(order.status))
    throw new AppError(
      `Cannot move order from ${order.status} to ${status}`,
      400,
    );
  order.status = status;
  order.statusHistory.push({ status, at: new Date(), note });
  if (tracking) {
    order.tracking = {
      carrier: tracking.carrier ?? order.tracking?.carrier ?? "",
      number: tracking.number ?? order.tracking?.number ?? "",
      url: tracking.url ?? order.tracking?.url ?? "",
      updatedAt: new Date(),
    };
  }
  await order.save();
  notifyOrderStatus(order, status, note).catch(() => {});
  return order;
}

/** Stores courier tracking details without changing the order status. */
async function setTracking(order, tracking) {
  order.tracking = {
    carrier: tracking.carrier ?? order.tracking?.carrier ?? "",
    number: tracking.number ?? order.tracking?.number ?? "",
    url: tracking.url ?? order.tracking?.url ?? "",
    updatedAt: new Date(),
  };
  await order.save();
  return order;
}

/** Customer submits the UPI transaction reference after paying the QR. */
async function submitUpiReference(order, reference) {
  if (order.paymentMethod !== "UPI")
    throw new AppError("This order is not a UPI payment order", 400);
  if (order.paymentStatus === "paid")
    throw new AppError("Payment is already confirmed", 400);
  if (order.status === "cancelled")
    throw new AppError("This order has been cancelled", 400);

  const res = await Order.updateOne(
    { _id: order._id, paymentStatus: { $in: ["pending", "failed"] } },
    {
      $set: {
        paymentStatus: "pending",
        paymentReference: reference,
        paymentSubmittedAt: new Date(),
      },
    },
  );
  if (res.matchedCount !== 1)
    throw new AppError("Payment status changed, please retry", 409);
  return Order.findById(order._id);
}

/** Admin confirms (or rejects) the UPI payment after checking the bank/UPI app. */
async function adminSetPaymentStatus(order, status, note = "") {
  if (order.paymentMethod !== "UPI")
    throw new AppError("Payment status can only be set for UPI orders", 400);
  if (order.paymentStatus === status)
    throw new AppError(`Payment is already marked ${status}`, 400);

  order.paymentStatus = status;
  order.paidAt = status === "paid" ? new Date() : undefined;
  if (status === "paid") order.paymentExpiresAt = undefined;
  await order.save();

  if (status === "paid") {
    notifyPaymentReceived(order, note).catch(() => {});
  }
  return order;
}

/**
 * Cancels unpaid UPI orders past their payment window and restores stock.
 * Safe to call repeatedly (e.g. from a scheduler).
 */
async function expirePendingOrders() {
  const stale = await Order.find({
    paymentMethod: "UPI",
    paymentStatus: "pending",
    status: "placed",
    paymentExpiresAt: { $lt: new Date() },
  });
  let count = 0;
  for (const order of stale) {
    try {
      const cancelled = await cancelAndRestock(
        order,
        "Cancelled automatically: UPI payment not received in time",
      );
      notifyOrderStatus(
        cancelled,
        "cancelled",
        "Payment window expired",
      ).catch(() => {});
      count += 1;
    } catch {
      // Order changed concurrently; skip.
    }
  }
  return count;
}

module.exports = {
  placeOrder,
  cancelByCustomer,
  deleteOrder,
  adminSetStatus,
  setTracking,
  submitUpiReference,
  adminSetPaymentStatus,
  expirePendingOrders,
  hashToken,
};

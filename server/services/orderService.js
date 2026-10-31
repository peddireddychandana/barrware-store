const crypto = require("crypto");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Product = require("../models/Product");
const AppError = require("../utils/AppError");
const { ORDER_FLOW, CUSTOMER_CANCELLABLE } = require("../config/store");
const { computeSummary } = require("./pricing");

const ORDER_NUMBER_ALPHABET = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";

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

/** Conditionally decrements stock for each product; undoes partial work and throws if any is short. */
async function reserveStock(quantities) {
  const done = [];
  for (const [productId, qty] of quantities) {
    const res = await Product.updateOne(
      { _id: productId, isActive: true, stock: { $gte: qty } },
      { $inc: { stock: -qty, sold: qty } },
    );
    if (res.modifiedCount !== 1) {
      await releaseStock(done);
      const p = await Product.findById(productId);
      throw new AppError(
        p
          ? `Only ${p.stock} unit(s) of ${p.name} available`
          : "A product in your cart is no longer available",
        400,
      );
    }
    done.push([productId, qty]);
  }
}

const releaseStock = (entries) =>
  Promise.all(
    [...entries].map(([productId, qty]) =>
      Product.updateOne(
        { _id: productId },
        { $inc: { stock: qty, sold: -qty } },
      ),
    ),
  );

/** Creates a COD order from the user's server-side cart. Prices always come from the DB. */
async function placeOrder(user, shippingAddress) {
  const cart = await Cart.findOne({ user: user._id });
  if (!cart || cart.items.length === 0)
    throw new AppError("Your cart is empty", 400);

  const products = await Product.find({
    _id: { $in: cart.items.map((i) => i.product) },
    isActive: true,
  });
  const byId = new Map(products.map((p) => [String(p._id), p]));
  const lines = cart.items.map((item) => {
    const product = byId.get(String(item.product));
    if (!product)
      throw new AppError("A product in your cart is no longer available", 400);
    return { product, quantity: item.quantity, kitId: item.kitId };
  });

  const quantities = new Map();
  for (const { product, quantity } of lines)
    quantities.set(
      String(product._id),
      (quantities.get(String(product._id)) || 0) + quantity,
    );

  await reserveStock(quantities);

  let order;
  try {
    const items = lines.map(({ product, quantity, kitId }) => ({
      product: product._id,
      name: product.name,
      image: product.images[0] || "",
      sku: product.sku,
      price: product.price,
      originalPrice: product.originalPrice,
      quantity,
      kitId,
    }));
    const { itemCount, ...summary } = computeSummary(items);
    for (let attempt = 0; attempt < 5 && !order; attempt += 1) {
      try {
        order = await Order.create({
          orderNumber: generateOrderNumber(),
          user: user._id,
          items,
          shippingAddress,
          paymentMethod: "COD",
          summary,
          status: "placed",
          statusHistory: [
            { status: "placed", note: "Order placed (Cash on Delivery)" },
          ],
        });
      } catch (err) {
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

  cart.items = [];
  await cart.save();
  return order;
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
  const quantities = new Map();
  for (const item of order.items)
    quantities.set(
      String(item.product),
      (quantities.get(String(item.product)) || 0) + item.quantity,
    );
  await releaseStock(quantities);
  return Order.findById(order._id);
}

async function cancelByCustomer(order) {
  if (!CUSTOMER_CANCELLABLE.includes(order.status))
    throw new AppError(
      `Order can no longer be cancelled (status: ${order.status})`,
      400,
    );
  return cancelAndRestock(order, "Cancelled by customer");
}

/** Admin transition: forward-only along the flow, or cancel before delivery. */
async function adminSetStatus(order, status, note = "") {
  if (order.status === "cancelled" || order.status === "delivered")
    throw new AppError(`Order is already ${order.status}`, 400);
  if (status === "cancelled")
    return cancelAndRestock(order, note || "Cancelled by admin");
  if (ORDER_FLOW.indexOf(status) <= ORDER_FLOW.indexOf(order.status))
    throw new AppError(
      `Cannot move order from ${order.status} to ${status}`,
      400,
    );
  order.status = status;
  order.statusHistory.push({ status, at: new Date(), note });
  await order.save();
  return order;
}

module.exports = { placeOrder, cancelByCustomer, adminSetStatus };

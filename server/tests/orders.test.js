const {
  app,
  request,
  setupDb,
  teardownDb,
  loginAs,
  CUSTOMER,
  ADMIN,
  shippingAddress,
} = require("./helpers");
const { Product, Cart, Order } = require("../models");
const env = require("../config/env");

let customer;
let admin;
const prod = (slug) => Product.findOne({ slug });

beforeAll(async () => {
  await setupDb("orders");
  customer = await loginAs(CUSTOMER);
  admin = await loginAs(ADMIN);
});
afterAll(teardownDb);

async function placeOrder(slug = "boston-shaker-750ml", quantity = 2) {
  const p = await prod(slug);
  await customer.post("/api/cart").send({ productId: String(p._id), quantity });
  return customer
    .post("/api/orders")
    .send({ shippingAddress, paymentMethod: "COD" });
}

describe("orders", () => {
  it("places a COD order using server-side prices, decrements stock and clears the cart", async () => {
    const before = await prod("boston-shaker-750ml");
    const p = before;
    await customer
      .post("/api/cart")
      .send({ productId: String(p._id), quantity: 2 });
    const res = await customer.post("/api/orders").send({
      shippingAddress,
      paymentMethod: "COD",
      items: [{ productId: String(p._id), quantity: 1, price: 1 }],
      summary: { total: 1 },
      total: 1,
    });
    expect(res.status).toBe(201);
    const order = res.body.data;
    expect(order.orderNumber).toMatch(/^BW-\d{8}-[0-9A-Z]{4,}$/);
    expect(order.status).toBe("placed");
    expect(order.items).toHaveLength(1);
    expect(order.items[0]).toMatchObject({
      price: 749,
      originalPrice: 999,
      quantity: 2,
      name: before.name,
      sku: before.sku,
    });
    expect(order.summary).toEqual({
      subtotal: 1998,
      discount: 500,
      kitDiscount: 0,
      couponCode: "",
      couponDiscount: 0,
      tax: 228.51,
      shipping: 0,
      total: 1498,
    });
    expect(order.statusHistory[0].status).toBe("placed");
    expect((await prod("boston-shaker-750ml")).stock).toBe(before.stock - 2);
    expect((await customer.get("/api/cart")).body.data.items).toHaveLength(0);
  });

  it("rejects empty cart, bad address and non-COD payment", async () => {
    expect(
      (
        await customer
          .post("/api/orders")
          .send({ shippingAddress, paymentMethod: "COD" })
      ).status,
    ).toBe(400);
    const p = await prod("bar-spoon-gold");
    await customer.post("/api/cart").send({ productId: String(p._id) });
    const bad = await customer.post("/api/orders").send({
      shippingAddress: { ...shippingAddress, pincode: "12" },
      paymentMethod: "COD",
    });
    expect(bad.status).toBe(400);
    expect(bad.body.errors[0].field).toBe("shippingAddress.pincode");
    expect(
      (
        await customer
          .post("/api/orders")
          .send({ shippingAddress, paymentMethod: "CARD" })
      ).status,
    ).toBe(400);
    await customer.delete("/api/cart");
  });

  it("rejects an order when stock dropped after carting and leaves stock untouched", async () => {
    const p = await prod("ice-tongs-steel");
    await customer
      .post("/api/cart")
      .send({ productId: String(p._id), quantity: 5 });
    await Product.updateOne({ _id: p._id }, { stock: 2 });
    const res = await customer
      .post("/api/orders")
      .send({ shippingAddress, paymentMethod: "COD" });
    expect(res.status).toBe(400);
    expect((await prod("ice-tongs-steel")).stock).toBe(2);
    expect(await Order.countDocuments({ "items.name": p.name })).toBe(0);
    await customer.delete("/api/cart");
  });

  it("lists own orders, shows an order to owner/admin only", async () => {
    const res = await placeOrder("bottle-pourer-steel", 1);
    const id = res.body.data._id;
    expect(
      (await customer.get("/api/orders/my-orders")).body.data.length,
    ).toBeGreaterThanOrEqual(2);
    expect((await customer.get(`/api/orders/${id}`)).status).toBe(200);
    expect((await admin.get(`/api/orders/${id}`)).status).toBe(200);
    const other = await loginAs({
      email: "priya@example.com",
      password: "Customer@123",
    });
    expect((await other.get(`/api/orders/${id}`)).status).toBe(404);
    expect((await other.put(`/api/orders/${id}/cancel`)).status).toBe(404);
    expect((await other.delete(`/api/orders/${id}`)).status).toBe(404);
    expect((await request(app).get("/api/orders/my-orders")).status).toBe(401);
  });

  it("deletes an in-progress order and restores stock", async () => {
    const before = (await prod("bar-spoon-gold")).stock;
    const res = await placeOrder("bar-spoon-gold", 2);
    const id = res.body.data._id;
    expect((await prod("bar-spoon-gold")).stock).toBe(before - 2);
    expect((await customer.delete(`/api/orders/${id}`)).status).toBe(200);
    expect(await Order.findById(id)).toBeNull();
    expect((await prod("bar-spoon-gold")).stock).toBe(before);
  });

  it("does not restock again when deleting a cancelled order", async () => {
    const before = (await prod("bar-spoon-gold")).stock;
    const res = await placeOrder("bar-spoon-gold", 1);
    const id = res.body.data._id;
    expect((await customer.put(`/api/orders/${id}/cancel`)).status).toBe(200);
    expect((await prod("bar-spoon-gold")).stock).toBe(before);
    expect((await customer.delete(`/api/orders/${id}`)).status).toBe(200);
    expect((await prod("bar-spoon-gold")).stock).toBe(before);
  });

  it("cancel restores stock; cancel rejected after shipped", async () => {
    const before = (await prod("dual-jigger-30-60ml")).stock;
    const res = await placeOrder("dual-jigger-30-60ml", 3);
    expect((await prod("dual-jigger-30-60ml")).stock).toBe(before - 3);
    const cancelled = await customer.put(
      `/api/orders/${res.body.data._id}/cancel`,
    );
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.data.status).toBe("cancelled");
    expect((await prod("dual-jigger-30-60ml")).stock).toBe(before);
    expect(
      (await customer.put(`/api/orders/${res.body.data._id}/cancel`)).status,
    ).toBe(400);

    const second = await placeOrder("dual-jigger-30-60ml", 1);
    const id = second.body.data._id;
    for (const status of ["confirmed", "packed", "shipped"])
      expect(
        (await admin.put(`/api/admin/orders/${id}/status`).send({ status }))
          .status,
      ).toBe(200);
    const late = await customer.put(`/api/orders/${id}/cancel`);
    expect(late.status).toBe(400);
    expect(late.body.message).toMatch(/shipped/);
    expect((await prod("dual-jigger-30-60ml")).stock).toBe(before - 1);
  });

  it("cart is empty after order so double submit fails", async () => {
    await placeOrder("bar-spoon-twisted-silver", 1);
    expect(
      (
        await customer
          .post("/api/orders")
          .send({ shippingAddress, paymentMethod: "COD" })
      ).status,
    ).toBe(400);
  });

  it("applies the kit discount to kit orders", async () => {
    const slots = {
      "cocktail-shaker": "boston-shaker-750ml",
      "hawthorne-strainer": "hawthorne-strainer-classic",
      "dual-jigger": "dual-jigger-30-60ml",
    };
    const items = [];
    for (const [slot, slug] of Object.entries(slots))
      items.push({ slot, productId: String((await prod(slug))._id) });
    await customer.post("/api/cart/kit").send({ items });
    const res = await customer
      .post("/api/orders")
      .send({ shippingAddress, paymentMethod: "COD" });
    expect(res.status).toBe(201);
    expect(res.body.data.summary.kitDiscount).toBeCloseTo(
      (749 + 449 + 299) * 0.05,
      2,
    );
    expect(res.body.data.items.every((i) => i.kitId)).toBe(true);
    expect(await Cart.countDocuments({ "items.0": { $exists: true } })).toBe(0);
  });
});

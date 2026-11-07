const path = require("path");
const fs = require("fs");
const {
  app,
  request,
  setupDb,
  teardownDb,
  loginAs,
  ADMIN,
  CUSTOMER,
  shippingAddress,
} = require("./helpers");
const {
  Product,
  Category,
  Order,
  User,
  Cart,
  Wishlist,
  Inquiry,
  Review,
} = require("../models");

let admin;
let customer;

beforeAll(async () => {
  await setupDb("adminpanel");
  admin = await loginAs(ADMIN);
  customer = await loginAs(CUSTOMER);
});
afterAll(teardownDb);

describe("admin dashboard & orders", () => {
  it("dashboard returns totals, low stock and recent orders", async () => {
    const p = await Product.findOne({ slug: "boston-shaker-750ml" });
    await customer
      .post("/api/cart")
      .send({ productId: String(p._id), quantity: 1 });
    const order = (
      await customer
        .post("/api/orders")
        .send({ shippingAddress, paymentMethod: "COD" })
    ).body.data;

    const { data } = (await admin.get("/api/admin/dashboard")).body;
    expect(data).toMatchObject({
      totalRevenue: 0,
      totalOrders: 1,
      totalCustomers: 2,
      totalProducts: 27,
    });
    expect(data.pendingRevenue).toBe(order.summary.total);
    expect(data.lowStockProducts.length).toBe(3);
    expect(data.lowStockProducts.every((x) => x.stock <= 10)).toBe(true);
    expect(data.recentOrders).toHaveLength(1);

    for (const status of [
      "confirmed",
      "packed",
      "shipped",
      "out_for_delivery",
      "delivered",
    ]) {
      const res = await admin
        .put(`/api/admin/orders/${order._id}/status`)
        .send({ status, note: "ok" });
      expect(res.status).toBe(200);
    }
    const after = (await admin.get("/api/admin/dashboard")).body.data;
    expect(after.totalRevenue).toBe(order.summary.total);
    expect(after.pendingRevenue).toBe(0);
  });

  it("order status: filters, history, invalid transitions, admin cancel restocks", async () => {
    const p = await Product.findOne({ slug: "bar-spoon-gold" });
    const stock = p.stock;
    await customer
      .post("/api/cart")
      .send({ productId: String(p._id), quantity: 2 });
    const order = (
      await customer
        .post("/api/orders")
        .send({ shippingAddress, paymentMethod: "COD" })
    ).body.data;
    const list = await admin.get("/api/admin/orders?status=placed");
    expect(list.body.data[0].user).toMatchObject({ email: CUSTOMER.email });
    expect(list.body.pagination.total).toBe(1);
    expect(
      (
        await admin
          .put(`/api/admin/orders/${order._id}/status`)
          .send({ status: "shipped" })
      ).body.data.statusHistory.at(-1).status,
    ).toBe("shipped");
    expect(
      (
        await admin
          .put(`/api/admin/orders/${order._id}/status`)
          .send({ status: "confirmed" })
      ).status,
    ).toBe(400);
    expect(
      (
        await admin
          .put(`/api/admin/orders/${order._id}/status`)
          .send({ status: "bogus" })
      ).status,
    ).toBe(400);
    expect(
      (
        await admin
          .put(`/api/admin/orders/${order._id}/status`)
          .send({ status: "cancelled" })
      ).body.data.status,
    ).toBe("cancelled");
    expect((await Product.findById(p._id)).stock).toBe(stock);
    expect(
      (
        await admin
          .put(`/api/admin/orders/${order._id}/status`)
          .send({ status: "delivered" })
      ).status,
    ).toBe(400);
  });

  it("lists customers and all products including inactive", async () => {
    const customers = (await admin.get("/api/admin/customers")).body;
    expect(customers.data).toHaveLength(2);
    expect(
      customers.data.find((c) => c.email === CUSTOMER.email),
    ).toMatchObject({ orderCount: 2 });
    expect(customers.data[0].password).toBeUndefined();
    await Product.updateOne({ slug: "ice-tongs-gold" }, { isActive: false });
    expect(
      (await admin.get("/api/admin/products?limit=100")).body.pagination.total,
    ).toBe(27);
    expect(
      (await request(app).get("/api/products?limit=60")).body.pagination.total,
    ).toBe(26);
    expect(
      (await request(app).get("/api/products/ice-tongs-gold")).status,
    ).toBe(404);
    await Product.updateOne({ slug: "ice-tongs-gold" }, { isActive: true });
  });
});

describe("admin product CRUD", () => {
  const body = {
    name: "Test Julep Strainer",
    category: "cocktail-strainers",
    productType: "hawthorne-strainer",
    material: "Stainless Steel",
    price: 499,
    originalPrice: 699,
    stock: 20,
    highlights: [{ key: "a", value: "b" }],
  };

  it("creates, reads, updates and deletes a product", async () => {
    const created = await admin.post("/api/products").send(body);
    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({
      slug: "test-julep-strainer",
      discountPercent: 29,
      category: { slug: "cocktail-strainers" },
    });
    expect(created.body.data.sku).toMatch(/^BW-HAW-\d{3}$/);
    const id = created.body.data._id;
    expect((await admin.post("/api/products").send(body)).status).toBe(409);

    const updated = await admin
      .put(`/api/products/${id}`)
      .send({ price: 399, stock: 7, isActive: true });
    expect(updated.body.data).toMatchObject({ price: 399, stock: 7 });
    expect(
      (await request(app).get("/api/products/test-julep-strainer")).body.data
        .price,
    ).toBe(399);

    expect((await admin.delete(`/api/products/${id}`)).status).toBe(200);
    expect(
      (await request(app).get("/api/products/test-julep-strainer")).status,
    ).toBe(404);
  });

  it("validates product input", async () => {
    expect(
      (await admin.post("/api/products").send({ ...body, price: -5 })).status,
    ).toBe(400);
    expect(
      (
        await admin
          .post("/api/products")
          .send({ ...body, name: "Other", productType: "bogus" })
      ).status,
    ).toBe(400);
    expect(
      (
        await admin
          .post("/api/products")
          .send({ ...body, name: "Other", category: "nope" })
      ).status,
    ).toBe(400);
    expect(
      (
        await admin
          .put("/api/products/64b7f0f0f0f0f0f0f0f0f0f0")
          .send({ price: 1 })
      ).status,
    ).toBe(404);
  });
});

describe("admin category CRUD", () => {
  it("creates, updates and deletes; refuses to delete a category in use", async () => {
    const created = await admin
      .post("/api/categories")
      .send({ name: "Cocktail Picks", description: "Garnish picks" });
    expect(created.status).toBe(201);
    expect(created.body.data.slug).toBe("cocktail-picks");
    const id = created.body.data._id;
    expect(
      (
        await admin
          .put(`/api/categories/${id}`)
          .send({ description: "Updated" })
      ).body.data.description,
    ).toBe("Updated");
    expect(
      (await admin.post("/api/categories").send({ name: "Cocktail Picks" }))
        .status,
    ).toBe(409);
    expect((await admin.delete(`/api/categories/${id}`)).status).toBe(200);
    const inUse = await Category.findOne({ slug: "glassware" });
    expect((await admin.delete(`/api/categories/${inUse._id}`)).status).toBe(
      400,
    );
    expect(
      (await customer.post("/api/categories").send({ name: "Nope" })).status,
    ).toBe(403);
  });
});

describe("admin deletes", () => {
  it("deletes any order and restores stock for in-progress orders", async () => {
    const p = await Product.findOne({ slug: "bar-spoon-twisted-silver" });
    const before = p.stock;
    await customer
      .post("/api/cart")
      .send({ productId: String(p._id), quantity: 3 });
    const order = (
      await customer
        .post("/api/orders")
        .send({ shippingAddress, paymentMethod: "COD" })
    ).body.data;
    expect((await Product.findById(p._id)).stock).toBe(before - 3);
    expect((await admin.delete(`/api/admin/orders/${order._id}`)).status).toBe(
      200,
    );
    expect(await Order.findById(order._id)).toBeNull();
    expect((await Product.findById(p._id)).stock).toBe(before);
    expect((await customer.delete(`/api/admin/orders/${order._id}`)).status).toBe(
      403,
    );
  });

  it("deletes a customer along with their cart and wishlist", async () => {
    const created = await request(app).post("/api/auth/register").send({
      name: "Delete Me",
      email: "delete-me@example.com",
      password: "Customer@123",
      confirmPassword: "Customer@123",
    });
    expect(created.status).toBe(201);
    const agent = await loginAs({
      email: "delete-me@example.com",
      password: "Customer@123",
    });
    const p = await Product.findOne({ slug: "boston-shaker-750ml" });
    await agent.post("/api/cart").send({ productId: String(p._id) });
    await agent.post("/api/wishlist/toggle").send({ productId: String(p._id) });
    const userId = created.body.data._id;
    expect((await admin.delete(`/api/admin/customers/${userId}`)).status).toBe(
      200,
    );
    expect(await User.findById(userId)).toBeNull();
    expect(await Cart.countDocuments({ user: userId })).toBe(0);
    expect(await Wishlist.countDocuments({ user: userId })).toBe(0);
  });

  it("deletes inquiries and reviews, recalculating the product rating", async () => {
    await request(app).post("/api/contact").send({
      name: "Inquiry Person",
      email: "inquiry@example.com",
      message: "Do you ship internationally?",
    });
    const inquiry = await Inquiry.findOne({ email: "inquiry@example.com" });
    expect(inquiry).toBeTruthy();
    expect((await admin.delete(`/api/admin/inquiries/${inquiry._id}`)).status).toBe(
      200,
    );
    expect(await Inquiry.findById(inquiry._id)).toBeNull();

    const p = await Product.findOne({ slug: "french-shaker-800ml" });
    const review = await customer
      .post("/api/reviews")
      .send({ productId: String(p._id), rating: 5, title: "Great", comment: "Nice" });
    expect(review.status).toBe(201);
    expect((await Product.findById(p._id)).numReviews).toBe(p.numReviews + 1);
    expect(
      (await admin.delete(`/api/admin/reviews/${review.body.data._id}`)).status,
    ).toBe(200);
    expect(await Review.findById(review.body.data._id)).toBeNull();
    const updated = await Product.findById(p._id);
    expect(updated).toMatchObject({
      rating: p.rating,
      numReviews: p.numReviews,
    });
  });
});

describe("uploads", () => {
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.alloc(32),
  ]);

  it("accepts a valid image from admin and serves it", async () => {
    const res = await admin
      .post("/api/uploads")
      .attach("images", png, { filename: "a.png", contentType: "image/png" });
    expect(res.status).toBe(201);
    const [url] = res.body.data.urls;
    expect(url).toMatch(/\/uploads\/.+\.png$/);
    const file = path.join(__dirname, "..", "uploads", path.basename(url));
    expect(
      (await request(app).get(`/uploads/${path.basename(url)}`)).status,
    ).toBe(200);
    fs.unlinkSync(file);
  });

  it("rejects wrong mime, spoofed content, oversize and non-admin", async () => {
    expect(
      (
        await admin
          .post("/api/uploads")
          .attach("images", Buffer.from("hello"), {
            filename: "a.txt",
            contentType: "text/plain",
          })
      ).status,
    ).toBe(400);
    expect(
      (
        await admin
          .post("/api/uploads")
          .attach("images", Buffer.from("not really a png"), {
            filename: "a.png",
            contentType: "image/png",
          })
      ).status,
    ).toBe(400);
    const big = Buffer.concat([png, Buffer.alloc(5 * 1024 * 1024 + 10)]);
    expect(
      (
        await admin.post("/api/uploads").attach("images", big, {
          filename: "b.png",
          contentType: "image/png",
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await customer.post("/api/uploads").attach("images", png, {
          filename: "a.png",
          contentType: "image/png",
        })
      ).status,
    ).toBe(403);
  });
});

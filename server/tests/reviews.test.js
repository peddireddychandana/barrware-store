const {
  app,
  request,
  setupDb,
  teardownDb,
  loginAs,
  ADMIN,
} = require("./helpers");
const { Product, Review } = require("../models");

let admin;
let slug;
let productId;

beforeAll(async () => {
  await setupDb("reviews");
  admin = await loginAs(ADMIN);
  const p = await Product.findOne({ slug: "french-shaker-800ml" });
  slug = p.slug;
  productId = String(p._id);
});
afterAll(teardownDb);

describe("reviews", () => {
  it("seed reviews give non-zero ratings", async () => {
    const p = (await request(app).get("/api/products/boston-shaker-750ml")).body
      .data;
    expect(p.numReviews).toBe(2);
    expect(p.rating).toBe(4.5);
  });

  it("requires auth, validates, creates one review and updates the aggregate", async () => {
    expect(
      (await request(app).post("/api/reviews").send({ productId, rating: 5 }))
        .status,
    ).toBe(401);
    expect(
      (await admin.post("/api/reviews").send({ productId, rating: 6 })).status,
    ).toBe(400);
    const res = await admin
      .post("/api/reviews")
      .send({ productId, rating: 5, title: "Lovely", comment: "Great shaker" });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      rating: 5,
      title: "Lovely",
      user: { name: "Store Admin" },
    });
    expect(res.body.data.user.email).toBeUndefined();
    const p = (await request(app).get(`/api/products/${slug}`)).body.data;
    expect(p).toMatchObject({ rating: 5, numReviews: 1 });
  });

  it("allows only one review per user per product", async () => {
    const dup = await admin.post("/api/reviews").send({ productId, rating: 1 });
    expect(dup.status).toBe(409);
    expect(await Review.countDocuments({ product: productId })).toBe(1);
  });

  it("aggregates across users and lists a product's reviews", async () => {
    const customer = await loginAs({
      email: "aarav@example.com",
      password: "Customer@123",
    });
    await customer
      .post("/api/reviews")
      .send({ productId, rating: 2, title: "Meh", comment: "ok" });
    expect(
      (await request(app).get(`/api/products/${slug}`)).body.data,
    ).toMatchObject({ rating: 3.5, numReviews: 2 });
    const list = await request(app).get(`/api/products/${slug}/reviews`);
    expect(list.body.data).toHaveLength(2);
    expect(list.body.pagination.total).toBe(2);
    expect(list.body.data[0]).toHaveProperty("user.name");
    expect((await request(app).get("/api/products/nope/reviews")).status).toBe(
      404,
    );
  });

  it("GET /api/reviews returns latest reviews with product info, high ratings first", async () => {
    const res = await request(app).get("/api/reviews?limit=6");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(6);
    expect(res.body.pagination.limit).toBe(6);
    const r = res.body.data[0];
    expect(r).toMatchObject({ rating: expect.any(Number) });
    expect(r.product).toMatchObject({
      slug: expect.any(String),
      name: expect.any(String),
    });
    expect(r.product.images).toHaveLength(1);
    expect(r.user).toHaveProperty("name");
    expect(r.user.email).toBeUndefined();
    expect(res.body.data.every((x) => x.rating >= 4)).toBe(true);
    expect((await request(app).get("/api/reviews")).body.data).toHaveLength(6);
    expect(
      (await request(app).get("/api/reviews?limit=500")).body.pagination.limit,
    ).toBe(20);
    const all = (await request(app).get("/api/reviews?limit=20")).body.data;
    expect(all.length).toBeGreaterThanOrEqual(8);
    expect(all.some((x) => x.rating === 3)).toBe(true);
  });

  it("exposes a summary with average, total and distribution", async () => {
    const res = await request(app).get(`/api/products/${slug}/reviews/summary`);
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(2);
    expect(res.body.data.average).toBe(3.5);
    expect(res.body.data.distribution).toMatchObject({ 5: 1, 2: 1 });
    const sum = Object.values(res.body.data.distribution).reduce(
      (a, b) => a + b,
      0,
    );
    expect(sum).toBe(res.body.data.total);
  });

  it("sorts reviews by rating on request", async () => {
    const highest = await request(app).get(
      `/api/products/${slug}/reviews?sort=highest`,
    );
    expect(highest.body.data[0].rating).toBeGreaterThanOrEqual(
      highest.body.data[1].rating,
    );
    const lowest = await request(app).get(
      `/api/products/${slug}/reviews?sort=lowest`,
    );
    expect(lowest.body.data[0].rating).toBeLessThanOrEqual(
      lowest.body.data[1].rating,
    );
  });

  it("lets the author update and delete their own review, not others'", async () => {
    const customer = await loginAs({
      email: "aarav@example.com",
      password: "Customer@123",
    });
    const list = await request(app).get(`/api/products/${slug}/reviews`);
    const own = list.body.data.find((r) => r.user.name === "Aarav Mehta");
    const foreign = list.body.data.find((r) => r.user.name !== "Aarav Mehta");

    const updated = await customer
      .put(`/api/reviews/${own._id}`)
      .send({ rating: 3, title: "Fine", comment: "Updated thoughts" });
    expect(updated.status).toBe(200);
    expect(updated.body.data).toMatchObject({ rating: 3, title: "Fine" });
    expect(
      (await request(app).get(`/api/products/${slug}`)).body.data.rating,
    ).toBe(4);

    expect(
      (
        await customer
          .put(`/api/reviews/${foreign._id}`)
          .send({ rating: 1, comment: "hijack" })
      ).status,
    ).toBe(404);
    expect((await customer.delete(`/api/reviews/${foreign._id}`)).status).toBe(
      404,
    );
    expect(
      (await request(app).put(`/api/reviews/${own._id}`).send({ rating: 2 }))
        .status,
    ).toBe(401);

    const removed = await customer.delete(`/api/reviews/${own._id}`);
    expect(removed.status).toBe(200);
    expect(
      (await request(app).get(`/api/products/${slug}`)).body.data,
    ).toMatchObject({ rating: 5, numReviews: 1 });
  });
});

describe("help centre and account endpoints", () => {
  it("files a support request with category and order number", async () => {
    const res = await request(app).post("/api/support").send({
      name: "Late Order",
      email: "late@example.com",
      category: "delivery",
      orderNumber: "VY-1234",
      message: "My order has not arrived yet.",
    });
    expect(res.status).toBe(201);
    expect(res.body.data.reference).toBeDefined();
    expect(
      (await request(app).post("/api/support").send({ email: "x@x.com" }))
        .status,
    ).toBe(400);
  });

  it("lists available coupons for signed-in customers only", async () => {
    const Coupon = require("../models/Coupon");
    await Coupon.create({
      code: "SAVE10",
      type: "percent",
      value: 10,
      isActive: true,
    });
    expect((await request(app).get("/api/coupons/available")).status).toBe(401);
    const customer = await loginAs({
      email: "aarav@example.com",
      password: "Customer@123",
    });
    const res = await customer.get("/api/coupons/available");
    expect(res.status).toBe(200);
    expect(res.body.data.some((c) => c.code === "SAVE10")).toBe(true);
    expect(res.body.data[0].usedCount).toBeUndefined();
  });

  it("derives notifications from the customer's order history", async () => {
    const customer = await loginAs({
      email: "aarav@example.com",
      password: "Customer@123",
    });
    const res = await customer.get("/api/notifications");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect((await request(app).get("/api/notifications")).status).toBe(401);
  });
});

describe("newsletter", () => {
  it("is idempotent and validates email", async () => {
    expect(
      (
        await request(app)
          .post("/api/newsletter")
          .send({ email: "fan@example.com" })
      ).status,
    ).toBe(200);
    expect(
      (
        await request(app)
          .post("/api/newsletter")
          .send({ email: "fan@example.com" })
      ).status,
    ).toBe(200);
    expect(
      (await request(app).post("/api/newsletter").send({ email: "bad" }))
        .status,
    ).toBe(400);
  });
});

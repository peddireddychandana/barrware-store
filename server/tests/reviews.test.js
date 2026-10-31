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

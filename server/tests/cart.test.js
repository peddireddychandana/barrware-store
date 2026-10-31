const {
  app,
  request,
  setupDb,
  teardownDb,
  loginAs,
  CUSTOMER,
} = require("./helpers");
const { Product } = require("../models");

let agent;
const idOf = async (slug) => String((await Product.findOne({ slug }))._id);

beforeAll(async () => {
  await setupDb("cart");
  agent = await loginAs(CUSTOMER);
});
afterAll(teardownDb);
beforeEach(() => agent.delete("/api/cart"));

describe("cart", () => {
  it("requires authentication", async () => {
    expect((await request(app).get("/api/cart")).status).toBe(401);
  });

  it("adds items and computes the summary server-side", async () => {
    const id = await idOf("boston-shaker-750ml");
    const res = await agent
      .post("/api/cart")
      .send({ productId: id, quantity: 2 });
    expect(res.status).toBe(200);
    expect(res.body.data.items[0]).toMatchObject({
      quantity: 2,
      product: { slug: "boston-shaker-750ml" },
    });
    expect(res.body.data.summary).toEqual({
      subtotal: 1998,
      discount: 500,
      kitDiscount: 0,
      shipping: 0,
      total: 1498,
      itemCount: 2,
    });
    await agent.post("/api/cart").send({ productId: id });
    expect((await agent.get("/api/cart")).body.data.items[0].quantity).toBe(3);
  });

  it("charges shipping under the free-shipping threshold", async () => {
    const res = await agent
      .post("/api/cart")
      .send({ productId: await idOf("shot-glass-45ml-single") });
    expect(res.body.data.summary).toMatchObject({
      subtotal: 179,
      discount: 50,
      shipping: 79,
      total: 208,
    });
  });

  it("rejects quantity above stock with 400", async () => {
    const rosewood = await idOf("sommelier-corkscrew-rosewood");
    const res = await agent
      .post("/api/cart")
      .send({ productId: rosewood, quantity: 5 });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Only 4/);
    await agent.post("/api/cart").send({ productId: rosewood, quantity: 3 });
    expect(
      (await agent.post("/api/cart").send({ productId: rosewood, quantity: 2 }))
        .status,
    ).toBe(400);
    expect(
      (await agent.put(`/api/cart/${rosewood}`).send({ quantity: 9 })).status,
    ).toBe(400);
  });

  it("updates quantity, removes with 0, deletes and clears", async () => {
    const a = await idOf("boston-shaker-750ml");
    const b = await idOf("bar-spoon-gold");
    await agent.post("/api/cart").send({ productId: a });
    await agent.post("/api/cart").send({ productId: b });
    const up = await agent.put(`/api/cart/${a}`).send({ quantity: 4 });
    expect(up.body.data.items.find((i) => i.product._id === a).quantity).toBe(
      4,
    );
    expect(
      (await agent.put(`/api/cart/${a}`).send({ quantity: 0 })).body.data.items,
    ).toHaveLength(1);
    expect((await agent.delete(`/api/cart/${b}`)).body.data.items).toHaveLength(
      0,
    );
    await agent.post("/api/cart").send({ productId: a });
    expect((await agent.delete("/api/cart")).body.data.items).toHaveLength(0);
  });

  it("validates input and unknown products", async () => {
    expect(
      (await agent.post("/api/cart").send({ productId: "bad" })).status,
    ).toBe(400);
    expect(
      (
        await agent
          .post("/api/cart")
          .send({ productId: "64b7f0f0f0f0f0f0f0f0f0f0" })
      ).status,
    ).toBe(404);
    expect(
      (
        await agent
          .post("/api/cart")
          .send({ productId: await idOf("boston-shaker-750ml"), quantity: 0 })
      ).status,
    ).toBe(400);
  });

  it("guest quote is public, unpersisted, and stock-checked", async () => {
    const id = await idOf("dual-jigger-30-60ml");
    const res = await request(app)
      .post("/api/cart/quote")
      .send({ items: [{ productId: id, quantity: 2 }] });
    expect(res.status).toBe(200);
    expect(res.body.data.summary).toMatchObject({
      subtotal: 798,
      total: 598 + 79,
    });
    expect(
      (
        await request(app)
          .post("/api/cart/quote")
          .send({ items: [{ productId: id, quantity: 9999 }] })
      ).status,
    ).toBe(400);
  });
});

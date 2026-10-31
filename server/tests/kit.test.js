const {
  app,
  request,
  setupDb,
  teardownDb,
  loginAs,
  CUSTOMER,
} = require("./helpers");
const { Product } = require("../models");

const pick = async (slug) => String((await Product.findOne({ slug }))._id);
let sel;

beforeAll(async () => {
  await setupDb("kit");
  sel = {
    shaker: {
      slot: "cocktail-shaker",
      productId: await pick("boston-shaker-750ml"),
    },
    strainer: {
      slot: "hawthorne-strainer",
      productId: await pick("hawthorne-strainer-classic"),
    },
    jigger: {
      slot: "dual-jigger",
      productId: await pick("dual-jigger-30-60ml"),
    },
    muddler: {
      slot: "wooden-muddler",
      productId: await pick("wooden-muddler-flat"),
    },
    spoon: {
      slot: "bar-spoon",
      productId: await pick("bar-spoon-twisted-silver"),
    },
    pourer: {
      slot: "bottle-pourer",
      productId: await pick("bottle-pourer-steel"),
    },
  };
});
afterAll(teardownDb);

describe("build your bar kit", () => {
  it("returns slots with matching products and the discount tiers", async () => {
    const { data } = (await request(app).get("/api/kit/config")).body;
    expect(data.slots.map((s) => s.slot)).toEqual([
      "cocktail-shaker",
      "hawthorne-strainer",
      "dual-jigger",
      "wooden-muddler",
      "bar-spoon",
      "bottle-pourer",
    ]);
    expect(data.slots[0].products).toHaveLength(3);
    expect(
      data.slots.every((s) =>
        s.products.every((p) => p.productType === s.slot),
      ),
    ).toBe(true);
    expect(data.discountTiers).toEqual([
      { minItems: 3, percent: 5 },
      { minItems: 4, percent: 8 },
      { minItems: 5, percent: 10 },
      { minItems: 6, percent: 15 },
    ]);
  });

  it.each([
    [2, 0],
    [3, 5],
    [4, 8],
    [5, 10],
    [6, 15],
  ])("quote with %i items gives %i%% discount", async (count, percent) => {
    const items = Object.values(sel).slice(0, count);
    const { data } = (await request(app).post("/api/kit/quote").send({ items }))
      .body;
    const subtotal = (
      await Promise.all(items.map((i) => Product.findById(i.productId)))
    ).reduce((s, p) => s + p.price, 0);
    expect(data).toMatchObject({ subtotal, kitDiscountPercent: percent });
    expect(data.kitDiscount).toBeCloseTo((subtotal * percent) / 100, 2);
    expect(data.total).toBeCloseTo(subtotal - data.kitDiscount, 2);
    expect(data.items).toHaveLength(count);
  });

  it("rejects wrong slot, duplicate slot, unknown slot and out-of-stock", async () => {
    const wrong = await request(app)
      .post("/api/kit/quote")
      .send({
        items: [{ slot: "bar-spoon", productId: sel.shaker.productId }],
      });
    expect(wrong.status).toBe(400);
    expect(wrong.body.message).toMatch(/cannot be used/);
    expect(
      (
        await request(app)
          .post("/api/kit/quote")
          .send({
            items: [
              sel.shaker,
              {
                slot: "cocktail-shaker",
                productId: await pick("cobbler-shaker-500ml"),
              },
            ],
          })
      ).status,
    ).toBe(400);
    expect(
      (
        await request(app)
          .post("/api/kit/quote")
          .send({
            items: [
              {
                slot: "tool-set",
                productId: await pick("bartender-set-pro-8pc"),
              },
            ],
          })
      ).status,
    ).toBe(400);
    await Product.updateOne({ _id: sel.pourer.productId }, { stock: 0 });
    expect(
      (
        await request(app)
          .post("/api/kit/quote")
          .send({ items: [sel.pourer] })
      ).status,
    ).toBe(400);
    await Product.updateOne({ _id: sel.pourer.productId }, { stock: 50 });
  });

  it("adds a kit to the cart with a shared kitId and applies the discount in the summary", async () => {
    const agent = await loginAs(CUSTOMER);
    expect(
      (
        await request(app)
          .post("/api/cart/kit")
          .send({ items: [sel.shaker] })
      ).status,
    ).toBe(401);
    const res = await agent
      .post("/api/cart/kit")
      .send({ items: Object.values(sel).slice(0, 4) });
    expect(res.status).toBe(200);
    const kitIds = new Set(res.body.data.items.map((i) => i.kitId));
    expect(kitIds.size).toBe(1);
    expect(res.body.data.items).toHaveLength(4);
    const sale = res.body.data.items.reduce(
      (s, i) => s + i.product.price * i.quantity,
      0,
    );
    expect(res.body.data.summary.kitDiscount).toBeCloseTo(sale * 0.08, 2);
    expect(res.body.data.summary.discount).toBeGreaterThan(
      res.body.data.summary.kitDiscount,
    );
    await agent.delete("/api/cart");
  });
});

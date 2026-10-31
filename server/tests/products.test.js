const { app, request, setupDb, teardownDb } = require("./helpers");

beforeAll(() => setupDb("products"));
afterAll(teardownDb);

const get = (qs) => request(app).get(`/api/products${qs}`);

describe("catalog", () => {
  it("lists categories with product counts", async () => {
    const res = await request(app).get("/api/categories");
    expect(res.body.data).toHaveLength(11);
    expect(res.body.data.find((c) => c.slug === "glassware").productCount).toBe(
      3,
    );
  });

  it("paginates with the list envelope", async () => {
    const res = await get("");
    expect(res.body.pagination).toEqual({
      page: 1,
      limit: 12,
      total: 27,
      pages: 3,
    });
    expect(res.body.data).toHaveLength(12);
    const p3 = await get("?page=3");
    expect(p3.body.data).toHaveLength(3);
    expect((await get("?limit=500")).body.pagination.limit).toBe(60);
  });

  it("returns the contract product shape", async () => {
    const p = (await get("?search=boston")).body.data[0];
    expect(p).toMatchObject({
      slug: "boston-shaker-750ml",
      price: 749,
      originalPrice: 999,
      discountPercent: 25,
      productType: "cocktail-shaker",
      category: { slug: "cocktail-shakers" },
    });
    expect(p.highlights).toHaveLength(3);
    expect(p.images).toHaveLength(3);
    expect(p.sku).toMatch(/^BW-SHK-\d{3}$/);
    expect(p.sold).toBeUndefined();
  });

  it("filters by category, type, material, price and flags", async () => {
    expect((await get("?category=glassware")).body.pagination.total).toBe(3);
    expect(
      (await get("?productType=hawthorne-strainer")).body.pagination.total,
    ).toBe(2);
    expect((await get("?material=Beech%20Wood")).body.pagination.total).toBe(2);
    const priced = (await get("?minPrice=300&maxPrice=450&limit=60")).body.data;
    expect(priced.length).toBeGreaterThan(0);
    expect(priced.every((p) => p.price >= 300 && p.price <= 450)).toBe(true);
    expect((await get("?featured=true")).body.pagination.total).toBe(8);
    expect((await get("?bestSeller=true")).body.pagination.total).toBe(8);
    expect((await get("?premium=true")).body.pagination.total).toBe(6);
  });

  it("searches by name, category name and type", async () => {
    const muddlers = (await get("?search=muddler")).body.data.map(
      (p) => p.slug,
    );
    expect(muddlers).toEqual(
      expect.arrayContaining([
        "wooden-muddler-flat",
        "wooden-muddler-textured",
      ]),
    );
    expect(
      (await get("?search=Bar%20Spoons")).body.data.map((p) => p.productType),
    ).toContain("bar-spoon");
    expect((await get("?search=corkscrew")).body.pagination.total).toBe(2);
    expect((await get("?search=zzzznothing")).body.pagination.total).toBe(0);
    expect((await get("?search=.*")).body.pagination.total).toBe(0);
  });

  it("sorts by price, newest and popular", async () => {
    const asc = (await get("?sort=price_asc&limit=60")).body.data.map(
      (p) => p.price,
    );
    expect(asc).toEqual([...asc].sort((a, b) => a - b));
    const desc = (await get("?sort=price_desc&limit=60")).body.data.map(
      (p) => p.price,
    );
    expect(desc).toEqual([...desc].sort((a, b) => b - a));
    const newest = (await get("?sort=newest&limit=60")).body.data.map((p) =>
      new Date(p.createdAt).getTime(),
    );
    expect(newest).toEqual([...newest].sort((a, b) => b - a));
    expect((await get("?sort=popular")).body.data[0].bestSeller).toBe(true);
  });

  it("returns filter options", async () => {
    const { data } = (await get("/filters")).body;
    expect(data.materials).toContain("Gold-Plated Steel");
    expect(data.productTypes).toHaveLength(12);
    expect(data.productTypes.find((t) => t.slug === "tool-set")).toMatchObject({
      name: "Bartender Tool Set",
      count: 3,
    });
    expect(data.priceRange).toEqual({ min: 129, max: 3499 });
  });

  it("looks up by slug and id with related products", async () => {
    const bySlug = await request(app).get("/api/products/boston-shaker-750ml");
    expect(bySlug.status).toBe(200);
    expect(bySlug.body.data.relatedProducts).toHaveLength(2);
    const byId = await request(app).get(
      `/api/products/${bySlug.body.data._id}`,
    );
    expect(byId.body.data.slug).toBe("boston-shaker-750ml");
    expect(
      (await request(app).get("/api/products/does-not-exist")).status,
    ).toBe(404);
  });
});

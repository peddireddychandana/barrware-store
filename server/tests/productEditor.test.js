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
const { Product } = require("../models");

let admin;
let customer;
let categoryId;
let productId;
let variantId;

const variant = (overrides) => ({
  variantName: "Copper",
  colorName: "Copper",
  colorHex: "#b87333",
  finishType: "Brushed",
  sku: "BW-EDIT-001",
  sellingPrice: 1899,
  compareAtPrice: 2499,
  stock: 5,
  lowStockThreshold: 2,
  images: [],
  status: "active",
  ...overrides,
});

beforeAll(async () => {
  await setupDb("producteditor");
  admin = await loginAs(ADMIN);
  customer = await loginAs(CUSTOMER);
  const categories = await admin.get("/api/categories");
  categoryId = categories.body.data[0]._id;
});

afterAll(teardownDb);
beforeEach(async () => {
  await customer.delete("/api/cart");
});

describe("admin product editor", () => {
  it("creates a draft product with variants and responsive media", async () => {
    const res = await admin.post("/api/products").send({
      name: "Signature Copper Shaker",
      title: "Signature Copper Shaker",
      slug: "signature-copper-shaker",
      category: categoryId,
      productType: "cocktail-shaker",
      subtitle: "A weighted shaker with a mirror polish.",
      description: "<p>Built for the modern home bar.</p>",
      price: 1899,
      originalPrice: 2499,
      stock: 0,
      status: "draft",
      variantsEnabled: true,
      variants: [
        variant(),
        variant({
          variantName: "Matte Black",
          colorName: "Black",
          colorHex: "#111111",
          sku: "BW-EDIT-002",
          sellingPrice: 1999,
          compareAtPrice: 2599,
          stock: 3,
        }),
      ],
      mediaAssets: [
        {
          originalName: "shaker.jpg",
          webpUrl: "/uploads/shaker.webp",
          thumbnailUrl: "/uploads/shaker-thumb.webp",
          mediumUrl: "/uploads/shaker-medium.webp",
          largeUrl: "/uploads/shaker-large.webp",
          altText: "Copper cocktail shaker",
          assetType: "hero",
          order: 0,
          width: 2000,
          height: 2000,
          fileSize: 128000,
        },
      ],
      salesChannels: ["online", "meta"],
      giftPackaging: {
        enabled: true,
        eligible: true,
        description: "Signature gift box",
        giftCard: true,
      },
      seo: {
        metaTitle: "Copper Cocktail Shaker",
        metaDescription: "Buy the signature copper cocktail shaker.",
      },
    });

    expect(res.status).toBe(201);
    const product = res.body.data;
    productId = product._id;
    variantId = product.variants[0]._id;
    expect(product).toMatchObject({
      name: "Signature Copper Shaker",
      title: "Signature Copper Shaker",
      slug: "signature-copper-shaker",
      status: "draft",
      isActive: false,
      variantsEnabled: true,
    });
    expect(product.variants).toHaveLength(2);
    expect(product.mediaAssets).toHaveLength(1);
    expect(product.images).toEqual(["/uploads/shaker.webp"]);
    expect(product.giftPackaging.enabled).toBe(true);
    expect(product.seo.metaTitle).toBe("Copper Cocktail Shaker");
    expect(product.price).toBe(1899);
    expect(product.stock).toBe(8);
  });

  it("rejects duplicate variant SKUs with 409", async () => {
    const res = await admin
      .put(`/api/products/${productId}`)
      .send({ variants: [variant(), variant({ variantName: "Twin" })] });
    expect(res.status).toBe(409);
  });

  it("publishes, reports slug availability and appends a variant", async () => {
    const published = await admin.post(`/api/products/${productId}/publish`);
    expect(published.status).toBe(200);
    expect(published.body.data.status).toBe("active");
    expect(published.body.data.isActive).toBe(true);
    expect(published.body.data.publishedAt).toBeTruthy();

    const taken = await admin.get(
      "/api/products/slug-check?slug=signature-copper-shaker",
    );
    expect(taken.body.data.available).toBe(false);
    const free = await admin.get(
      "/api/products/slug-check?slug=signature-copper-shaker-gold",
    );
    expect(free.body.data.available).toBe(true);

    const added = await admin
      .post(`/api/products/${productId}/variants`)
      .send(
        variant({
          variantName: "Brass Gold",
          colorName: "Gold",
          colorHex: "#d4af37",
          sku: "BW-EDIT-003",
          sellingPrice: 2099,
          stock: 2,
        }),
      );
    expect(added.status).toBe(201);
    expect(added.body.data.variants).toHaveLength(3);
    expect(added.body.data.stock).toBe(10);
  });

  it("adds a variant to the cart and decrements only that variant on order", async () => {
    const add = await customer
      .post("/api/cart")
      .send({ productId, variantId, quantity: 2 });
    expect(add.status).toBe(200);
    expect(add.body.data.items[0]).toMatchObject({
      variantId,
      variantSku: "BW-EDIT-001",
      variantName: "Copper",
      price: 1899,
      quantity: 2,
    });
    expect(add.body.data.summary.subtotal).toBe(4998);
    expect(add.body.data.summary.total).toBe(3798);

    const before = await Product.findById(productId);
    const beforeStock = before.variants.id(variantId).stock;

    const order = await customer
      .post("/api/orders")
      .send({ shippingAddress, paymentMethod: "COD" });
    expect(order.status).toBe(201);
    expect(order.body.data.items[0]).toMatchObject({
      variantId,
      variantSku: "BW-EDIT-001",
      variantName: "Copper",
      price: 1899,
      quantity: 2,
    });

    const after = await Product.findById(productId);
    expect(after.variants.id(variantId).stock).toBe(beforeStock - 2);
    expect(after.variants[1].stock).toBe(3);
    expect(after.variants[2].stock).toBe(2);
  });

  it("blocks cart quantities above variant stock", async () => {
    const res = await customer
      .post("/api/cart")
      .send({ productId, variantId, quantity: 6 });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Only \d+ unit/);
  });

  it("previews a draft product", async () => {
    const draft = await admin.post("/api/products").send({
      name: "Draft Preview Bar Spoon",
      category: categoryId,
      productType: "bar-spoon",
      price: 500,
      stock: 2,
      status: "draft",
    });
    expect(draft.status).toBe(201);
    const preview = await admin.get(
      `/api/products/${draft.body.data._id}/preview`,
    );
    expect(preview.status).toBe(200);
    expect(preview.body.data.status).toBe("draft");
    expect(preview.body.data.name).toBe("Draft Preview Bar Spoon");
  });

  it("requires admin authentication for editor endpoints", async () => {
    expect(
      (await request(app).get(`/api/products/${productId}/preview`)).status,
    ).toBe(401);
    expect((await customer.post(`/api/products/${productId}/publish`)).status).toBe(
      403,
    );
    expect((await customer.get("/api/admin/products")).status).toBe(403);
  });
});

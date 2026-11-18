const { app, request, setupDb, teardownDb } = require("./helpers");
const env = require("../config/env");

const PRODUCT = "boston-shaker-750ml";
const OTHER_PRODUCT = "cobbler-shaker-500ml";
const PRODUCT_NAME = "Boston Cocktail Shaker 750 ml";
const OTHER_NAME = "Cobbler Cocktail Shaker 500 ml";

const okResponse = (answer) => ({
  ok: true,
  status: 200,
  json: async () => ({
    candidates: [{ content: { parts: [{ text: answer }] } }],
  }),
});

let originalFetch;
let originalKey;

beforeAll(async () => {
  await setupDb("aiproductchat");
  originalFetch = global.fetch;
  originalKey = env.ai.apiKey;
});

afterAll(async () => {
  global.fetch = originalFetch;
  env.ai.apiKey = originalKey;
  await teardownDb();
});

beforeEach(() => {
  env.ai.apiKey = "test-gemini-key";
  global.fetch = jest
    .fn()
    .mockResolvedValue(okResponse("A concise, grounded product answer."));
});

afterEach(() => jest.clearAllMocks());

describe("AI product chat", () => {
  it("answers from the stored product data without exposing the API key", async () => {
    const res = await request(app).post("/api/ai/product-chat").send({
      productId: PRODUCT,
      message: "Summarize this product",
      conversationHistory: [{ role: "user", content: "Tell me about it" }],
    });

    expect(res.status).toBe(200);
    expect(res.body.data.answer).toBe("A concise, grounded product answer.");
    expect(global.fetch).toHaveBeenCalledTimes(1);

    const [url, options] = global.fetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(url).toContain("/models/gemini-3.8-flash:generateContent");
    expect(url).not.toContain("test-gemini-key");
    expect(options.headers["x-goog-api-key"]).toBe("test-gemini-key");
    expect(body.systemInstruction.parts[0].text).toContain("Never invent");
    expect(body.contents[0].parts[0].text).toContain(PRODUCT_NAME);
    expect(body.contents[3].parts[0].text).toBe("Summarize this product");
  });

  it("includes both products when comparing", async () => {
    const res = await request(app).post("/api/ai/product-chat").send({
      productId: PRODUCT,
      compareProductId: OTHER_PRODUCT,
      message: "What is the difference between these two products?",
      conversationHistory: [],
    });

    expect(res.status).toBe(200);
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.contents[0].parts[0].text).toContain("Main product:");
    expect(body.contents[0].parts[0].text).toContain("Second product for comparison:");
    expect(body.contents[0].parts[0].text).toContain(OTHER_NAME);
  });

  it("rejects an unknown product before calling the AI", async () => {
    const res = await request(app).post("/api/ai/product-chat").send({
      productId: "does-not-exist",
      message: "Summarize this product",
      conversationHistory: [],
    });

    expect(res.status).toBe(404);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("validates the message and conversation history", async () => {
    const empty = await request(app)
      .post("/api/ai/product-chat")
      .send({ productId: PRODUCT, message: "  " });
    expect(empty.status).toBe(400);

    const badRole = await request(app)
      .post("/api/ai/product-chat")
      .send({
        productId: PRODUCT,
        message: "What are the main features?",
        conversationHistory: [{ role: "system", content: "hello" }],
      });
    expect(badRole.status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("reports a clear error when no API key is configured", async () => {
    env.ai.apiKey = "";
    const res = await request(app).post("/api/ai/product-chat").send({
      productId: PRODUCT,
      message: "How can I use this product?",
      conversationHistory: [],
    });

    expect(res.status).toBe(503);
    expect(res.body.message).toContain("not configured");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns a friendly error when the AI provider is rate limited", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: false, status: 429, json: async () => ({}) });

    const res = await request(app).post("/api/ai/product-chat").send({
      productId: PRODUCT,
      message: "What material is it made of?",
      conversationHistory: [],
    });

    expect(res.status).toBe(503);
    expect(res.body.message).toContain("busy");
  });

  it("does not return blocked or empty AI responses", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ promptFeedback: { blockReason: "SAFETY" }, candidates: [] }),
    });

    const res = await request(app).post("/api/ai/product-chat").send({
      productId: PRODUCT,
      message: "Tell me something unrelated",
      conversationHistory: [],
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("barware products");
  });
});

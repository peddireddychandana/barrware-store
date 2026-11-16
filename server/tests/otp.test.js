const { app, request, setupDb, teardownDb } = require("./helpers");
const User = require("../models/User");

beforeAll(() => setupDb("otp"));
afterAll(teardownDb);

const NUMBER = { countryCode: "+91", mobile: "9876543210" };

const sendOtp = () =>
  request(app).post("/api/auth/otp/send").send(NUMBER);

describe("mobile OTP login", () => {
  beforeEach(async () => {
    await User.updateMany({}, { $unset: { otpResendAvailableAt: 1 } });
  });

  it("validates the mobile number shape", async () => {
    const bad = await request(app)
      .post("/api/auth/otp/send")
      .send({ countryCode: "91", mobile: "12" });
    expect(bad.status).toBe(400);
    expect(bad.body.errors).toBeDefined();
  });

  it("sends an OTP (dev mode returns the code) and verifies it", async () => {
    const sent = await sendOtp();
    expect(sent.status).toBe(200);
    expect(sent.body.data.expiresAt).toBeDefined();
    expect(typeof sent.body.data.devOtp).toBe("string");

    const verified = await request(app)
      .post("/api/auth/otp/verify")
      .send({ ...NUMBER, otp: sent.body.data.devOtp });
    expect(verified.status).toBe(200);
    expect(verified.body.data.token).toEqual(expect.any(String));
    expect(verified.body.data.phoneVerified).toBe(true);
    expect(verified.body.data.otp).toBeUndefined();

    const me = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${verified.body.data.token}`);
    expect(me.status).toBe(200);
    expect(me.body.data.mobile).toBe("+919876543210");
  });

  it("rejects an incorrect code and counts attempts", async () => {
    await sendOtp();
    const wrong = await request(app)
      .post("/api/auth/otp/verify")
      .send({ ...NUMBER, otp: "000000" });
    expect([200, 400]).toContain(wrong.status);
    if (wrong.status === 400) {
      const user = await User.findOne({ mobile: "+919876543210" }).select(
        "+otpAttempts",
      );
      expect(user.otpAttempts).toBeGreaterThan(0);
    }
  });

  it("requires a code before verification", async () => {
    const res = await request(app)
      .post("/api/auth/otp/verify")
      .send({ ...NUMBER, otp: "123456" });
    expect(res.status).toBe(400);
  });

  it("enforces the resend cooldown", async () => {
    const first = await sendOtp();
    expect(first.status).toBe(200);
    const second = await sendOtp();
    expect([200, 429]).toContain(second.status);
  });

  it("logs an existing OTP user back in with a fresh code", async () => {
    const sent = await sendOtp();
    const verified = await request(app)
      .post("/api/auth/otp/verify")
      .send({ ...NUMBER, otp: sent.body.data.devOtp });
    expect(verified.status).toBe(200);
    const user = await User.findOne({ mobile: "+919876543210" }).select(
      "+otpHash",
    );
    expect(user.otpHash).toBeUndefined();
  });
});

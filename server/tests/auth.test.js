const {
  app,
  request,
  setupDb,
  teardownDb,
  loginAs,
  CUSTOMER,
  ADMIN,
} = require("./helpers");

beforeAll(() => setupDb("auth"));
afterAll(teardownDb);

const newUser = {
  name: "Test User",
  email: "test@example.com",
  password: "Password123",
  confirmPassword: "Password123",
};

describe("auth", () => {
  it("registers, sets an HTTP-only cookie and never returns the password", async () => {
    const res = await request(app).post("/api/auth/register").send(newUser);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      name: "Test User",
      email: "test@example.com",
      role: "customer",
    });
    expect(res.body.data.password).toBeUndefined();
    const cookie = res.headers["set-cookie"].find((c) =>
      c.startsWith("token="),
    );
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
  });

  it("rejects duplicate email, mismatched passwords and weak passwords", async () => {
    expect(
      (await request(app).post("/api/auth/register").send(newUser)).status,
    ).toBe(409);
    const mismatch = await request(app)
      .post("/api/auth/register")
      .send({ ...newUser, email: "x@example.com", confirmPassword: "nope" });
    expect(mismatch.status).toBe(400);
    expect(mismatch.body.errors[0].field).toBe("confirmPassword");
    expect(
      (
        await request(app)
          .post("/api/auth/register")
          .send({
            ...newUser,
            email: "y@example.com",
            password: "short",
            confirmPassword: "short",
          })
      ).status,
    ).toBe(400);
  });

  it("cannot self-register as admin", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...newUser, email: "sneaky@example.com", role: "admin" });
    expect(res.body.data.role).toBe("customer");
  });

  it("logs in, serves /me via cookie, updates profile and logs out", async () => {
    const agent = request.agent(app);
    const login = await agent
      .post("/api/auth/login")
      .send({ email: newUser.email, password: newUser.password });
    expect(login.status).toBe(200);
    const me = await agent.get("/api/auth/me");
    expect(me.body.data.email).toBe(newUser.email);
    const put = await agent.put("/api/auth/me").send({
      name: "Renamed",
      phone: "9999999999",
      address: { city: "Pune", pincode: "411001" },
    });
    expect(put.body.data).toMatchObject({
      name: "Renamed",
      phone: "9999999999",
      address: { city: "Pune", pincode: "411001" },
    });
    const out = await agent.post("/api/auth/logout");
    expect(out.status).toBe(200);
    expect((await agent.get("/api/auth/me")).status).toBe(401);
  });

  it("rejects wrong credentials and anonymous /me", async () => {
    expect(
      (
        await request(app)
          .post("/api/auth/login")
          .send({ email: newUser.email, password: "WrongPass1" })
      ).status,
    ).toBe(401);
    expect((await request(app).get("/api/auth/me")).status).toBe(401);
  });

  it("forgot/reset password flow", async () => {
    const forgot = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: newUser.email });
    expect(forgot.status).toBe(200);
    const token = new URL(forgot.body.data.resetUrl).searchParams.get("token");
    const unknown = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "nobody@example.com" });
    expect(unknown.status).toBe(200);
    expect(unknown.body.data.resetUrl).toBeUndefined();

    const bad = await request(app)
      .post("/api/auth/reset-password")
      .send({
        token: "x".repeat(64),
        password: "NewPassword1",
        confirmPassword: "NewPassword1",
      });
    expect(bad.status).toBe(400);
    const ok = await request(app).post("/api/auth/reset-password").send({
      token,
      password: "NewPassword1",
      confirmPassword: "NewPassword1",
    });
    expect(ok.status).toBe(200);
    expect(
      (
        await request(app).post("/api/auth/reset-password").send({
          token,
          password: "Another123",
          confirmPassword: "Another123",
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await request(app)
          .post("/api/auth/login")
          .send({ email: newUser.email, password: newUser.password })
      ).status,
    ).toBe(401);
    expect(
      (
        await request(app)
          .post("/api/auth/login")
          .send({ email: newUser.email, password: "NewPassword1" })
      ).status,
    ).toBe(200);
  });

  it("admin routes: 401 anonymous, 403 customer, 200 admin", async () => {
    expect((await request(app).get("/api/admin/dashboard")).status).toBe(401);
    const customer = await loginAs(CUSTOMER);
    expect((await customer.get("/api/admin/dashboard")).status).toBe(403);
    expect((await customer.post("/api/products").send({})).status).toBe(403);
    const admin = await loginAs(ADMIN);
    expect((await admin.get("/api/admin/dashboard")).status).toBe(200);
  });
});

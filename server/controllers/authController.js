const crypto = require("crypto");
const User = require("../models/User");
const env = require("../config/env");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/response");
const { attachAuthCookie, clearAuthCookie } = require("../utils/token");

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  if (await User.exists({ email }))
    throw new AppError("An account with this email already exists", 409, [
      { field: "email", message: "Email already registered" },
    ]);
  const user = await User.create({ name, email, password, role: "customer" });
  attachAuthCookie(res, user._id);
  sendSuccess(res, user, { status: 201, message: "Registration successful" });
};

exports.login = async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select(
    "+password",
  );
  if (!user || !(await user.comparePassword(req.body.password)))
    throw new AppError("Invalid email or password", 401);
  attachAuthCookie(res, user._id);
  sendSuccess(res, user, { message: "Login successful" });
};

exports.logout = (_req, res) => {
  clearAuthCookie(res);
  sendSuccess(res, null, { message: "Logged out" });
};

exports.me = (req, res) => sendSuccess(res, req.user);

exports.updateMe = async (req, res) => {
  const { name, phone, address } = req.body;
  if (name !== undefined) req.user.name = name;
  if (phone !== undefined) req.user.phone = phone;
  if (address)
    for (const [k, v] of Object.entries(address))
      if (v !== undefined) req.user.address[k] = v;
  await req.user.save();
  sendSuccess(res, req.user, { message: "Profile updated" });
};

/** Always answers generically; logs the reset link (no SMTP) and returns it only in development. */
exports.forgotPassword = async (req, res) => {
  const message =
    "If an account exists for that email, a reset link has been sent";
  const user = await User.findOne({ email: req.body.email });
  const data = {};
  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = hashToken(token);
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    const resetUrl = `${env.clientUrl}/reset-password?token=${token}`;
    if (env.nodeEnv !== "test")
      console.log(`[password reset] ${user.email}: ${resetUrl}`);
    if (env.nodeEnv === "development" || env.nodeEnv === "test")
      data.resetUrl = resetUrl;
  }
  sendSuccess(res, data, { message });
};

exports.resetPassword = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: hashToken(req.body.token),
    resetPasswordExpires: { $gt: new Date() },
  }).select("+password +resetPasswordToken +resetPasswordExpires");
  if (!user) throw new AppError("Reset link is invalid or has expired", 400);
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  sendSuccess(res, null, { message: "Password updated, you can now log in" });
};

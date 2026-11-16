const crypto = require("crypto");
const User = require("../models/User");
const env = require("../config/env");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/response");
const { attachAuthCookie, clearAuthCookie } = require("../utils/token");
const { sendPasswordResetEmail } = require("../services/emailService");
const { sendSms, isSmsConfigured } = require("../services/smsService");

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const OTP_EMAIL_DOMAIN = "otp.barware.local";
const fullMobile = (countryCode, mobile) => `${countryCode}${mobile}`;
const generateOtp = () =>
  String(crypto.randomInt(0, 1000000)).padStart(6, "0");

exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  if (await User.exists({ email }))
    throw new AppError("An account with this email already exists", 409, [
      { field: "email", message: "Email already registered" },
    ]);
  const user = await User.create({ name, email, password, role: "customer" });
  const token = attachAuthCookie(res, user._id);
  sendSuccess(res, { ...user.toJSON(), token }, {
    status: 201,
    message: "Registration successful",
  });
};

exports.login = async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select(
    "+password",
  );
  if (!user || !(await user.comparePassword(req.body.password)))
    throw new AppError("Invalid email or password", 401);
  const token = attachAuthCookie(res, user._id);
  sendSuccess(res, { ...user.toJSON(), token }, { message: "Login successful" });
};

exports.logout = (_req, res) => {
  clearAuthCookie(res);
  sendSuccess(res, null, { message: "Logged out" });
};

exports.me = (req, res) => sendSuccess(res, req.user);

exports.changePassword = async (req, res) => {
  const user = await User.findById(req.user._id).select("+password");
  if (!user || !(await user.comparePassword(req.body.currentPassword)))
    throw new AppError("Current password is incorrect", 400, [
      { field: "currentPassword", message: "Current password is incorrect" },
    ]);
  user.password = req.body.password;
  await user.save();
  sendSuccess(res, null, { message: "Password updated" });
};

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

/**
 * Always answers generically. Emails the reset link when a mail provider is configured,
 * logs it in development, and returns it in development/test.
 */
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
    if (env.nodeEnv === "development")
      console.log(`[password reset] ${user.email}: ${resetUrl}`);
    sendPasswordResetEmail(user, resetUrl).catch(() => {});
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

/**
 * Sends a one-time password to a mobile number. The OTP is stored hashed with an
 * expiry and resend cooldown. When no SMS provider is configured the code is only
 * logged on the server and returned (dev/test) so the feature stays testable.
 */
exports.sendOtp = async (req, res) => {
  const { countryCode, mobile } = req.body;
  const number = fullMobile(countryCode, mobile);
  const isDev = env.nodeEnv === "development" || env.nodeEnv === "test";
  if (!isSmsConfigured() && !isDev)
    throw new AppError("OTP login is temporarily unavailable", 503);

  let user = await User.findOne({ mobile: number }).select(
    "+otpHash +otpExpiresAt +otpResendAvailableAt +otpAttempts",
  );
  const now = new Date();
  if (!user) {
    user = new User({
      name: "Vyrnt Customer",
      email: `mobile.${number}@${OTP_EMAIL_DOMAIN}`,
      password: crypto.randomBytes(24).toString("hex"),
      mobile: number,
      role: "customer",
    });
  } else if (user.otpResendAvailableAt && user.otpResendAvailableAt > now) {
    throw new AppError(
      "Please wait before requesting another code",
      429,
    );
  }

  const code = generateOtp();
  const ttlMs = env.otp.ttlMinutes * 60 * 1000;
  user.otpHash = hashToken(code);
  user.otpExpiresAt = new Date(now.getTime() + ttlMs);
  user.otpResendAvailableAt = new Date(
    now.getTime() + env.otp.resendCooldownSeconds * 1000,
  );
  user.otpAttempts = 0;
  await user.save();

  const message = `${code} is your VYRNT verification code. It expires in ${env.otp.ttlMinutes} minutes.`;
  if (isSmsConfigured()) {
    await sendSms(number, message);
  } else {
    console.log(`[otp] ${number}: ${code}`);
  }

  const data = {
    expiresAt: user.otpExpiresAt,
    resendCooldownSeconds: env.otp.resendCooldownSeconds,
  };
  // The plain code is only exposed outside production for development/testing.
  if (isDev && !isSmsConfigured()) data.devOtp = code;
  sendSuccess(res, data, { message: "OTP sent" });
};

/** Verifies the OTP for a mobile number and signs the customer in. */
exports.verifyOtp = async (req, res) => {
  const { countryCode, mobile, otp } = req.body;
  const number = fullMobile(countryCode, mobile);
  const user = await User.findOne({ mobile: number }).select(
    "+otpHash +otpExpiresAt +otpResendAvailableAt +otpAttempts",
  );
  if (!user || !user.otpHash || !user.otpExpiresAt)
    throw new AppError("Request a code for this number first", 400);
  if (user.otpExpiresAt < new Date())
    throw new AppError("This code has expired, request a new one", 400);
  if (user.otpAttempts >= env.otp.maxAttempts)
    throw new AppError(
      "Too many incorrect attempts, request a new code",
      429,
    );
  if (user.otpHash !== hashToken(otp)) {
    user.otpAttempts += 1;
    await user.save();
    throw new AppError("Incorrect code", 400);
  }
  user.otpHash = undefined;
  user.otpExpiresAt = undefined;
  user.otpResendAvailableAt = undefined;
  user.otpAttempts = 0;
  user.phoneVerified = true;
  await user.save();
  const token = attachAuthCookie(res, user._id);
  sendSuccess(res, { ...user.toJSON(), token }, { message: "Login successful" });
};

const env = require("../config/env");
const { sendSuccess } = require("../utils/response");

/** Public payment options for checkout (never exposes anything secret). */
exports.config = (_req, res) =>
  sendSuccess(res, {
    codEnabled: true,
    upiEnabled: Boolean(env.payment.upiId),
    upiId: env.payment.upiId || "",
  });

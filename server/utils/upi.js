const env = require("../config/env");

/**
 * Builds a UPI deep link that any UPI app (PhonePe, Google Pay, Paytm, etc.)
 * can turn into a payment QR. Returns "" when no UPI ID is configured.
 */
function buildUpiUri({ amount, note } = {}) {
  const upiId = env.payment.upiId;
  if (!upiId) return "";

  const params = [
    ["pa", upiId],
    ["pn", env.payment.upiPayeeName],
    ["am", Number(amount || 0).toFixed(2)],
    ["cu", "INR"],
    ["tn", note || "VYRNT order"],
  ]
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");

  return `upi://pay?${params}`;
}

module.exports = { buildUpiUri };

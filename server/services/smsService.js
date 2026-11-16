const env = require("../config/env");
const AppError = require("../utils/AppError");

const providerConfigured = () => {
  if (env.sms.provider !== "twilio") return false;
  return Boolean(
    env.sms.twilio.accountSid &&
      env.sms.twilio.authToken &&
      env.sms.twilio.from,
  );
};

/** True when OTPs can actually be delivered to a phone network. */
exports.isSmsConfigured = () => providerConfigured();

/**
 * Sends an SMS through the configured provider.
 * Throws a 503 when no provider is configured so callers can react honestly
 * (development/test flows fall back to the server console instead).
 */
exports.sendSms = async (to, body) => {
  if (!providerConfigured())
    throw new AppError("SMS delivery is not configured on the server", 503);

  const auth = Buffer.from(
    `${env.sms.twilio.accountSid}:${env.sms.twilio.authToken}`,
  ).toString("base64");
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${env.sms.twilio.accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: env.sms.twilio.from, Body: body }),
    },
  );
  if (!response.ok)
    throw new AppError("SMS delivery failed, please try again later", 502);
  return response.json();
};

require("dotenv").config({ quiet: true });

const isProduction = process.env.NODE_ENV === "production";

if (
  isProduction &&
  (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
) {
  throw new Error("JWT_SECRET must be set (32+ chars) in production");
}

const mongoUri = (process.env.MONGO_URI || "").trim();

if (isProduction && !mongoUri) {
  throw new Error(
    "MONGO_URI must be set in production (MongoDB Atlas connection string)",
  );
}

if (mongoUri && !/^mongodb(\+srv)?:\/\//.test(mongoUri)) {
  throw new Error(
    'MONGO_URI must start with "mongodb://" or "mongodb+srv://"; check for stray spaces, quotes, or line breaks',
  );
}

const clientUrl = (process.env.CLIENT_URL || "http://localhost:3000").trim().replace(/\/+$/, "");

/** Origins the API accepts browser requests from (CORS + CSRF). */
const allowedOrigins = [
  ...new Set([
    clientUrl,
    // Extra origins, comma separated, e.g. production + preview domains.
    ...(process.env.CORS_ORIGINS || "")
      .split(",")
      .map((origin) => origin.trim().replace(/\/+$/, ""))
      .filter(Boolean),
    // Development convenience: Vite prints both URLs and users open either one.
    ...(isProduction
      ? []
      : ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173", "http://127.0.0.1:5173"]),
  ]),
];

module.exports = {
  isProduction,
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  mongoUri: mongoUri || "mongodb://127.0.0.1:27017/barware-store",
  jwtSecret: process.env.JWT_SECRET || "insecure-dev-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  // Cross-site (client and API on different domains) needs "none"; same-site deployments can use "lax".
  cookieSameSite:
    process.env.COOKIE_SAMESITE || (isProduction ? "none" : "lax"),
  apiRateLimit: Number(process.env.API_RATE_LIMIT) || 3000,
  clientUrl,
  allowedOrigins,
  serverUrl: process.env.SERVER_URL || "",
  adminEmail: process.env.ADMIN_EMAIL || "admin@barware.test",
  adminPassword: process.env.ADMIN_PASSWORD || "Admin@12345",
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  mail: {
    // Transactional email: set BREVO_API_KEY (300/day free) or RESEND_API_KEY (3,000/month free).
    brevoApiKey: process.env.BREVO_API_KEY || "",
    resendApiKey: process.env.RESEND_API_KEY || "",
    fromEmail: process.env.MAIL_FROM || process.env.ADMIN_EMAIL || "no-reply@example.com",
    fromName: process.env.MAIL_FROM_NAME || "VYRNT",
    adminEmail: process.env.ADMIN_EMAIL || "",
  },
  payment: {
    // Direct UPI payments: customers scan a QR and pay the owner; an admin verifies the reference.
    // The default scanner UPI ID is used when UPI_ID is not set.
    upiId: (process.env.UPI_ID || "9398278894@ibl").trim(),
    upiPayeeName: process.env.UPI_PAYEE_NAME || "VYRNT",
  },
  otp: {
    ttlMinutes: Number(process.env.OTP_TTL_MINUTES) || 10,
    resendCooldownSeconds: Number(process.env.OTP_RESEND_COOLDOWN_SECONDS) || 60,
    maxAttempts: Number(process.env.OTP_MAX_ATTEMPTS) || 5,
  },
  ai: {
    // Gemini API (free tier available). The key is server-side only - never send it to the client.
    apiKey: (process.env.GEMINI_API_KEY || "").trim(),
    model: /^[a-zA-Z0-9._-]+$/.test(process.env.GEMINI_MODEL || "")
      ? process.env.GEMINI_MODEL
      : "gemini-3.8-flash",
  },
  sms: {
    // SMS provider for OTP delivery. Empty means no provider configured.
    provider: (process.env.SMS_PROVIDER || "").trim().toLowerCase(),
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID || "",
      authToken: process.env.TWILIO_AUTH_TOKEN || "",
      from: process.env.TWILIO_FROM || "",
    },
  },
};

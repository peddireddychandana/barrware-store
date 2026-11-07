require("dotenv").config({ quiet: true });

const isProduction = process.env.NODE_ENV === "production";

if (
  isProduction &&
  (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
) {
  throw new Error("JWT_SECRET must be set (32+ chars) in production");
}

module.exports = {
  isProduction,
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/barware-store",
  jwtSecret: process.env.JWT_SECRET || "insecure-dev-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  // Cross-site (client and API on different domains) needs "none"; same-site deployments can use "lax".
  cookieSameSite:
    process.env.COOKIE_SAMESITE || (isProduction ? "none" : "lax"),
  apiRateLimit: Number(process.env.API_RATE_LIMIT) || 3000,
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
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
    upiId: process.env.UPI_ID || "",
    upiPayeeName: process.env.UPI_PAYEE_NAME || "VYRNT",
  },
};

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const env = require("./config/env");
const sanitize = require("./middleware/sanitize");
const { notFound, errorHandler } = require("./middleware/error");
const { apiRoutes, authRoutes } = require("./routes");
const { UPLOAD_DIR } = require("./services/uploadService");

/** Builds the Express app (no listening), so tests can mount it with supertest. */
function createApp() {
  const app = express();
  const skip = () => env.nodeEnv === "test";
  const limiter = (windowMs, limit, skipRequest = () => false) =>
    rateLimit({
      windowMs,
      limit,
      skip: (req) => skip() || skipRequest(req),
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        message: "Too many requests, please try again later",
      },
    });

  app.set("trust proxy", 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors({ origin: env.clientUrl, credentials: true }));
  if (env.nodeEnv === "development") app.use(morgan("dev"));
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());
  app.use(sanitize);

  app.use(
    "/uploads",
    express.static(UPLOAD_DIR, { maxAge: "7d", index: false }),
  );
  app.use("/api", limiter(15 * 60 * 1000, env.apiRateLimit));
  const isSessionCheck = (req) => req.method === "GET" && req.path === "/me";
  app.use("/api/auth", limiter(15 * 60 * 1000, 30, isSessionCheck), authRoutes);
  app.use("/api", apiRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = createApp;

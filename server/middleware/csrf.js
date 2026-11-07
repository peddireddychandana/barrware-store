const env = require("../config/env");
const AppError = require("../utils/AppError");
const { COOKIE_NAME } = require("../utils/token");

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Lightweight CSRF defence for cookie-authenticated writes: when the browser sends an
 * Origin/Referer, it must match the configured client URL. Requests without an Origin
 * (server-to-server, tests) and Bearer-only requests are unaffected.
 */
module.exports = function csrfGuard(req, _res, next) {
  if (SAFE_METHODS.has(req.method)) return next();
  if (!req.cookies || !req.cookies[COOKIE_NAME]) return next();

  const origin = req.get("origin") || req.get("referer");
  if (!origin) return next();

  try {
    const allowed = new URL(env.clientUrl).origin;
    const actual = new URL(origin).origin;
    if (actual === allowed) return next();
  } catch {
    // Fall through to rejection.
  }
  throw new AppError("Request blocked by cross-site protection", 403);
};

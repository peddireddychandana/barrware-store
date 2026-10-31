const jwt = require("jsonwebtoken");
const env = require("../config/env");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const { COOKIE_NAME } = require("../utils/token");

const extractToken = (req) => {
  if (req.cookies && req.cookies[COOKIE_NAME]) return req.cookies[COOKIE_NAME];
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) return header.slice(7);
  return null;
};

/** Requires a valid JWT (cookie or Bearer header); attaches the user to req.user. */
async function protect(req, _res, next) {
  const token = extractToken(req);
  if (!token) throw new AppError("Authentication required", 401);
  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw new AppError("Invalid or expired session, please log in again", 401);
  }
  const user = await User.findById(payload.id);
  if (!user) throw new AppError("Account no longer exists", 401);
  req.user = user;
  next();
}

/** Allows only the listed roles; must run after protect. */
const restrictTo =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role))
      throw new AppError(
        "You do not have permission to perform this action",
        403,
      );
    next();
  };

module.exports = { protect, restrictTo };

const jwt = require("jsonwebtoken");
const env = require("../config/env");

const COOKIE_NAME = "token";

const signToken = (userId) =>
  jwt.sign({ id: userId }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

/** Signs a JWT, sets it as an HTTP-only cookie and returns it as a bearer fallback. */
function attachAuthCookie(res, userId) {
  const token = signToken(userId);
  const { exp } = jwt.decode(token);
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: env.cookieSameSite,
    secure: env.isProduction,
    maxAge: exp * 1000 - Date.now(),
    path: "/",
  });
  return token;
}

const clearAuthCookie = (res) =>
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: env.cookieSameSite,
    secure: env.isProduction,
    path: "/",
  });

module.exports = { COOKIE_NAME, signToken, attachAuthCookie, clearAuthCookie };

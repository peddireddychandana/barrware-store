const express = require("express");
const { protect, restrictTo } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { imagesUpload } = require("../middleware/upload");
const schemas = require("../utils/schemas");
const auth = require("../controllers/authController");
const products = require("../controllers/productController");
const categories = require("../controllers/categoryController");
const cart = require("../controllers/cartController");
const orders = require("../controllers/orderController");
const admin = require("../controllers/adminController");
const misc = require("../controllers/miscController");

const router = express.Router();
const adminOnly = [protect, restrictTo("admin")];

router.get("/health", (_req, res) =>
  res.json({ success: true, data: { status: "ok" } }),
);

module.exports.authRoutes = express
  .Router()
  .post("/register", validate(schemas.register), auth.register)
  .post("/login", validate(schemas.login), auth.login)
  .post("/logout", auth.logout)
  .get("/me", protect, auth.me)
  .put("/me", protect, validate(schemas.updateMe), auth.updateMe)
  .post(
    "/forgot-password",
    validate(schemas.forgotPassword),
    auth.forgotPassword,
  )
  .post("/reset-password", validate(schemas.resetPassword), auth.resetPassword);

router.get("/products", products.list);
router.get("/products/filters", products.filters);
router.get("/products/:idOrSlug/reviews", products.reviews);
router.get("/products/:idOrSlug", products.getOne);
router.post(
  "/products",
  ...adminOnly,
  validate(schemas.productCreate),
  products.create,
);
router.put(
  "/products/:id",
  ...adminOnly,
  validate(schemas.productUpdate),
  products.update,
);
router.delete("/products/:id", ...adminOnly, products.remove);

router.get("/categories", categories.list);
router.post(
  "/categories",
  ...adminOnly,
  validate(schemas.categoryCreate),
  categories.create,
);
router.put(
  "/categories/:id",
  ...adminOnly,
  validate(schemas.categoryUpdate),
  categories.update,
);
router.delete("/categories/:id", ...adminOnly, categories.remove);

router.post("/uploads", ...adminOnly, imagesUpload, misc.upload);
router.post("/newsletter", validate(schemas.newsletter), misc.subscribe);

router.get("/reviews", misc.latestReviews);
router.post(
  "/reviews",
  protect,
  validate(schemas.createReview),
  misc.createReview,
);

router.post("/cart/quote", validate(schemas.cartQuote), cart.quote);
router.post("/cart/kit", protect, validate(schemas.kitItems), cart.addKit);
router.get("/cart", protect, cart.get);
router.post("/cart", protect, validate(schemas.cartAdd), cart.add);
router.delete("/cart", protect, cart.clear);
router.put(
  "/cart/:productId",
  protect,
  validate(schemas.cartUpdate),
  cart.update,
);
router.delete("/cart/:productId", protect, cart.remove);

router.get("/kit/config", cart.kitConfig);
router.post("/kit/quote", validate(schemas.kitItems), cart.kitQuote);

router.post("/orders", protect, validate(schemas.createOrder), orders.create);
router.get("/orders/my-orders", protect, orders.myOrders);
router.get("/orders/:id", protect, orders.getOne);
router.put("/orders/:id/cancel", protect, orders.cancel);

router.get("/admin/dashboard", ...adminOnly, admin.dashboard);
router.get("/admin/orders", ...adminOnly, admin.orders);
router.put(
  "/admin/orders/:id/status",
  ...adminOnly,
  validate(schemas.orderStatus),
  admin.updateOrderStatus,
);
router.get("/admin/customers", ...adminOnly, admin.customers);
router.get("/admin/products", ...adminOnly, products.adminList);

module.exports.apiRoutes = router;

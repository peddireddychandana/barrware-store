const express = require("express");
const { protect, optionalAuth, restrictTo } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { imagesUpload } = require("../middleware/upload");
const schemas = require("../utils/schemas");
const auth = require("../controllers/authController");
const products = require("../controllers/productController");
const categories = require("../controllers/categoryController");
const cart = require("../controllers/cartController");
const orders = require("../controllers/orderController");
const admin = require("../controllers/adminController");
const payments = require("../controllers/paymentController");
const misc = require("../controllers/miscController");
const wishlist = require("../controllers/wishlistController");
const addresses = require("../controllers/addressController");
const returns = require("../controllers/returnController");
const inquiries = require("../controllers/inquiryController");
const coupons = require("../controllers/couponController");
const reports = require("../controllers/reportsController");

const router = express.Router();
const adminOnly = [protect, restrictTo("admin")];

router.get("/health", (_req, res) =>
  res.json({ success: true, data: { status: "ok" } }),
);
router.get("/payment/config", payments.config);

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
router.post(
  "/newsletter/unsubscribe",
  validate(schemas.newsletter),
  inquiries.unsubscribe,
);
router.post("/contact", validate(schemas.inquiryCreate), inquiries.create);

router.get("/reviews", misc.latestReviews);
router.post(
  "/reviews",
  protect,
  validate(schemas.createReview),
  misc.createReview,
);

router.post("/cart/quote", validate(schemas.cartQuote), cart.quote);
router.post("/cart/kit", protect, validate(schemas.kitItems), cart.addKit);
router.post(
  "/cart/coupon",
  protect,
  validate(schemas.couponApply),
  cart.applyCoupon,
);
router.delete("/cart/coupon", protect, cart.removeCoupon);
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

router.post(
  "/orders",
  optionalAuth,
  validate(schemas.createOrder),
  orders.create,
);
router.post("/orders/track", validate(schemas.trackOrder), orders.track);
router.get("/orders/my-orders", protect, orders.myOrders);
router.get("/orders/:id", optionalAuth, orders.getOne);
router.put("/orders/:id/cancel", optionalAuth, orders.cancel);
router.post(
  "/orders/:id/payment",
  optionalAuth,
  validate(schemas.submitPayment),
  orders.submitPayment,
);

router.post(
  "/orders/:id/returns",
  protect,
  validate(schemas.returnCreate),
  returns.create,
);
router.get("/returns/my", protect, returns.my);

router.get("/wishlist", protect, wishlist.get);
router.post(
  "/wishlist/toggle",
  protect,
  validate(schemas.wishlistToggle),
  wishlist.toggle,
);
router.delete("/wishlist/:productId", protect, wishlist.remove);

router.get("/addresses", protect, addresses.list);
router.post(
  "/addresses",
  protect,
  validate(schemas.addressPayload),
  addresses.create,
);
router.put(
  "/addresses/:addressId",
  protect,
  validate(schemas.addressPayload.partial()),
  addresses.update,
);
router.delete("/addresses/:addressId", protect, addresses.remove);
router.put(
  "/addresses/:addressId/default",
  protect,
  addresses.setDefault,
);

router.get("/admin/dashboard", ...adminOnly, admin.dashboard);
router.get("/admin/orders", ...adminOnly, admin.orders);
router.put(
  "/admin/orders/:id/status",
  ...adminOnly,
  validate(schemas.orderStatus),
  admin.updateOrderStatus,
);
router.put(
  "/admin/orders/:id/tracking",
  ...adminOnly,
  validate(schemas.orderTracking),
  admin.updateTracking,
);
router.put(
  "/admin/orders/:id/payment",
  ...adminOnly,
  validate(schemas.paymentStatus),
  admin.updatePaymentStatus,
);
router.get("/admin/customers", ...adminOnly, admin.customers);
router.get("/admin/customers/:id", ...adminOnly, reports.customerDetail);
router.get("/admin/products", ...adminOnly, products.adminList);

router.get("/admin/reports/sales", ...adminOnly, reports.sales);
router.get("/admin/reports/export/orders", ...adminOnly, reports.exportOrders);
router.get(
  "/admin/reports/export/customers",
  ...adminOnly,
  reports.exportCustomers,
);
router.get(
  "/admin/reports/export/products",
  ...adminOnly,
  reports.productCatalogue,
);
router.get("/admin/subscribers", ...adminOnly, reports.subscribers);
router.get(
  "/admin/subscribers/export",
  ...adminOnly,
  reports.exportSubscribers,
);

router.get("/admin/coupons", ...adminOnly, coupons.adminList);
router.post(
  "/admin/coupons",
  ...adminOnly,
  validate(schemas.couponPayload),
  coupons.create,
);
router.put(
  "/admin/coupons/:id",
  ...adminOnly,
  validate(schemas.couponUpdate),
  coupons.update,
);
router.delete("/admin/coupons/:id", ...adminOnly, coupons.remove);

router.get("/admin/returns", ...adminOnly, returns.adminList);
router.put(
  "/admin/returns/:id",
  ...adminOnly,
  validate(schemas.returnStatus),
  returns.adminUpdate,
);

router.get("/admin/inquiries", ...adminOnly, inquiries.adminList);
router.put(
  "/admin/inquiries/:id",
  ...adminOnly,
  validate(schemas.inquiryStatus),
  inquiries.adminUpdate,
);

router.get("/admin/reviews", ...adminOnly, reports.reviews);
router.put(
  "/admin/reviews/:id",
  ...adminOnly,
  validate(schemas.reviewModerate),
  reports.moderateReview,
);

module.exports.apiRoutes = router;

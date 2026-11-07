const cartService = require("../services/cartService");
const kitService = require("../services/kitService");
const { sendSuccess } = require("../utils/response");

exports.get = async (req, res) =>
  sendSuccess(
    res,
    await cartService.buildCartView(
      await cartService.getOrCreateCart(req.user._id),
    ),
  );
exports.add = async (req, res) =>
  sendSuccess(
    res,
    await cartService.addItem(
      req.user._id,
      req.body.productId,
      req.body.quantity,
    ),
    { message: "Added to cart" },
  );
exports.update = async (req, res) =>
  sendSuccess(
    res,
    await cartService.setQuantity(
      req.user._id,
      req.params.productId,
      req.body.quantity,
    ),
  );
exports.remove = async (req, res) =>
  sendSuccess(
    res,
    await cartService.removeItem(req.user._id, req.params.productId),
  );
exports.clear = async (req, res) =>
  sendSuccess(res, await cartService.clearCart(req.user._id));
exports.quote = async (req, res) =>
  sendSuccess(
    res,
    await cartService.quote(req.body.items, req.body.couponCode),
  );

exports.applyCoupon = async (req, res) =>
  sendSuccess(
    res,
    await cartService.applyCoupon(req.user._id, req.body.code),
    { message: "Coupon applied" },
  );
exports.removeCoupon = async (req, res) =>
  sendSuccess(res, await cartService.removeCoupon(req.user._id));

exports.kitConfig = async (_req, res) =>
  sendSuccess(res, await kitService.getConfig());
exports.kitQuote = async (req, res) =>
  sendSuccess(res, await kitService.quote(req.body.items));
exports.addKit = async (req, res) => {
  const items = await kitService.resolveItems(req.body.items);
  sendSuccess(res, await cartService.addKit(req.user._id, items), {
    message: "Kit added to cart",
  });
};

const { generateProductAnswer } = require("../services/aiService");
const productService = require("../services/productService");
const { sendSuccess } = require("../utils/response");

exports.productChat = async (req, res) => {
  const { productId, compareProductId, message, conversationHistory } = req.body;

  const product = await productService.findByIdOrSlug(productId);
  const compareProduct = compareProductId
    ? await productService.findByIdOrSlug(compareProductId)
    : null;

  const answer = await generateProductAnswer({
    product,
    compareProduct,
    message,
    conversationHistory,
  });

  sendSuccess(res, { answer });
};

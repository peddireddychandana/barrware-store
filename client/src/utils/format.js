const NEW_ARRIVAL_DAYS = 30;

/**
 * @param {number} amount
 * @returns {string} e.g. "₹1,299"
 */
export const formatPrice = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

/**
 * Maps an API product onto the shape the storefront components render.
 *
 * @param {Object} product API product
 * @returns {Object}
 */
export const normalizeProduct = (product) => {
  if (!product) return product;
  const ageInDays = (Date.now() - new Date(product.createdAt).getTime()) / 86_400_000;
  return {
    ...product,
    id: product._id,
    image: product.images?.[0],
    category: product.category?.name ?? product.category,
    categorySlug: product.category?.slug,
    reviews: product.numReviews ?? 0,
    isNew: ageInDays <= NEW_ARRIVAL_DAYS,
  };
};

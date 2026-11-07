import api from "./api";

const data = (request) => request.then((res) => res.data.data);
const page = (request) =>
  request.then((res) => ({ items: res.data.data, pagination: res.data.pagination }));

export const authService = {
  register: (body) => data(api.post("/auth/register", body)),
  login: (body) => data(api.post("/auth/login", body)),
  logout: () => data(api.post("/auth/logout")),
  me: () => data(api.get("/auth/me")),
  updateProfile: (body) => data(api.put("/auth/me", body)),
  forgotPassword: (body) => data(api.post("/auth/forgot-password", body)),
  resetPassword: (body) => data(api.post("/auth/reset-password", body)),
};

export const productService = {
  list: (params) => page(api.get("/products", { params })),
  filters: () => data(api.get("/products/filters")),
  get: (idOrSlug) => data(api.get(`/products/${idOrSlug}`)),
  reviews: (idOrSlug) => data(api.get(`/products/${idOrSlug}/reviews`)),
  create: (body) => data(api.post("/products", body)),
  update: (id, body) => data(api.put(`/products/${id}`, body)),
  remove: (id) => data(api.delete(`/products/${id}`)),
};

export const categoryService = {
  list: () => data(api.get("/categories")),
  create: (body) => data(api.post("/categories", body)),
  update: (id, body) => data(api.put(`/categories/${id}`, body)),
  remove: (id) => data(api.delete(`/categories/${id}`)),
};

export const reviewService = {
  create: (body) => data(api.post("/reviews", body)),
  recent: (limit = 6) => data(api.get("/reviews", { params: { limit } })),
};

export const cartService = {
  get: () => data(api.get("/cart")),
  add: (productId, quantity = 1) => data(api.post("/cart", { productId, quantity })),
  update: (productId, quantity) => data(api.put(`/cart/${productId}`, { quantity })),
  remove: (productId) => data(api.delete(`/cart/${productId}`)),
  clear: () => data(api.delete("/cart")),
  quote: (items, couponCode = "") =>
    data(api.post("/cart/quote", { items, couponCode })),
  addKit: (items) => data(api.post("/cart/kit", { items })),
  applyCoupon: (code) => data(api.post("/cart/coupon", { code })),
  removeCoupon: () => data(api.delete("/cart/coupon")),
};

export const wishlistService = {
  get: () => page(api.get("/wishlist")),
  toggle: (productId) => data(api.post("/wishlist/toggle", { productId })),
  remove: (productId) => data(api.delete(`/wishlist/${productId}`)),
};

export const addressService = {
  list: () => page(api.get("/addresses")),
  create: (body) => data(api.post("/addresses", body)),
  update: (id, body) => data(api.put(`/addresses/${id}`, body)),
  remove: (id) => data(api.delete(`/addresses/${id}`)),
  setDefault: (id) => data(api.put(`/addresses/${id}/default`)),
};

export const kitService = {
  config: () => data(api.get("/kit/config")),
  quote: (items) => data(api.post("/kit/quote", { items })),
};

export const orderService = {
  place: (body, idempotencyKey) =>
    data(
      api.post("/orders", body, {
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {},
      }),
    ),
  mine: () => page(api.get("/orders/my-orders")),
  get: (id, token) =>
    data(api.get(`/orders/${id}`, { params: token ? { token } : {} })),
  track: (body) => data(api.post("/orders/track", body)),
  remove: (id, token) =>
    data(api.delete(`/orders/${id}`, { params: token ? { token } : {} })),
  cancel: (id, token) =>
    data(api.put(`/orders/${id}/cancel`, {}, { params: token ? { token } : {} })),
  submitPayment: (id, reference, token) =>
    data(
      api.post(
        `/orders/${id}/payment`,
        { reference },
        { params: token ? { token } : {} },
      ),
    ),
};

export const paymentService = {
  config: () => data(api.get("/payment/config")),
};

export const adminService = {
  dashboard: () => data(api.get("/admin/dashboard")),
  orders: (params) => page(api.get("/admin/orders", { params })),
  deleteOrder: (id) => data(api.delete(`/admin/orders/${id}`)),
  updateOrderStatus: (id, body) => data(api.put(`/admin/orders/${id}/status`, body)),
  updatePaymentStatus: (id, body) => data(api.put(`/admin/orders/${id}/payment`, body)),
  customers: () => data(api.get("/admin/customers")),
  customerPage: (params) => page(api.get("/admin/customers", { params })),
  customer: (id) => data(api.get(`/admin/customers/${id}`)),
  deleteCustomer: (id) => data(api.delete(`/admin/customers/${id}`)),
  products: (params) => page(api.get("/admin/products", { params })),
  updateTracking: (id, body) => data(api.put(`/admin/orders/${id}/tracking`, body)),
  uploadImages: (files) => {
    const form = new FormData();
    files.forEach((file) => form.append("images", file));
    return data(api.post("/uploads", form)).then((res) => res.urls);
  },
  coupons: (params) => page(api.get("/admin/coupons", { params })),
  createCoupon: (body) => data(api.post("/admin/coupons", body)),
  updateCoupon: (id, body) => data(api.put(`/admin/coupons/${id}`, body)),
  deleteCoupon: (id) => data(api.delete(`/admin/coupons/${id}`)),
  inquiries: (params) => page(api.get("/admin/inquiries", { params })),
  deleteInquiry: (id) => data(api.delete(`/admin/inquiries/${id}`)),
  updateInquiry: (id, body) => data(api.put(`/admin/inquiries/${id}`, body)),
  subscribers: (params) => page(api.get("/admin/subscribers", { params })),
  reports: (params) => data(api.get("/admin/reports/sales", { params })),
  reviews: (params) => page(api.get("/admin/reviews", { params })),
  deleteReview: (id) => data(api.delete(`/admin/reviews/${id}`)),
  moderateReview: (id, body) => data(api.put(`/admin/reviews/${id}`, body)),
  exportUrl: (kind, params = {}) => {
    const query = new URLSearchParams(params).toString();
    const base = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    return `${base}/admin/reports/export/${kind}${query ? `?${query}` : ""}`;
  },
  subscribersExportUrl: () => {
    const base = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    return `${base}/admin/subscribers/export`;
  },
};

export const newsletterService = {
  subscribe: (email) => data(api.post("/newsletter", { email })),
  unsubscribe: (email) => data(api.post("/newsletter/unsubscribe", { email })),
};

export const contactService = {
  send: (body) => data(api.post("/contact", body)),
};

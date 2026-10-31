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
  quote: (items) => data(api.post("/cart/quote", { items })),
  addKit: (items) => data(api.post("/cart/kit", { items })),
};

export const kitService = {
  config: () => data(api.get("/kit/config")),
  quote: (items) => data(api.post("/kit/quote", { items })),
};

export const orderService = {
  place: (body) => data(api.post("/orders", body)),
  mine: () => data(api.get("/orders/my-orders")),
  get: (id) => data(api.get(`/orders/${id}`)),
  cancel: (id) => data(api.put(`/orders/${id}/cancel`)),
};

export const adminService = {
  dashboard: () => data(api.get("/admin/dashboard")),
  orders: (params) => page(api.get("/admin/orders", { params })),
  updateOrderStatus: (id, body) => data(api.put(`/admin/orders/${id}/status`, body)),
  customers: () => data(api.get("/admin/customers")),
  customerPage: (params) => page(api.get("/admin/customers", { params })),
  products: (params) => page(api.get("/admin/products", { params })),
  uploadImages: (files) => {
    const form = new FormData();
    files.forEach((file) => form.append("images", file));
    return data(api.post("/uploads", form)).then((res) => res.urls);
  },
};

export const newsletterService = {
  subscribe: (email) => data(api.post("/newsletter", { email })),
};

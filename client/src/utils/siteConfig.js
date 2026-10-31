export const siteConfig = {
  name: "Barware Store",
  contact: {
    address: import.meta.env.VITE_STORE_ADDRESS || "Add your store address",
    phone: import.meta.env.VITE_STORE_PHONE || "+91 00000 00000",
    email: import.meta.env.VITE_STORE_EMAIL || "hello@example.com",
  },
  freeShippingThreshold: 999,
};

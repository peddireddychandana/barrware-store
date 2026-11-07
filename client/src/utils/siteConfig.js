export const siteConfig = {
  name: "Vyrnt",
  brandName: "VYRNT",
  url: (import.meta.env.VITE_SITE_URL || "https://vyrnt.com").replace(/\/+$/, ""),
  description:
    "Shop precision-engineered barware at VYRNT. Shakers, jiggers, strainers, muddlers & custom bar kits. Free shipping above ₹999 & COD available.",
  company: {
    legalName: import.meta.env.VITE_COMPANY_LEGAL_NAME || "VYRNT",
    gstin: import.meta.env.VITE_COMPANY_GSTIN || "",
    jurisdiction: import.meta.env.VITE_COMPANY_JURISDICTION || "India",
    supportHours: import.meta.env.VITE_SUPPORT_HOURS || "Mon–Sat, 10:00–18:00 IST",
  },
  contact: {
    address: import.meta.env.VITE_STORE_ADDRESS || "Add your store address",
    phone: import.meta.env.VITE_STORE_PHONE || "+91 00000 00000",
    email: import.meta.env.VITE_STORE_EMAIL || "hello@example.com",
  },
  freeShippingThreshold: 999,
};

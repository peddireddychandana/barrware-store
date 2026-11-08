const { z } = require("zod");

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password is too long")
  .regex(/[A-Za-z]/, "Password must contain a letter")
  .regex(/\d/, "Password must contain a number");

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address").max(160));
const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");
const phone = z
  .string()
  .trim()
  .regex(/^[0-9+\-\s]{7,15}$/, "Enter a valid phone number");

const withPasswordConfirm = (shape) =>
  z.object(shape).refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const address = z.object({
  line1: z.string().trim().max(160).optional(),
  city: z.string().trim().max(80).optional(),
  state: z.string().trim().max(80).optional(),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Pincode must be 6 digits")
    .or(z.literal(""))
    .optional(),
});

const shippingAddress = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(100),
  email,
  phone,
  line1: z.string().trim().min(3, "Address line 1 is required").max(160),
  line2: z.string().trim().max(160).optional().default(""),
  city: z.string().trim().min(2, "City is required").max(80),
  state: z.string().trim().min(2, "State is required").max(80),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Pincode must be 6 digits"),
});

const quantity = z.coerce
  .number()
  .int("Quantity must be a whole number")
  .min(1)
  .max(50);
const keyValueList = z.array(
  z.object({ key: z.string().trim().min(1), value: z.string().trim().min(1) }),
);
const faqList = z.array(
  z.object({
    question: z.string().trim().min(1).max(200),
    answer: z.string().trim().min(1).max(1200),
  }),
);
const slug = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9-]*$/, "Slug can only contain letters, numbers and hyphens");

const variantPayload = z
  .object({
    variantName: z.string().trim().optional(),
    colorName: z.string().trim().optional(),
    colorHex: z.string().trim().optional(),
    finishType: z.string().trim().optional(),
    sku: z.string().trim().min(1, "Variant SKU is required"),
    barcode: z.string().trim().optional(),
    sellingPrice: z.coerce.number().min(0).optional(),
    compareAtPrice: z.coerce.number().min(0).optional(),
    costPerItem: z.coerce.number().min(0).optional(),
    stock: z.coerce.number().int().min(0).optional(),
    lowStockThreshold: z.coerce.number().int().min(0).optional(),
    images: z.array(z.string().trim()).optional(),
    status: z.enum(["active", "inactive"]).optional(),
  })
  .passthrough();

const mediaPayload = z
  .object({
    originalName: z.string().trim().optional(),
    webpUrl: z.string().trim().optional(),
    url: z.string().trim().optional(),
    thumbnailUrl: z.string().trim().optional(),
    mediumUrl: z.string().trim().optional(),
    largeUrl: z.string().trim().optional(),
    altText: z.string().trim().optional(),
    assetType: z
      .enum(["hero", "lifestyle", "dimension-chart", "gift-box", "gallery"])
      .optional(),
    order: z.coerce.number().optional(),
    width: z.coerce.number().optional(),
    height: z.coerce.number().optional(),
    fileSize: z.coerce.number().optional(),
  })
  .passthrough();

const productFields = {
  name: z.string().trim().min(1, "Product title is required"),
  title: z.string().trim().optional(),
  slug: slug.optional(),
  subtitle: z.string().trim().optional(),
  brand: z.string().trim().optional(),
  vendor: z.string().trim().optional(),
  sku: z.string().trim().min(3).max(40).optional(),
  shortDescription: z.string().trim().optional(),
  description: z.string().optional(),
  metaTitle: z.string().trim().optional(),
  metaDescription: z.string().trim().optional(),
  imageAltText: z.string().trim().optional(),
  price: z.coerce.number().min(0).optional(),
  originalPrice: z.coerce.number().min(0).optional(),
  costPerItem: z.coerce.number().min(0).optional(),
  gstRate: z.coerce.number().min(0).optional(),
  taxInclusive: z.boolean().optional(),
  category: z.string().trim().min(1),
  productType: z.string().trim().min(1),
  material: z.string().trim().optional(),
  colour: z.string().trim().optional(),
  size: z.string().trim().optional(),
  capacity: z.string().trim().optional(),
  weight: z.string().trim().optional(),
  specifications: keyValueList.optional(),
  features: z.array(z.string().trim().min(1)).optional(),
  keyFeatures: z.array(z.string().trim().min(1)).optional(),
  highlights: keyValueList.max(3).optional(),
  faqs: faqList.max(12).optional(),
  images: z.array(z.string().trim().min(1)).optional(),
  mediaAssets: z.array(mediaPayload).optional(),
  collections: z.array(z.string().trim()).optional(),
  tags: z.array(z.string().trim()).optional(),
  variantsEnabled: z.boolean().optional(),
  variants: z.array(variantPayload).optional(),
  relatedProducts: z.array(z.string()).optional(),
  salesChannels: z.array(z.string().trim()).optional(),
  status: z.enum(["draft", "active", "archived"]).optional(),
  giftPackaging: z
    .object({
      enabled: z.boolean().optional(),
      eligible: z.boolean().optional(),
      description: z.string().trim().optional(),
      giftCard: z.boolean().optional(),
      additionalInfo: z.string().trim().optional(),
    })
    .optional(),
  seo: z
    .object({
      metaTitle: z.string().trim().optional(),
      metaDescription: z.string().trim().optional(),
      slug: z.string().trim().optional(),
    })
    .optional(),
  barcode: z.string().trim().optional(),
  lowStockThreshold: z.coerce.number().int().min(0).optional(),
  packageWeight: z.coerce.number().min(0).optional(),
  dimensions: z
    .object({
      length: z.coerce.number().min(0).optional(),
      width: z.coerce.number().min(0).optional(),
      height: z.coerce.number().min(0).optional(),
    })
    .optional(),
  fragile: z.boolean().optional(),
  printLabelWarning: z.boolean().optional(),
  stock: z.coerce.number().int().min(0).optional(),
  featured: z.boolean().optional(),
  bestSeller: z.boolean().optional(),
  premium: z.boolean().optional(),
  isActive: z.boolean().optional(),
};

module.exports = {
  register: withPasswordConfirm({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(80),
    email,
    password,
    confirmPassword: z.string(),
  }),
  login: z.object({
    email,
    password: z.string().min(1, "Password is required"),
  }),
  updateMe: z.object({
    name: z.string().trim().min(2).max(80).optional(),
    phone: phone.or(z.literal("")).optional(),
    address: address.optional(),
  }),
  forgotPassword: z.object({ email }),
  resetPassword: withPasswordConfirm({
    token: z.string().min(10),
    password,
    confirmPassword: z.string(),
  }),
  cartAdd: z.object({
    productId: objectId,
    variantId: objectId.optional(),
    quantity: quantity.optional().default(1),
  }),
  cartUpdate: z.object({
    quantity: z.coerce.number().int().min(0).max(50),
    variantId: objectId.optional(),
  }),
  cartQuote: z.object({
    items: z
      .array(
        z.object({
          productId: objectId,
          variantId: objectId.optional(),
          quantity,
        }),
      )
      .max(100),
    couponCode: z.string().trim().max(40).optional().default(""),
  }),
  couponApply: z.object({
    code: z.string().trim().min(2, "Enter a coupon code").max(40),
  }),
  trackOrder: z.object({ orderNumber: z.string().trim().min(4), email }),
  kitItems: z.object({
    items: z
      .array(z.object({ slot: z.string().min(1), productId: objectId }))
      .min(1, "Select at least one product")
      .max(6),
  }),
  createOrder: z.object({
    shippingAddress,
    paymentMethod: z
      .enum(["COD", "UPI"], { error: "Choose Cash on Delivery or UPI" })
      .default("COD"),
    couponCode: z.string().trim().max(40).optional().default(""),
    /** Guest checkout only; members order from their server-side cart. */
    items: z
      .array(
        z.object({
          productId: objectId,
          variantId: objectId.optional(),
          quantity,
          kitId: z.string().trim().max(80).optional(),
        }),
      )
      .max(100)
      .optional(),
  }),
  submitPayment: z.object({
    reference: z
      .string()
      .trim()
      .min(6, "Enter the UPI transaction / UTR ID")
      .max(80, "Transaction ID is too long"),
  }),
  paymentStatus: z.object({
    status: z.enum(["paid", "failed"], { error: "Choose paid or failed" }),
    note: z.string().trim().max(300).optional(),
  }),
  orderStatus: z.object({
    status: z.enum([
      "confirmed",
      "packed",
      "shipped",
      "out_for_delivery",
      "delivered",
      "cancelled",
    ]),
    note: z.string().trim().max(300).optional(),
    tracking: z
      .object({
        carrier: z.string().trim().max(80).optional(),
        number: z.string().trim().max(120).optional(),
        url: z.string().trim().max(500).optional(),
      })
      .optional(),
  }),
  orderTracking: z.object({
    carrier: z.string().trim().max(80).optional().default(""),
    number: z.string().trim().max(120).optional().default(""),
    url: z.string().trim().max(500).optional().default(""),
  }),
  couponPayload: z.object({
    code: z
      .string()
      .trim()
      .min(2)
      .max(40)
      .regex(/^[A-Za-z0-9_-]+$/, "Use letters, numbers, hyphens or underscores"),
    description: z.string().trim().max(200).optional().default(""),
    type: z.enum(["percent", "fixed"]).default("percent"),
    value: z.coerce.number().min(0),
    minSubtotal: z.coerce.number().min(0).optional().default(0),
    maxDiscount: z.coerce.number().min(0).optional().default(0),
    usageLimit: z.coerce.number().int().min(0).optional().default(0),
    perUserLimit: z.coerce.number().int().min(0).optional().default(0),
    startsAt: z.coerce.date().optional(),
    expiresAt: z.coerce.date().optional(),
    isActive: z.boolean().optional(),
  }),
  couponUpdate: z
    .object({
      code: z
        .string()
        .trim()
        .min(2)
        .max(40)
        .regex(
          /^[A-Za-z0-9_-]+$/,
          "Use letters, numbers, hyphens or underscores",
        ),
      description: z.string().trim().max(200),
      type: z.enum(["percent", "fixed"]),
      value: z.coerce.number().min(0),
      minSubtotal: z.coerce.number().min(0),
      maxDiscount: z.coerce.number().min(0),
      usageLimit: z.coerce.number().int().min(0),
      perUserLimit: z.coerce.number().int().min(0),
      startsAt: z.coerce.date(),
      expiresAt: z.coerce.date(),
      isActive: z.boolean(),
    })
    .partial(),
  inquiryCreate: z.object({
    name: z.string().trim().min(2, "Your name is required").max(100),
    email,
    phone: phone.or(z.literal("")).optional().default(""),
    subject: z.string().trim().max(140).optional().default(""),
    message: z.string().trim().min(5, "Please add a message").max(2000),
  }),
  inquiryStatus: z.object({
    status: z.enum(["new", "read", "resolved"]),
  }),
  wishlistToggle: z.object({ productId: objectId }),
  addressPayload: z.object({
    label: z.string().trim().max(40).optional().default("Home"),
    fullName: z.string().trim().min(2).max(100),
    phone,
    line1: z.string().trim().min(3).max(160),
    line2: z.string().trim().max(160).optional().default(""),
    city: z.string().trim().min(2).max(80),
    state: z.string().trim().min(2).max(80),
    pincode: z.string().trim().regex(/^\d{6}$/, "Pincode must be 6 digits"),
    isDefault: z.boolean().optional().default(false),
  }),
  reviewModerate: z.object({
    isApproved: z.boolean().optional(),
    isHidden: z.boolean().optional(),
  }),
  createReview: z.object({
    productId: objectId,
    rating: z.coerce.number().int().min(1).max(5),
    title: z.string().trim().max(120).optional().default(""),
    comment: z.string().trim().max(2000).optional().default(""),
  }),
  newsletter: z.object({ email }),
  productCreate: z.object(productFields).passthrough(),
  productUpdate: z.object(productFields).partial().passthrough(),
  categoryCreate: z.object({
    name: z.string().trim().min(2).max(80),
    slug: slug.optional(),
    description: z.string().trim().max(600).optional(),
    metaTitle: z.string().trim().max(65).optional(),
    metaDescription: z.string().trim().max(160).optional(),
    imageAltText: z.string().trim().max(200).optional(),
    seoContent: z.string().trim().max(5000).optional(),
    faqs: faqList.max(12).optional(),
    image: z.string().trim().optional(),
  }),
  categoryUpdate: z
    .object({
      name: z.string().trim().min(2).max(80),
      slug,
      description: z.string().trim().max(600),
      metaTitle: z.string().trim().max(65),
      metaDescription: z.string().trim().max(160),
      imageAltText: z.string().trim().max(200),
      seoContent: z.string().trim().max(5000),
      faqs: faqList.max(12),
      image: z.string().trim(),
    })
    .partial(),
};

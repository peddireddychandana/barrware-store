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

const productFields = {
  name: z.string().trim().min(2).max(140),
  slug: slug.optional(),
  sku: z.string().trim().min(3).max(40).optional(),
  shortDescription: z.string().trim().max(300).optional(),
  description: z.string().trim().max(4000).optional(),
  metaTitle: z.string().trim().max(65).optional(),
  metaDescription: z.string().trim().max(160).optional(),
  imageAltText: z.string().trim().max(200).optional(),
  price: z.coerce.number().min(0),
  originalPrice: z.coerce.number().min(0).optional(),
  category: z.string().trim().min(1),
  productType: z.string().trim().min(1),
  material: z.string().trim().max(80).optional(),
  colour: z.string().trim().max(60).optional(),
  size: z.string().trim().max(60).optional(),
  capacity: z.string().trim().max(60).optional(),
  weight: z.string().trim().max(60).optional(),
  specifications: keyValueList.optional(),
  features: z.array(z.string().trim().min(1)).optional(),
  highlights: keyValueList.max(3).optional(),
  faqs: faqList.max(12).optional(),
  images: z.array(z.string().trim().min(1)).optional(),
  stock: z.coerce.number().int().min(0),
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
    quantity: quantity.optional().default(1),
  }),
  cartUpdate: z.object({ quantity: z.coerce.number().int().min(0).max(50) }),
  cartQuote: z.object({
    items: z.array(z.object({ productId: objectId, quantity })).max(100),
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
  returnCreate: z.object({
    reason: z.string().trim().min(3, "Tell us why you are returning this").max(500),
    items: z
      .array(
        z.object({
          productId: objectId,
          quantity: z.coerce.number().int().min(1).max(50),
        }),
      )
      .min(1, "Select at least one item")
      .max(100),
  }),
  returnStatus: z.object({
    status: z.enum(["approved", "rejected", "received", "refunded"]),
    note: z.string().trim().max(300).optional(),
    refundAmount: z.coerce.number().min(0).optional(),
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
  productCreate: z.object(productFields),
  productUpdate: z.object(productFields).partial(),
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

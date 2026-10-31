export const PRODUCT_TYPES = [
  { slug: "cocktail-shaker", name: "Cocktail Shaker" },
  { slug: "hawthorne-strainer", name: "Hawthorne Strainer" },
  { slug: "wooden-muddler", name: "Wooden Muddler" },
  { slug: "dual-jigger", name: "Dual Jigger" },
  { slug: "sommelier-corkscrew", name: "Sommelier Corkscrew" },
  { slug: "tempered-shot-glass", name: "Tempered Shot Glass" },
  { slug: "fine-mesh-strainer", name: "Fine Mesh Strainer" },
  { slug: "bar-spoon", name: "Bar Spoon" },
  { slug: "ice-tongs", name: "Ice Tongs" },
  { slug: "bottle-pourer", name: "Bottle Pourer" },
  { slug: "mixing-glass", name: "Mixing Glass" },
  { slug: "tool-set", name: "Bartender Tool Set" },
];

export const LOW_STOCK_LIMIT = 10;
const HIGHLIGHT_SLOTS = 3;

const emptyPair = () => ({ key: "", value: "" });

export const emptyProductForm = () => ({
  name: "",
  category: "",
  productType: "",
  shortDescription: "",
  description: "",
  price: "",
  originalPrice: "",
  stock: "0",
  sku: "",
  material: "",
  colour: "",
  size: "",
  capacity: "",
  weight: "",
  specifications: [],
  features: [],
  highlights: Array.from({ length: HIGHLIGHT_SLOTS }, emptyPair),
  images: [],
  featured: false,
  bestSeller: false,
  premium: false,
  isActive: true,
});

export const formFromProduct = (product) => {
  const base = emptyProductForm();
  const highlights = [...(product.highlights ?? [])].slice(0, HIGHLIGHT_SLOTS);
  while (highlights.length < HIGHLIGHT_SLOTS) highlights.push(emptyPair());
  return {
    ...base,
    ...Object.fromEntries(
      Object.keys(base)
        .filter(
          (field) =>
            product[field] != null &&
            !["category", "price", "originalPrice", "stock"].includes(field),
        )
        .map((field) => [field, product[field]]),
    ),
    category: product.category?._id ?? product.category ?? "",
    price: String(product.price ?? ""),
    originalPrice: String(product.originalPrice ?? ""),
    stock: String(product.stock ?? 0),
    specifications: (product.specifications ?? []).map(({ key, value }) => ({ key, value })),
    highlights: highlights.map(({ key, value }) => ({ key, value })),
  };
};

export const discountPercent = (price, originalPrice) => {
  const sell = Number(price);
  const original = Number(originalPrice);
  if (!original || original <= sell) return 0;
  return Math.round(((original - sell) / original) * 100);
};

/** Returns the first validation problem in the form, or null. */
export const validateProductForm = (form) => {
  if (form.name.trim().length < 2) return "Product name must be at least 2 characters";
  if (!form.category) return "Choose a category";
  if (!form.productType) return "Choose a product type";
  if (form.price === "" || Number(form.price) < 0) return "Enter a valid price";
  if (form.originalPrice !== "" && Number(form.originalPrice) < Number(form.price)) {
    return "Original price cannot be lower than the price";
  }
  if (!Number.isInteger(Number(form.stock)) || Number(form.stock) < 0)
    return "Stock must be a whole number, 0 or more";
  if (form.sku.trim() && form.sku.trim().length < 3) return "SKU must be at least 3 characters";
  const isHalfFilled = (row) => !!row.key.trim() !== !!row.value.trim();
  if ([...form.specifications, ...form.highlights].some(isHalfFilled)) {
    return "Specifications and highlights need both a label and a value";
  }
  return null;
};

const completePairs = (rows) =>
  rows
    .map(({ key, value }) => ({ key: key.trim(), value: value.trim() }))
    .filter(({ key, value }) => key && value);

/** Builds the API payload from form state (drops blank rows, coerces numbers). */
export const buildProductPayload = (form) => {
  const { sku, price, originalPrice, stock, specifications, features, highlights, ...rest } = form;
  return {
    ...rest,
    ...(sku.trim() && { sku: sku.trim() }),
    price: Number(price),
    originalPrice: originalPrice === "" ? Number(price) : Number(originalPrice),
    stock: Number(stock),
    specifications: completePairs(specifications),
    features: features.map((f) => f.trim()).filter(Boolean),
    highlights: completePairs(highlights),
  };
};

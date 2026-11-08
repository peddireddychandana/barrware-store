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

export const COLLECTIONS = [
  "House Bar Essentials",
  "Pub & Commercial Barware",
  "Luxury Gifting Hampers",
  "Modern House Decor Accents",
];

export const SALES_CHANNELS = [
  { value: "online", label: "Online Store" },
  { value: "meta", label: "Instagram & Facebook Catalog" },
  { value: "amazon", label: "Amazon India Brand Store" },
];

export const ASSET_TYPES = [
  { value: "hero", label: "Hero / Thumbnail" },
  { value: "lifestyle", label: "Home Bar Counter (Lifestyle)" },
  { value: "dimension-chart", label: "Dimension Chart" },
  { value: "gift-box", label: "Luxury Gift Box" },
  { value: "gallery", label: "Additional Gallery" },
];

export const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active (Visible on Store)" },
  { value: "archived", label: "Archived" },
];

export const GST_RATES = [0, 5, 12, 18, 28];

export const slugify = (text) =>
  String(text || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const emptyVariant = () => ({
  _id: undefined,
  variantName: "",
  colorName: "",
  colorHex: "#1a1a1a",
  finishType: "",
  sku: "",
  barcode: "",
  sellingPrice: "",
  compareAtPrice: "",
  costPerItem: "",
  stock: "0",
  lowStockThreshold: "10",
  images: [],
  status: "active",
});

export const emptyAsset = () => ({
  _id: undefined,
  originalName: "",
  webpUrl: "",
  thumbnailUrl: "",
  mediumUrl: "",
  largeUrl: "",
  altText: "",
  assetType: "gallery",
  order: 0,
  width: 0,
  height: 0,
  fileSize: 0,
});

export const emptyEditorForm = () => ({
  title: "",
  slug: "",
  slugManual: false,
  subtitle: "",
  keyFeatures: [""],
  description: "",
  category: "",
  productType: "",
  brand: "",
  vendor: "",
  collections: [],
  tags: [],
  variantsEnabled: false,
  variants: [],
  mediaAssets: [],
  images: [],
  price: "",
  originalPrice: "",
  costPerItem: "",
  gstRate: 18,
  taxInclusive: true,
  sku: "",
  barcode: "",
  stock: "0",
  lowStockThreshold: "10",
  packageWeight: "",
  dimensions: { length: "", width: "", height: "" },
  fragile: false,
  printLabelWarning: false,
  relatedProducts: [],
  giftPackaging: {
    enabled: false,
    eligible: false,
    description: "",
    giftCard: false,
    additionalInfo: "",
  },
  seo: { metaTitle: "", metaDescription: "" },
  salesChannels: ["online"],
  status: "draft",
  featured: false,
  bestSeller: false,
  premium: false,
  material: "",
  colour: "",
  size: "",
  capacity: "",
  weight: "",
  shortDescription: "",
});

const stringNum = (value) => (value === 0 || value ? String(value) : "");

const htmlToText = (value) => {
  const text = String(value ?? "");
  if (!/<[a-z][\s\S]*>/i.test(text)) return text;
  return text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<\/(p|div|h[1-6]|li|ul|ol)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

export const formFromProduct = (product) => {
  const base = emptyEditorForm();
  if (!product) return base;
  const assets = (product.mediaAssets ?? []).map((asset) => ({
    ...emptyAsset(),
    ...asset,
    order: asset.order ?? 0,
  }));
  const legacyAssets =
    assets.length > 0
      ? assets
      : (product.images ?? []).map((url, index) => ({
          ...emptyAsset(),
          webpUrl: url,
          thumbnailUrl: url,
          mediumUrl: url,
          largeUrl: url,
          assetType: index === 0 ? "hero" : "gallery",
          order: index,
          originalName: "",
        }));
  const keyFeatures =
    product.keyFeatures?.length || product.features?.length
      ? [...(product.keyFeatures?.length ? product.keyFeatures : product.features)]
      : [""];
  return {
    ...base,
    title: product.title || product.name || "",
    slug: product.slug || "",
    slugManual: true,
    subtitle: product.subtitle || "",
    keyFeatures,
    description: htmlToText(product.description),
    category: product.category?._id || product.category || "",
    productType: product.productType || "",
    brand: product.brand || product.vendor || "",
    vendor: product.vendor || "",
    collections: product.collections ?? [],
    tags: product.tags ?? [],
    variantsEnabled: Boolean(product.variantsEnabled || product.variants?.length),
    variants: (product.variants ?? []).map((variant) => ({
      ...emptyVariant(),
      ...variant,
      sellingPrice: stringNum(variant.sellingPrice),
      compareAtPrice: stringNum(variant.compareAtPrice),
      costPerItem: stringNum(variant.costPerItem),
      stock: stringNum(variant.stock),
      lowStockThreshold: stringNum(variant.lowStockThreshold ?? 10),
      images: variant.images ?? [],
    })),
    mediaAssets: legacyAssets,
    images: product.images ?? [],
    price: stringNum(product.price),
    originalPrice: stringNum(product.originalPrice),
    costPerItem: stringNum(product.costPerItem),
    gstRate: product.gstRate ?? 18,
    taxInclusive: product.taxInclusive !== false,
    sku: product.sku || "",
    barcode: product.barcode || "",
    stock: stringNum(product.stock),
    lowStockThreshold: stringNum(product.lowStockThreshold ?? 10),
    packageWeight: stringNum(product.packageWeight),
    dimensions: {
      length: stringNum(product.dimensions?.length),
      width: stringNum(product.dimensions?.width),
      height: stringNum(product.dimensions?.height),
    },
    fragile: Boolean(product.fragile),
    printLabelWarning: Boolean(product.printLabelWarning),
    relatedProducts: (product.relatedProducts ?? [])
      .map((item) => (typeof item === "string" ? item : item._id))
      .filter(Boolean),
    giftPackaging: { ...base.giftPackaging, ...(product.giftPackaging ?? {}) },
    seo: {
      metaTitle: product.seo?.metaTitle || product.metaTitle || "",
      metaDescription:
        product.seo?.metaDescription || product.metaDescription || "",
    },
    salesChannels: product.salesChannels?.length
      ? product.salesChannels
      : ["online"],
    status: product.status || (product.isActive === false ? "draft" : "active"),
    featured: Boolean(product.featured),
    bestSeller: Boolean(product.bestSeller),
    premium: Boolean(product.premium),
    material: product.material || "",
    colour: product.colour || "",
    size: product.size || "",
    capacity: product.capacity || "",
    weight: product.weight || "",
    shortDescription: product.shortDescription || "",
  };
};

export const calcPricing = (form) => {
  const price = Number(form.price) || 0;
  const cost = Number(form.costPerItem) || 0;
  const mrp = Number(form.originalPrice) || 0;
  const grossProfit = price - cost;
  const margin = price > 0 ? (grossProfit / price) * 100 : 0;
  const discount = mrp > price && mrp > 0 ? ((mrp - price) / mrp) * 100 : 0;
  return {
    grossProfit,
    margin,
    discount,
  };
};

export const inventoryState = (stock, threshold) => {
  const s = Number(stock) || 0;
  const t = Number(threshold) || 0;
  if (s <= 0)
    return { label: "Out of Stock", tone: "danger", className: "text-destructive" };
  if (s <= t)
    return { label: "Low Stock", tone: "warning", className: "text-amber-400" };
  return { label: "In Stock", tone: "success", className: "text-emerald-400" };
};

const cleanList = (list) =>
  (list ?? []).map((value) => String(value).trim()).filter(Boolean);

export const buildEditorPayload = (form) => {
  const variants = form.variantsEnabled
    ? form.variants.map((variant) => ({
        ...(variant._id ? { _id: variant._id } : {}),
        variantName: variant.variantName || variant.colorName,
        colorName: variant.colorName,
        colorHex: variant.colorHex,
        finishType: variant.finishType,
        sku: variant.sku.trim().toUpperCase(),
        barcode: variant.barcode,
        sellingPrice: Number(variant.sellingPrice) || 0,
        compareAtPrice: Number(variant.compareAtPrice) || 0,
        costPerItem: Number(variant.costPerItem) || 0,
        stock: Number(variant.stock) || 0,
        lowStockThreshold: Number(variant.lowStockThreshold) || 0,
        images: cleanList(variant.images),
        status: variant.status,
      }))
    : [];
  const mediaAssets = form.mediaAssets.map((asset, index) => ({
    ...(asset._id ? { _id: asset._id } : {}),
    originalName: asset.originalName,
    webpUrl: asset.webpUrl,
    thumbnailUrl: asset.thumbnailUrl || asset.webpUrl,
    mediumUrl: asset.mediumUrl || asset.webpUrl,
    largeUrl: asset.largeUrl || asset.webpUrl,
    altText: asset.altText,
    assetType: asset.assetType,
    order: index,
    width: asset.width,
    height: asset.height,
    fileSize: asset.fileSize,
  }));
  const title = form.title.trim();
  return {
    name: title,
    title,
    slug: form.slug.trim() || slugify(title),
    subtitle: form.subtitle,
    shortDescription: form.shortDescription || form.subtitle,
    brand: form.brand,
    vendor: form.vendor || form.brand,
    category: form.category,
    productType: form.productType,
    keyFeatures: cleanList(form.keyFeatures),
    features: cleanList(form.keyFeatures),
    description: form.description,
    collections: cleanList(form.collections),
    tags: cleanList(form.tags),
    variantsEnabled: form.variantsEnabled,
    variants,
    mediaAssets,
    images: mediaAssets.map((asset) => asset.webpUrl).filter(Boolean),
    price: Number(form.price) || 0,
    originalPrice: Number(form.originalPrice) || Number(form.price) || 0,
    costPerItem: Number(form.costPerItem) || 0,
    gstRate: Number(form.gstRate) || 0,
    taxInclusive: Boolean(form.taxInclusive),
    sku: form.sku.trim() || undefined,
    barcode: form.barcode,
    stock: Number(form.stock) || 0,
    lowStockThreshold: Number(form.lowStockThreshold) || 0,
    packageWeight: Number(form.packageWeight) || 0,
    dimensions: {
      length: Number(form.dimensions.length) || 0,
      width: Number(form.dimensions.width) || 0,
      height: Number(form.dimensions.height) || 0,
    },
    fragile: Boolean(form.fragile),
    printLabelWarning: Boolean(form.printLabelWarning),
    relatedProducts: form.relatedProducts,
    giftPackaging: form.giftPackaging,
    seo: {
      metaTitle: form.seo.metaTitle,
      metaDescription: form.seo.metaDescription,
      slug: form.slug.trim() || slugify(title),
    },
    salesChannels: form.salesChannels,
    status: form.status,
    featured: Boolean(form.featured),
    bestSeller: Boolean(form.bestSeller),
    premium: Boolean(form.premium),
    material: form.material,
    colour: form.colour,
    size: form.size,
    capacity: form.capacity,
    weight: form.weight,
  };
};

export const validateEditor = (form, { publishing = false } = {}) => {
  if (!form.title.trim()) return "Product title is required";
  if (!form.category) return "Choose a primary category";
  if (!form.productType) return "Choose a product type";
  if (!form.slug.trim()) return "Add a URL slug";
  if (!publishing) return null;
  if (!form.mediaAssets.length && !form.images.length)
    return "Add at least one product image before publishing";
  if (form.variantsEnabled) {
    if (!form.variants.length) return "Add at least one variant or disable variants";
    const skus = form.variants.map((v) => v.sku.trim().toUpperCase());
    if (skus.some((sku) => !sku)) return "Every variant needs a SKU";
    if (new Set(skus).size !== skus.length) return "Variant SKUs must be unique";
    if (form.variants.some((v) => !Number(v.sellingPrice) && Number(v.sellingPrice) !== 0))
      return "Every variant needs a selling price";
  } else if (form.price === "" || Number(form.price) <= 0) {
    return "Enter a selling price before publishing";
  }
  if (!form.salesChannels.length) return "Select at least one sales channel";
  return null;
};

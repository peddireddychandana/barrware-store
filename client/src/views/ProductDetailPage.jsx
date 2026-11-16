import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "@/components/AppLink";
import { useTranslation } from "react-i18next";
import { useParams, useRouter } from "@/lib/router";
import {
  ArrowLeft,
  Check,
  Headphones,
  Heart,
  Minus,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useProduct } from "@/hooks/useCatalog";
import { formatPrice } from "@/utils/format";
import PageShell from "@/components/PageShell";
import SEOHead from "@/components/SEOHead";
import ProductCard from "@/components/ProductCard";
import ProductReviews from "@/components/ProductReviews";
import RatingStars from "@/components/RatingStars";

const LOW_STOCK_THRESHOLD = 10;

const getStockLabel = (stock, threshold = LOW_STOCK_THRESHOLD) => {
  if (stock <= 0) return { text: "Out of stock", className: "text-destructive" };
  if (stock <= threshold)
    return { text: `Only ${stock} left`, className: "text-primary" };
  return { text: "In stock", className: "text-primary" };
};

const titleCase = (value) =>
  String(value || "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatDimensions = (dimensions) => {
  if (!dimensions) return "";
  const { length, width, height } = dimensions;
  if (!length && !width && !height) return "";
  return [length, width, height]
    .map((value) => (value ? `${value}` : "0"))
    .join(" × ") + " cm";
};

const buildInformationRows = (product, t) => {
  const notAvailable = t("product.notAvailable");
  const rows = [
    [t("product.brand"), product.brand || product.vendor],
    [t("product.category"), product.category],
    [t("product.productType"), titleCase(product.productType)],
    [t("product.material"), product.material],
    [t("product.colour"), product.colour],
    [t("product.finish"), product.finish],
    [t("product.design"), product.design],
    [t("product.baseType"), product.baseType],
    [t("product.craftsmanship"), product.craftsmanship],
    [t("product.size"), product.size],
    [t("product.capacity"), product.capacity],
    [t("product.weight"), product.weight],
    [t("product.dimensions"), formatDimensions(product.dimensions)],
    [t("product.packageContents"), product.packageContents],
    [t("product.countryOfOrigin"), product.countryOfOrigin],
    [t("product.careInstructions"), product.careInstructions],
    [t("product.modelNumber"), product.modelNumber],
    [t("product.sku"), product.sku],
  ].map(([key, value]) => ({ key, value: value || notAvailable }));

  const known = new Set(
    [
      "material",
      "colour",
      "finish",
      "design",
      "size",
      "capacity",
      "weight",
      "sku",
    ].map((key) => key.toLowerCase()),
  );
  const extra = (product.specifications ?? [])
    .filter(({ key }) => key && !known.has(key.toLowerCase()))
    .map(({ key, value }) => ({ key, value }));

  return [...rows, ...extra];
};

const Gallery = ({ product }) => {
  const images = product.images?.length ? product.images : [product.image].filter(Boolean);
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-secondary border border-border">
        <motion.img
          key={images[activeIndex]}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          src={images[activeIndex]}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {product.discountPercent > 0 && (
          <span className="absolute top-4 left-4 px-3 py-1 bg-destructive text-destructive-foreground text-[10px] font-semibold uppercase tracking-widest rounded-full">
            -{product.discountPercent}%
          </span>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-3 mt-4">
          {images.map((src, index) => (
            <button
              key={`${src}-${index}`}
              onClick={() => setActiveIndex(index)}
              aria-label={`View image ${index + 1}`}
              className={`w-20 h-20 overflow-hidden rounded-xl border-2 transition-colors ${
                index === activeIndex ? "border-primary" : "border-border hover:border-primary/40"
              }`}
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const VariantSelector = ({ variants, selectedId, onSelect }) => (
  <div className="mb-6">
    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
      Finish / Variant
    </p>
    <div className="flex flex-wrap gap-2">
      {variants.map((variant) => {
        const active = String(variant._id) === String(selectedId);
        const label = variant.variantName || variant.colorName || "Default";
        return (
          <button
            key={variant._id}
            type="button"
            onClick={() => onSelect(String(variant._id))}
            aria-pressed={active}
            className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors ${
              active
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            <span
              className="w-4 h-4 rounded-full border border-border"
              style={{ backgroundColor: variant.colorHex || "#1a1a1a" }}
            />
            <span>{label}</span>
            {variant.finishType && (
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {variant.finishType}
              </span>
            )}
          </button>
        );
      })}
    </div>
  </div>
);

const NotFoundMessage = () => (
  <div className="text-center py-24">
    <h1 className="text-5xl font-display mb-4">
      PRODUCT <span className="text-gradient">NOT FOUND</span>
    </h1>
    <p className="text-muted-foreground mb-8">
      This product doesn&apos;t exist or is no longer available.
    </p>
    <Link
      href="/products"
      className="inline-block gradient-neon text-primary-foreground px-8 py-3 font-semibold uppercase tracking-wide rounded-full neon-glow"
    >
      Browse All Products
    </Link>
  </div>
);

const ProductDetailPage = () => {
  const { slug } = useParams();
  const { t } = useTranslation();
  const router = useRouter();
  const { addToCart } = useCart();
  const { isWishlisted, toggle: toggleWishlist } = useWishlist();
  const { data: product, isLoading, isError } = useProduct(slug);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    setQuantity(1);
    setSelectedVariantId("");
  }, [slug]);

  if (isLoading) {
    return (
      <PageShell>
        <div className="py-32 text-center text-muted-foreground">Loading product...</div>
      </PageShell>
    );
  }
  if (isError || !product) {
    return (
      <PageShell>
        <NotFoundMessage />
      </PageShell>
    );
  }

  const variants = (product.variants ?? []).filter(
    (variant) => variant.status !== "inactive",
  );
  const selectedVariant =
    variants.find((variant) => String(variant._id) === String(selectedVariantId)) ??
    (variants.length ? variants[0] : null);
  const displayPrice = selectedVariant
    ? selectedVariant.sellingPrice
    : product.price;
  const displayOriginal = selectedVariant
    ? selectedVariant.compareAtPrice || selectedVariant.sellingPrice
    : product.originalPrice;
  const stockValue = selectedVariant ? selectedVariant.stock : product.stock;
  const displayImages =
    selectedVariant?.images?.length > 0 ? selectedVariant.images : product.images;
  const discountPercent =
    displayOriginal > displayPrice && displayOriginal > 0
      ? Math.round(((displayOriginal - displayPrice) / displayOriginal) * 100)
      : 0;
  const stock = getStockLabel(
    stockValue,
    selectedVariant?.lowStockThreshold ?? product.lowStockThreshold,
  );
  const isOutOfStock = stockValue <= 0;
  const maxQuantity = Math.max(stockValue, 1);
  const specRows = buildInformationRows(product, t);
  const variantLabel = selectedVariant
    ? selectedVariant.variantName || selectedVariant.colorName || ""
    : "";

  const handleSelectVariant = (variantId) => {
    setSelectedVariantId(variantId);
    setQuantity(1);
  };

  const handleAddToCart = async () => {
    setIsBusy(true);
    const added = await addToCart(product, quantity, selectedVariant?._id);
    setIsBusy(false);
    if (added)
      toast.success(
        `${quantity} × ${product.name}${variantLabel ? ` (${variantLabel})` : ""} added to cart`,
      );
  };

  const handleBuyNow = async () => {
    setIsBusy(true);
    const added = await addToCart(product, quantity, selectedVariant?._id);
    setIsBusy(false);
    if (added) router.push("/checkout");
  };

  return (
    <PageShell>
      <SEOHead
        product={product}
        breadcrumbs={[
          { name: "Home", path: "/" },
          {
            name: product.category ?? "Products",
            path: product.categorySlug
              ? `/category/${product.categorySlug}`
              : "/products",
          },
          { name: product.name, path: `/products/${product.slug}` },
        ]}
      />
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-8">
        <Link
          href={product.categorySlug ? `/category/${product.categorySlug}` : "/products"}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to {product.category ?? "Products"}
        </Link>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-10 lg:gap-14">
        <Gallery
          key={`${product._id}-${selectedVariant?._id ?? "base"}`}
          product={{ ...product, images: displayImages }}
        />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">
            {product.category}
          </p>
          <h1 className="text-4xl md:text-5xl font-display mb-4">{product.name}</h1>

          <div className="flex items-center gap-3 mb-5">
            <RatingStars value={product.rating} />
            <span className="text-sm text-muted-foreground">
              {Number(product.rating).toFixed(1)} ({product.reviews} review
              {product.reviews === 1 ? "" : "s"})
            </span>
          </div>

          {variants.length > 0 && (
            <VariantSelector
              variants={variants}
              selectedId={selectedVariant?._id}
              onSelect={handleSelectVariant}
            />
          )}

          <div className="flex items-baseline gap-3 mb-5">
            <span className="text-3xl font-semibold">{formatPrice(displayPrice)}</span>
            {displayOriginal > displayPrice && (
              <>
                <span className="text-lg text-muted-foreground line-through">
                  {formatPrice(displayOriginal)}
                </span>
                <span className="px-3 py-1 bg-destructive text-destructive-foreground text-[10px] font-semibold uppercase tracking-widest rounded-full">
                  Save {discountPercent}%
                </span>
              </>
            )}
          </div>

          <p className="text-muted-foreground mb-6">
            {product.shortDescription || product.subtitle}
          </p>
          <p className={`text-sm font-medium mb-6 ${stock.className}`}>{stock.text}</p>

          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="inline-flex items-center border border-border rounded-full bg-secondary">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={isOutOfStock || quantity <= 1}
                aria-label="Decrease quantity"
                className="w-11 h-11 flex items-center justify-center disabled:opacity-40"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-10 text-center font-medium" aria-live="polite">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                disabled={isOutOfStock || quantity >= maxQuantity}
                aria-label="Increase quantity"
                className="w-11 h-11 flex items-center justify-center disabled:opacity-40"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleAddToCart}
              disabled={isOutOfStock || isBusy}
              className="flex-1 min-w-[160px] h-11 gradient-neon text-primary-foreground rounded-full text-sm font-semibold uppercase tracking-widest flex items-center justify-center gap-2 neon-glow disabled:opacity-50"
            >
                <ShoppingCart className="w-4 h-4" /> Add to Cart
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleBuyNow}
              disabled={isOutOfStock || isBusy}
              className="flex-1 min-w-[160px] h-11 border border-primary text-primary rounded-full text-sm font-semibold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
            >
              <Zap className="w-4 h-4" /> Buy Now
            </motion.button>
          </div>

          {product.features?.length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl font-display mb-3">{t("product.features")}</h2>
              <ul className="space-y-2">
                {product.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <Check className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 mt-14">
        <section>
          <h2 className="text-3xl font-display mb-4">{t("product.description")}</h2>
          {/<[a-z][\s\S]*>/i.test(product.description || "") ? (
            <div
              className="product-rich-text text-muted-foreground space-y-3"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          ) : (
            <p className="text-muted-foreground whitespace-pre-line">{product.description}</p>
          )}
          {product.giftPackaging?.enabled && (
            <div className="mt-6 rounded-2xl border border-primary/40 bg-primary/5 px-5 py-4">
              <p className="text-xs uppercase tracking-widest text-primary mb-1">
                Complimentary Gift Packaging
              </p>
              <p className="text-sm text-muted-foreground">
                {product.giftPackaging.description ||
                  "Presented in a signature luxury gift box with a hand-written card."}
              </p>
            </div>
          )}
        </section>
        <section>
          <h2 className="text-3xl font-display mb-4">{t("product.productInformation")}</h2>
          <dl className="bg-card border border-border rounded-2xl divide-y divide-border">
            {specRows.map(({ key, value }) => (
              <div key={key} className="flex justify-between gap-4 px-5 py-3 text-sm">
                <dt className="text-muted-foreground">{key}</dt>
                <dd className="font-medium text-right break-words max-w-[60%]">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <section className="mt-14 rounded-2xl border border-border bg-card p-6 md:p-8">
        <h2 className="text-3xl font-display mb-6">
          SHOP WITH <span className="text-gradient">CONFIDENCE</span>
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              icon: ShieldCheck,
              title: t("assurance.securePayments"),
              description: t("assurance.securePaymentsDesc"),
            },
            {
              icon: Truck,
              title: t("assurance.cod"),
              description: t("assurance.codDesc"),
            },
            {
              icon: RotateCcw,
              title: t("assurance.returns", { days: 7 }),
              description: t("assurance.returnsDesc", { days: 7 }),
            },
            {
              icon: Headphones,
              title: t("assurance.support"),
              description: t("assurance.supportDesc"),
            },
          ].map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex items-start gap-3">
              <div className="w-10 h-10 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">{title}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <ProductReviews product={product} />

      {product.relatedProducts.length > 0 && (
        <section className="mt-16">
          <h2 className="text-3xl md:text-4xl font-display mb-8">
            YOU MAY ALSO <span className="text-gradient">LIKE</span>
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {product.relatedProducts.map((related) => (
              <ProductCard key={related._id} product={related} />
            ))}
          </div>
        </section>
      )}
    </PageShell>
  );
};

export default ProductDetailPage;

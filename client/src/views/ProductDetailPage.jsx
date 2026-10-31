import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "@/components/AppLink";
import { useParams, useRouter } from "@/lib/router";
import { ArrowLeft, Check, Minus, Plus, ShoppingBag, Zap } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useProduct } from "@/hooks/useCatalog";
import { formatPrice } from "@/utils/format";
import PageShell from "@/components/PageShell";
import ProductCard from "@/components/ProductCard";
import ProductReviews from "@/components/ProductReviews";
import RatingStars from "@/components/RatingStars";

const LOW_STOCK_THRESHOLD = 10;

const getStockLabel = (stock) => {
  if (stock <= 0) return { text: "Out of stock", className: "text-destructive" };
  if (stock <= LOW_STOCK_THRESHOLD)
    return { text: `Only ${stock} left`, className: "text-primary" };
  return { text: "In stock", className: "text-green-600" };
};

const getSpecRows = (product) => {
  const base = [
    ["Material", product.material],
    ["Colour", product.colour],
    ["Size", product.size],
    ["Capacity", product.capacity],
    ["Weight", product.weight],
    ["SKU", product.sku],
  ].map(([key, value]) => ({ key, value }));
  const baseKeys = new Set(base.map(({ key }) => key.toLowerCase()));
  const extra = (product.specifications ?? []).filter(
    ({ key }) => !baseKeys.has(key.toLowerCase()),
  );
  return [...base, ...extra].filter((row) => row.value);
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
  const router = useRouter();
  const { isLoggedIn, openLoginModal } = useAuth();
  const { addToCart } = useCart();
  const { data: product, isLoading, isError } = useProduct(slug);
  const [quantity, setQuantity] = useState(1);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => setQuantity(1), [slug]);

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

  const stock = getStockLabel(product.stock);
  const isOutOfStock = product.stock <= 0;
  const maxQuantity = Math.max(product.stock, 1);
  const specRows = getSpecRows(product);

  const handleAddToCart = async () => {
    setIsBusy(true);
    const added = await addToCart(product, quantity);
    setIsBusy(false);
    if (added) toast.success(`${quantity} × ${product.name} added to cart`);
  };

  const handleBuyNow = async () => {
    if (!isLoggedIn) {
      toast.info("Please sign in to place your order");
      openLoginModal();
      return;
    }
    setIsBusy(true);
    const added = await addToCart(product, quantity);
    setIsBusy(false);
    if (added) router.push("/checkout");
  };

  return (
    <PageShell>
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
        <Gallery key={product._id} product={product} />

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

          <div className="flex items-baseline gap-3 mb-5">
            <span className="text-3xl font-semibold">{formatPrice(product.price)}</span>
            {product.originalPrice > product.price && (
              <>
                <span className="text-lg text-muted-foreground line-through">
                  {formatPrice(product.originalPrice)}
                </span>
                <span className="px-3 py-1 bg-destructive text-destructive-foreground text-[10px] font-semibold uppercase tracking-widest rounded-full">
                  Save {product.discountPercent}%
                </span>
              </>
            )}
          </div>

          <p className="text-muted-foreground mb-6">{product.shortDescription}</p>
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
              <ShoppingBag className="w-4 h-4" /> Add to Cart
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleBuyNow}
              disabled={isOutOfStock || isBusy}
              className="flex-1 min-w-[160px] h-11 border border-primary text-primary rounded-full text-sm font-semibold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary/10 transition-colors disabled:opacity-50"
            >
              <Zap className="w-4 h-4" /> Buy Now
            </motion.button>
          </div>

          {product.features?.length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl font-display mb-3">FEATURES</h2>
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
          <h2 className="text-3xl font-display mb-4">DESCRIPTION</h2>
          <p className="text-muted-foreground whitespace-pre-line">{product.description}</p>
        </section>
        <section>
          <h2 className="text-3xl font-display mb-4">SPECIFICATIONS</h2>
          <dl className="bg-card border border-border rounded-2xl divide-y divide-border">
            {specRows.map(({ key, value }) => (
              <div key={key} className="flex justify-between gap-4 px-5 py-3 text-sm">
                <dt className="text-muted-foreground">{key}</dt>
                <dd className="font-medium text-right">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

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

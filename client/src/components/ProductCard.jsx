import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "@/components/AppLink";
import { Star, ShoppingBag, Eye, Heart, Check } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { toast } from "sonner";
import { formatPrice } from "@/utils/format";

const COLOUR_HEX = {
  silver: "#c9ced4",
  steel: "#c9ced4",
  "stainless steel": "#c9ced4",
  gold: "#d9a52e",
  copper: "#b87927",
  black: "#0b0908",
  "matte black": "#1a1a1a",
  clear: "#e8f1f5",
  transparent: "#e8f1f5",
  wood: "#a9794a",
  natural: "#c8a46e",
  rosewood: "#65000b",
};

const getColourHex = (name = "") => COLOUR_HEX[name.toLowerCase()] ?? "#9ca3af";

const ProductCard = ({ product, onQuickView }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [added, setAdded] = useState(false);

  const { addToCart } = useCart();
  const { isWishlisted, toggle: toggleWishlist } = useWishlist();
  const wishlisted = isWishlisted(product.id ?? product._id);

  const activeImage = product.image;
  const hoverImage = product.images?.[1] ?? activeImage;
  const productHref = `/products/${product.slug}`;
  const specChips = [product.capacity, product.size].filter(Boolean);
  const isOutOfStock = product.stock <= 0;

  const handleAddToCart = async (e) => {
    e?.stopPropagation();
    if (await addToCart(product)) {
      setAdded(true);
      toast.success(`${product.name} added to cart`);
      setTimeout(() => setAdded(false), 1500);
    }
  };

  return (
    <motion.div
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden rounded-xl bg-card border border-border transition-all duration-500 group-hover:border-primary/40 group-hover:shadow-[0_20px_60px_-15px_rgba(217,165,46,0.25)]">
        {/* Image area */}
        <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
          <Link href={productHref} className="absolute inset-0 z-[1]" aria-label={product.name} />
          {/* Primary image */}
          <motion.img
            loading="lazy"
            decoding="async"
            key={activeImage}
            src={activeImage}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover"
            animate={{ opacity: isHovered ? 0 : 1, scale: isHovered ? 1.05 : 1 }}
            transition={{ duration: 0.5 }}
          />
          {/* Hover image */}
          <motion.img
            loading="lazy"
            decoding="async"
            src={hoverImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1.05 : 1 }}
            transition={{ duration: 0.5 }}
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
            {product.isNew && (
              <span className="px-3 py-1 bg-primary text-primary-foreground text-[10px] font-semibold uppercase tracking-widest rounded-full">
                New
              </span>
            )}
            {product.discountPercent > 0 && (
              <span className="px-3 py-1 bg-destructive text-destructive-foreground text-[10px] font-semibold uppercase tracking-widest rounded-full">
                -{product.discountPercent}%
              </span>
            )}
            {isOutOfStock && (
              <span className="px-3 py-1 bg-secondary text-muted-foreground text-[10px] font-semibold uppercase tracking-widest rounded-full">
                Sold out
              </span>
            )}
          </div>

          {/* Wishlist */}
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(product.id ?? product._id);
            }}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            className="absolute top-3 right-3 z-10 w-9 h-9 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-background transition-colors"
          >
            <motion.div
              animate={wishlisted ? { scale: [1, 1.4, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <Heart
                className={`w-4 h-4 transition-colors ${
                  wishlisted ? "fill-primary text-primary" : "text-muted-foreground"
                }`}
              />
            </motion.div>
          </motion.button>

          {/* Hover action bar: sizes + quick add + view */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 30, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute bottom-0 left-0 right-0 p-3 z-10 bg-gradient-to-t from-background via-background/90 to-transparent"
              >
                {/* Capacity / size */}
                {specChips.length > 0 && (
                  <div className="flex items-center justify-center gap-1.5 mb-2">
                    {specChips.map((chip) => (
                      <span
                        key={chip}
                        className="min-w-[32px] h-8 px-3 inline-flex items-center text-xs font-medium rounded-md border border-border bg-background"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                )}

                {/* Quick add + view */}
                <div className="flex gap-2">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    className="flex-1 h-10 disabled:opacity-50 gradient-neon text-primary-foreground rounded-full text-xs font-semibold uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    {added ? (
                      <>
                        <Check className="w-4 h-4" /> Added
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" /> Quick Add
                      </>
                    )}
                  </motion.button>
                  {onQuickView && (
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuickView(product);
                      }}
                      className="w-10 h-10 bg-background border border-border rounded-full flex items-center justify-center hover:border-primary transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
            {product.category}
          </p>
          <Link href={productHref}>
            <h3 className="font-medium text-primary mb-2 line-clamp-1 hover:text-foreground transition-colors">
              {product.name}
            </h3>
          </Link>

          {/* Colour */}
          <div className="flex items-center gap-1.5 mb-3">
            <span
              className="w-4 h-4 rounded-full ring-1 ring-border"
              style={{ background: getColourHex(product.colour) }}
            />
            <span className="text-[10px] text-muted-foreground ml-1">{product.colour}</span>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < Math.floor(product.rating)
                      ? "fill-primary text-primary"
                      : "fill-muted text-muted"
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] text-muted-foreground">
              {Number(product.rating).toFixed(1)} ({product.reviews})
            </span>
          </div>

          {/* Price */}
          <div className="flex items-end justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-semibold text-foreground">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice > product.price && (
                <span className="text-xs text-muted-foreground line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
            <Link
              href={productHref}
              className="text-[10px] uppercase tracking-widest text-primary hover:underline"
            >
              View →
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;

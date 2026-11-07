import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Check, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { kitService } from "@/services";
import { getErrorMessage } from "@/services/api";
import { formatPrice, normalizeProduct } from "@/utils/format";

const QUOTE_DEBOUNCE_MS = 300;

/** @returns {string|null} hint toward the next discount tier, or the unlocked-tier message */
const getTierHint = (tiers, count) => {
  const next = tiers.find((tier) => tier.minItems > count);
  if (next) {
    const missing = next.minItems - count;
    return `Add ${missing} more item${missing > 1 ? "s" : ""} to unlock ${next.percent}% off`;
  }
  return tiers.length > 0 ? "Maximum kit discount unlocked" : null;
};

const ProductTile = ({ product, isSelected, onToggle }) => {
  const isOutOfStock = product.stock <= 0;
  return (
    <motion.button
      type="button"
      whileTap={isOutOfStock ? undefined : { scale: 0.98 }}
      onClick={onToggle}
      disabled={isOutOfStock}
      aria-pressed={isSelected}
      className={`group relative text-left overflow-hidden rounded-xl bg-card border transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
        isSelected
          ? "border-primary shadow-[0_20px_60px_-15px_rgba(217,165,46,0.25)]"
          : "border-border hover:border-primary/40"
      }`}
    >
      <div className="relative aspect-square bg-secondary overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {isSelected && (
          <span className="absolute top-3 right-3 w-8 h-8 rounded-full gradient-neon text-primary-foreground flex items-center justify-center">
            <Check className="w-4 h-4" />
          </span>
        )}
        {isOutOfStock && (
          <span className="absolute top-3 left-3 px-3 py-1 bg-secondary text-muted-foreground text-[10px] font-semibold uppercase tracking-widest rounded-full">
            Sold out
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-medium line-clamp-1">{product.name}</p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
          {product.material}
        </p>
        <div className="flex items-baseline gap-2">
          <span className="font-semibold">{formatPrice(product.price)}</span>
          {product.originalPrice > product.price && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
};

const KitSummary = ({
  selections,
  slots,
  quote,
  quoteError,
  tierHint,
  isAdding,
  onRemove,
  onAdd,
}) => {
  const selectedSlots = slots.filter(({ slot }) => selections[slot]);
  return (
    <div className="bg-card border border-border rounded-2xl p-6 card-shadow">
      <h2 className="text-2xl font-display mb-4">YOUR KIT</h2>
      {selectedSlots.length === 0 ? (
        <p className="text-sm text-muted-foreground mb-4">
          Pick one item from each step to build your kit.
        </p>
      ) : (
        <ul className="space-y-3 mb-5">
          {selectedSlots.map(({ slot, label }) => {
            const product = selections[slot];
            return (
              <li key={slot} className="flex items-center gap-3">
                <img
                  src={product.image}
                  alt=""
                  className="w-12 h-12 rounded-lg object-cover bg-secondary"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {label}
                  </p>
                  <p className="text-sm font-medium line-clamp-1">{product.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">{formatPrice(product.price)}</p>
                  <button
                    type="button"
                    onClick={() => onRemove(slot)}
                    className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-destructive"
                  >
                    Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {quote && selectedSlots.length > 0 && (
        <dl className="space-y-2 text-sm border-t border-border pt-4 mb-4">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd>{formatPrice(quote.subtotal)}</dd>
          </div>
          <div className="flex justify-between text-primary">
            <dt>Kit discount ({quote.kitDiscountPercent}%)</dt>
            <dd>-{formatPrice(quote.kitDiscount)}</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-3 text-lg font-semibold">
            <dt>Total</dt>
            <dd>{formatPrice(quote.total)}</dd>
          </div>
        </dl>
      )}
      {quoteError && <p className="text-sm text-destructive mb-3">{quoteError}</p>}
      {tierHint && <p className="text-xs text-primary mb-4">{tierHint}</p>}

      <motion.button
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onAdd}
        disabled={isAdding}
        className="w-full gradient-neon text-primary-foreground py-4 font-semibold uppercase tracking-wide rounded-full neon-glow flex items-center justify-center gap-2 disabled:opacity-60"
      >
        <ShoppingBag className="w-4 h-4" /> {isAdding ? "Adding..." : "Add Kit to Cart"}
      </motion.button>
    </div>
  );
};

/** Slot-by-slot bar kit picker with a live server quote and add-to-cart. */
const BarKitBuilder = () => {
  const { isLoggedIn, openLoginModal } = useAuth();
  const { addKit } = useCart();
  const {
    data: config,
    isLoading,
    error,
  } = useQuery({ queryKey: ["kit-config"], queryFn: kitService.config });
  const [selections, setSelections] = useState({});
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState(null);
  const [isAdding, setIsAdding] = useState(false);

  const slots = useMemo(
    () =>
      (config?.slots ?? []).map((slot) => ({
        ...slot,
        products: slot.products.map(normalizeProduct),
      })),
    [config],
  );
  const kitItems = useMemo(
    () =>
      slots
        .filter(({ slot }) => selections[slot])
        .map(({ slot }) => ({ slot, productId: selections[slot]._id })),
    [slots, selections],
  );

  useEffect(() => {
    setQuoteError(null);
    if (kitItems.length === 0) {
      setQuote(null);
      return undefined;
    }
    let isStale = false;
    const timer = setTimeout(async () => {
      try {
        const result = await kitService.quote(kitItems);
        if (!isStale) setQuote(result);
      } catch (quoteFailure) {
        if (!isStale) setQuoteError(getErrorMessage(quoteFailure));
      }
    }, QUOTE_DEBOUNCE_MS);
    return () => {
      isStale = true;
      clearTimeout(timer);
    };
  }, [kitItems]);

  const toggleProduct = (slot, product) =>
    setSelections((prev) => {
      const next = { ...prev };
      if (prev[slot]?._id === product._id) delete next[slot];
      else next[slot] = product;
      return next;
    });

  const removeSlot = (slot) =>
    setSelections((prev) => {
      const next = { ...prev };
      delete next[slot];
      return next;
    });

  const handleAddKit = async () => {
    if (kitItems.length === 0) return toast.error("Select at least one item for your kit");
    if (!isLoggedIn) {
      toast.info("Please sign in to add your kit to the cart");
      openLoginModal();
      return;
    }
    setIsAdding(true);
    try {
      await addKit(kitItems);
      toast.success("Your bar kit was added to the cart");
    } catch (addError) {
      toast.error(getErrorMessage(addError));
    } finally {
      setIsAdding(false);
    }
  };

  if (isLoading)
    return <p className="py-24 text-center text-muted-foreground">Loading kit options...</p>;
  if (error) return <p className="py-24 text-center text-destructive">{getErrorMessage(error)}</p>;

  const tierHint = getTierHint(config.discountTiers ?? [], kitItems.length);

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
      <div className="space-y-10">
        {slots.map(({ slot, label, products }, index) => (
          <section key={slot}>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-9 h-9 rounded-full gradient-neon text-primary-foreground font-display text-xl flex items-center justify-center">
                {index + 1}
              </span>
              <h2 className="text-2xl md:text-3xl font-display">
                CHOOSE YOUR {label.toUpperCase()}
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {products.map((product) => (
                <ProductTile
                  key={product._id}
                  product={product}
                  isSelected={selections[slot]?._id === product._id}
                  onToggle={() => toggleProduct(slot, product)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="lg:sticky lg:top-28">
        <KitSummary
          selections={selections}
          slots={slots}
          quote={quote}
          quoteError={quoteError}
          tierHint={tierHint}
          isAdding={isAdding}
          onRemove={removeSlot}
          onAdd={handleAddKit}
        />
      </div>
    </div>
  );
};

export default BarKitBuilder;

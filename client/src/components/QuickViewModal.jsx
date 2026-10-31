import { motion, AnimatePresence } from "framer-motion";
import Link from "@/components/AppLink";
import { X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/utils/format";
import { toast } from "sonner";

const QuickViewModal = ({ product, onClose }) => {
  const { addToCart } = useCart();

  const handleAddToCart = async () => {
    if (await addToCart(product)) {
      toast.success(`${product.name} added to cart!`);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-card rounded-2xl overflow-hidden max-w-4xl w-full card-shadow border border-border"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-secondary rounded-full flex items-center justify-center hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid md:grid-cols-2">
              <div className="aspect-square">
                <img
                  loading="lazy"
                  decoding="async"
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-8 flex flex-col justify-center">
                <span className="text-primary text-sm uppercase tracking-wide font-medium">
                  {product.category}
                </span>
                <h3 className="text-3xl font-display mt-2 mb-4">{product.name}</h3>
                <p className="text-muted-foreground mb-6">{product.shortDescription}</p>
                <div className="flex items-center gap-4 mb-8">
                  <span className="text-3xl font-semibold">{formatPrice(product.price)}</span>
                  {product.originalPrice > product.price && (
                    <span className="text-xl text-muted-foreground line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                </div>
                <motion.button
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full gradient-neon text-primary-foreground py-4 font-semibold uppercase tracking-wide rounded-full neon-glow disabled:opacity-50"
                >
                  {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
                </motion.button>
                <Link
                  href={`/products/${product.slug}`}
                  onClick={onClose}
                  className="mt-4 text-center text-xs uppercase tracking-widest text-primary hover:underline"
                >
                  View full details →
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QuickViewModal;

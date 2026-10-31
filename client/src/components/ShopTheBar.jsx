import { motion } from "framer-motion";
import Link from "@/components/AppLink";
import { ShoppingBag } from "lucide-react";
import { useProducts } from "@/hooks/useCatalog";
import { formatPrice } from "@/utils/format";

const ShopTheBar = () => {
  const { data } = useProducts({ bestSeller: true, limit: 6, sort: "popular" });
  const posts = data?.products ?? [];

  return (
    <section className="py-24 lg:py-32 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 text-primary font-medium tracking-widest uppercase text-sm">
            <ShoppingBag className="w-4 h-4" />
            Best Sellers
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display mt-4">
            SHOP THE <span className="text-gradient">BAR</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-md mx-auto">
            The pieces our customers reach for most. One tap to the details.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
          {posts.map((p, i) => (
            <motion.div
              key={p._id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              <Link
                href={`/products/${p.slug}`}
                className="group relative block aspect-square overflow-hidden rounded-xl"
              >
                <motion.img
                  loading="lazy"
                  decoding="async"
                  src={p.image}
                  alt={p.name}
                  className="absolute inset-0 w-full h-full object-cover"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                />
                <div className="absolute inset-0 bg-primary/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-1 px-2 text-center text-primary-foreground text-sm font-medium">
                  <span className="line-clamp-2">{p.name}</span>
                  <span className="font-semibold">{formatPrice(p.price)}</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ShopTheBar;

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "@/components/AppLink";
import ProductCard from "./ProductCard";
import QuickViewModal from "./QuickViewModal";
import { useProducts } from "@/hooks/useCatalog";

const FeaturedProducts = () => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { data } = useProducts({ featured: true, limit: 6, sort: "popular" });
  const products = data?.products ?? [];

  return (
    <section className="py-20 lg:py-32 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-primary font-medium tracking-widest uppercase text-sm"
          >
            Curated Selection
          </motion.span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display mt-4 mb-6">
            FEATURED <span className="text-gradient">PRODUCTS</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover our handpicked selection of premium barware, built for smooth pours and
            effortless mixing.
          </p>
        </motion.div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {products.map((product, index) => (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <ProductCard product={product} onQuickView={setSelectedProduct} />
            </motion.div>
          ))}
        </div>

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center mt-12"
        >
          <Link href="/products">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 border-2 border-primary text-primary font-semibold uppercase tracking-wide rounded-full hover:bg-primary hover:text-primary-foreground transition-all duration-300"
            >
              View All Products
            </motion.button>
          </Link>
        </motion.div>
      </div>

      <QuickViewModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </section>
  );
};

export default FeaturedProducts;

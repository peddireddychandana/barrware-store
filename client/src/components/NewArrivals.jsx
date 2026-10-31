import { motion } from "framer-motion";
import ProductCard from "./ProductCard";
import { useProducts } from "@/hooks/useCatalog";

const NewArrivals = () => {
  const { data } = useProducts({ sort: "newest", limit: 4 });
  const newArrivals = data?.products ?? [];

  return (
    <section className="py-24 lg:py-32 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-4"
        >
          <div>
            <span className="text-primary font-medium tracking-widest uppercase text-sm">
              Just Landed
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display mt-4">
              NEW <span className="text-gradient">ARRIVALS</span>
            </h2>
          </div>
          <p className="text-muted-foreground max-w-sm">
            Fresh additions to the bar cart. Hover a product to see it from another angle.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {newArrivals.map((p, i) => (
            <motion.div
              key={p._id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <ProductCard product={p} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewArrivals;

import { motion } from "framer-motion";
import Link from "@/components/AppLink";
import { ArrowUpRight } from "lucide-react";
import { useCategories } from "@/hooks/useCatalog";
const FEATURED_SLUGS = [
  { slug: "cocktail-shakers", className: "lg:col-span-2 lg:row-span-2 min-h-[380px] lg:min-h-0" },
  { slug: "cocktail-strainers", className: "lg:col-span-2 min-h-[280px]" },
  { slug: "glassware", className: "min-h-[280px]" },
  { slug: "bartender-tool-sets", className: "min-h-[280px]" },
];

const CategoriesShowcase = () => {
  const { data: allCategories = [] } = useCategories();
  const categories = FEATURED_SLUGS.map(({ slug, className }) => {
    const category = allCategories.find((c) => c.slug === slug);
    return category && { ...category, className };
  }).filter(Boolean);
  const otherCategories = allCategories.filter(
    (c) => !FEATURED_SLUGS.some((f) => f.slug === c.slug),
  );

  return (
    <section id="categories" className="py-24 lg:py-32 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-6"
        >
          <div>
            <span className="text-primary font-medium tracking-widest uppercase text-sm">
              Shop By Category
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display mt-4">
              STOCK YOUR <span className="text-gradient">BAR</span>
            </h2>
            <p className="text-muted-foreground mt-4 max-w-md">
              Eleven collections, one obsession. Pick your tools and start pouring.
            </p>
          </div>
          <Link
            href="/products"
            className="text-sm font-medium uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2"
          >
            View All <ArrowUpRight className="w-4 h-4" />
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {categories.map((cat, i) => (
            <motion.div
              key={cat._id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative overflow-hidden rounded-2xl group ${cat.className}`}
            >
              <Link href={`/category/${cat.slug}`} className="block absolute inset-0">
                <motion.img
                  loading="lazy"
                  decoding="async"
                  src={cat.image}
                  alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover"
                  whileHover={{ scale: 1.12 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-500" />

                <div className="absolute inset-0 p-6 lg:p-8 flex flex-col justify-end">
                  <span className="text-xs uppercase tracking-widest text-primary mb-2">
                    {cat.productCount ?? 0} pieces
                  </span>
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <h3 className="text-3xl lg:text-5xl font-display leading-none">{cat.name}</h3>
                      <p className="text-sm text-muted-foreground mt-2 max-w-xs hidden sm:block">
                        {cat.description}
                      </p>
                    </div>
                    <motion.div
                      whileHover={{ rotate: 45 }}
                      className="w-12 h-12 shrink-0 rounded-full bg-primary flex items-center justify-center text-primary-foreground opacity-100 lg:opacity-0 group-hover:opacity-100 translate-y-0 lg:translate-y-4 group-hover:translate-y-0 transition-all duration-500"
                    >
                      <ArrowUpRight className="w-5 h-5" />
                    </motion.div>
                  </div>
                  <span className="mt-4 text-[11px] uppercase tracking-widest text-foreground/70 inline-flex items-center gap-1">
                    Shop {cat.name} <ArrowUpRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {otherCategories.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-8">
            {otherCategories.map((cat) => (
              <Link
                key={cat._id}
                href={`/category/${cat.slug}`}
                className="px-5 py-2 rounded-full border border-border bg-secondary text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CategoriesShowcase;

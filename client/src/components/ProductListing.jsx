import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, X } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import QuickViewModal from "@/components/QuickViewModal";
import { useCategories, useInfiniteProducts, useProductFilters } from "@/hooks/useCatalog";
import { formatPrice } from "@/utils/format";

const PAGE_SIZE = 12;

const PRICE_BUCKETS = [
  { label: "Under ₹300", maxPrice: 299 },
  { label: "₹300 – ₹600", minPrice: 300, maxPrice: 600 },
  { label: "₹600 – ₹1,000", minPrice: 601, maxPrice: 1000 },
  { label: "₹1,000 – ₹2,000", minPrice: 1001, maxPrice: 2000 },
  { label: "₹2,000+", minPrice: 2001 },
];

const SORT_OPTIONS = [
  { value: "popular", label: "Popularity" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

const Chip = ({ active, onClick, children }) => (
  <motion.button
    onClick={onClick}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className={`px-4 py-1.5 rounded-full text-xs font-medium uppercase tracking-widest border transition-all ${
      active
        ? "bg-primary text-primary-foreground border-primary neon-glow hover:bg-accent"
        : "bg-secondary/50 text-muted-foreground border-primary/30 hover:border-primary hover:text-primary"
    }`}
  >
    {children}
  </motion.button>
);

const ProductListing = ({ fixedCategory, showCategoryTabs = true }) => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [categorySlug, setCategorySlug] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [productType, setProductType] = useState(null);
  const [priceBucket, setPriceBucket] = useState(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("popular");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const { data: categories = [] } = useCategories();
  const { data: filterOptions } = useProductFilters();

  const bucket = PRICE_BUCKETS.find((b) => b.label === priceBucket);
  const params = useMemo(
    () => ({
      limit: PAGE_SIZE,
      sort,
      category: fixedCategory ?? categorySlug ?? undefined,
      productType: productType ?? undefined,
      material: materials.length ? materials.join(",") : undefined,
      search: search.trim() || undefined,
      minPrice: bucket?.minPrice,
      maxPrice: bucket?.maxPrice,
    }),
    [fixedCategory, categorySlug, productType, materials, search, sort, bucket],
  );

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteProducts(params);
  const products = data?.pages.flatMap((page) => page.products) ?? [];
  const total = data?.pages[0]?.pagination.total ?? 0;

  const toggleMaterial = (value) =>
    setMaterials((prev) =>
      prev.includes(value) ? prev.filter((m) => m !== value) : [...prev, value],
    );

  const activeCount = materials.length + (productType ? 1 : 0) + (priceBucket ? 1 : 0);

  const clearAll = () => {
    setMaterials([]);
    setProductType(null);
    setPriceBucket(null);
  };

  return (
    <>
      {showCategoryTabs && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap justify-center gap-3 mb-8"
        >
          {[{ slug: null, name: "All" }, ...categories].map((cat) => (
            <motion.button
              key={cat.slug ?? "all"}
              onClick={() => setCategorySlug(cat.slug)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-6 py-2 rounded-full font-medium uppercase tracking-wide text-sm transition-all duration-300 ${
                categorySlug === cat.slug
                  ? "gradient-neon text-primary-foreground neon-glow"
                  : "bg-secondary text-muted-foreground hover:text-primary"
              }`}
            >
              {cat.name}
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* Search + sort */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name or category"
            className="w-full pl-11 pr-4 py-3 bg-secondary border border-border rounded-full focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
          />
        </div>
        <button
          type="button"
          onClick={() => setIsFilterOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-secondary border border-primary/40 text-primary rounded-full text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeCount > 0 && (
            <span className="min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="Sort products"
          className="px-5 py-3 bg-secondary border border-border rounded-full text-sm focus:outline-none focus:border-primary"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              Sort: {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Filter side panel */}
      <AnimatePresence>
        {isFilterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterOpen(false)}
              className="fixed inset-0 z-[55] bg-background/80 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-[60] w-full max-w-sm bg-card border-l border-border shadow-2xl flex flex-col"
              aria-label="Product filters"
            >
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <SlidersHorizontal className="w-6 h-6 text-primary" />
                  <h2 className="text-xl font-display">FILTERS</h2>
                </div>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  aria-label="Close filters"
                  className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                <section>
                  <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Type</h3>
                  <div className="flex flex-wrap gap-2">
                    {(filterOptions?.productTypes ?? []).map((type) => (
                      <Chip
                        key={type.slug}
                        active={productType === type.slug}
                        onClick={() => setProductType(productType === type.slug ? null : type.slug)}
                      >
                        {type.name}
                      </Chip>
                    ))}
                  </div>
                </section>
                <section>
                  <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
                    Material
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(filterOptions?.materials ?? []).map((material) => (
                      <Chip
                        key={material}
                        active={materials.includes(material)}
                        onClick={() => toggleMaterial(material)}
                      >
                        {material}
                      </Chip>
                    ))}
                  </div>
                </section>
                <section>
                  <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Price</h3>
                  <div className="flex flex-wrap gap-2">
                    {PRICE_BUCKETS.map((b) => (
                      <Chip
                        key={b.label}
                        active={priceBucket === b.label}
                        onClick={() => setPriceBucket(priceBucket === b.label ? null : b.label)}
                      >
                        {b.label}
                      </Chip>
                    ))}
                  </div>
                </section>
              </div>

              <div className="p-6 border-t border-border space-y-3">
                <motion.button
                  onClick={() => setIsFilterOpen(false)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full gradient-neon text-primary-foreground py-4 font-semibold uppercase tracking-wide rounded-full neon-glow"
                >
                  Show {total} {total === 1 ? "product" : "products"}
                </motion.button>
                {activeCount > 0 && (
                  <button
                    onClick={clearAll}
                    className="w-full text-xs uppercase tracking-widest text-primary hover:underline"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Products Grid */}
      <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {products.map((product, index) => (
            <motion.div
              key={product._id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: (index % PAGE_SIZE) * 0.05 }}
            >
              <ProductCard product={product} onQuickView={setSelectedProduct} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {!isLoading && products.length === 0 && (
        <div className="text-center text-muted-foreground py-16">
          No products match your filters.
        </div>
      )}

      <p className="text-center text-muted-foreground mt-8">
        Showing {products.length} of {total} products
      </p>

      {hasNextPage && (
        <div className="text-center mt-6">
          <motion.button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 border-2 border-primary text-primary font-semibold uppercase tracking-wide rounded-full hover:bg-primary hover:text-primary-foreground transition-all duration-300 disabled:opacity-50"
          >
            {isFetchingNextPage ? "Loading..." : "Load More"}
          </motion.button>
        </div>
      )}

      <QuickViewModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </>
  );
};

export default ProductListing;

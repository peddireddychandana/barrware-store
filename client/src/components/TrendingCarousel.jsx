import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "@/components/AppLink";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useProducts } from "@/hooks/useCatalog";

const OVERLAY_COLORS = [
  "from-orange-600/20",
  "from-cyan-600/20",
  "from-pink-600/20",
  "from-green-600/20",
  "from-yellow-600/20",
  "from-purple-600/20",
];

const TrendingCarousel = () => {
  const { data } = useProducts({ premium: true, limit: 8 });
  const collections = data?.products ?? [];
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 400;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const id = setInterval(() => {
      if (!scrollRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      if (scrollLeft >= scrollWidth - clientWidth - 10) {
        scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        scrollRef.current.scrollBy({ left: 320, behavior: "smooth" });
      }
    }, 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="py-20 lg:py-32 gradient-hero overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-12"
        >
          <div>
            <span className="text-primary font-medium tracking-widest uppercase text-sm">
              Premium Collection
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display mt-4">
              THE <span className="text-gradient">PREMIUM</span> EDIT
            </h2>
          </div>

          {/* Navigation Arrows */}
          <div className="flex gap-3 mt-6 md:mt-0">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className={`w-12 h-12 rounded-full border-2 border-border flex items-center justify-center transition-all duration-300 ${
                canScrollLeft
                  ? "hover:border-primary hover:bg-primary hover:text-primary-foreground"
                  : "opacity-50 cursor-not-allowed"
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className={`w-12 h-12 rounded-full border-2 border-border flex items-center justify-center transition-all duration-300 ${
                canScrollRight
                  ? "hover:border-primary hover:bg-primary hover:text-primary-foreground"
                  : "opacity-50 cursor-not-allowed"
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Carousel */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-6 overflow-x-auto scrollbar-hide pl-4 lg:pl-8 pr-4 lg:pr-8 pb-4 cursor-grab active:cursor-grabbing"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {collections.map((collection, index) => (
          <motion.div
            key={collection._id}
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="flex-shrink-0 w-72 lg:w-80"
          >
            <Link href={`/products/${collection.slug}`} className="block">
              <motion.div
                whileHover={{ y: -10 }}
                className="group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer"
              >
                {/* Background Image */}
                <img
                  loading="lazy"
                  decoding="async"
                  src={collection.image}
                  alt={collection.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />

                {/* Gradient Overlay */}
                <div
                  className={`absolute inset-0 bg-gradient-to-t ${OVERLAY_COLORS[index % OVERLAY_COLORS.length]} via-transparent to-transparent`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

                {/* Content */}
                <div className="absolute inset-0 p-6 flex flex-col justify-end">
                  <motion.span
                    initial={{ opacity: 0.7 }}
                    className="text-sm text-muted-foreground uppercase tracking-wide"
                  >
                    {collection.material}
                  </motion.span>
                  <h3 className="text-2xl font-display text-foreground mt-1 mb-4">
                    {collection.name}
                  </h3>
                  <div className="flex items-center gap-2 text-primary font-medium opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                    <span>Shop Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>

                {/* Hover Border Effect */}
                <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-primary/50 transition-colors duration-300" />
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default TrendingCarousel;

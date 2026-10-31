import { motion } from "framer-motion";
import Link from "@/components/AppLink";
import { Star, BadgeCheck } from "lucide-react";
import { useRecentReviews } from "@/hooks/useCatalog";

const Reviews = () => {
  const { data: reviews = [] } = useRecentReviews(4);
  const average = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  if (reviews.length === 0) return null;

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
              {average} / 5 · Verified customer reviews
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display mt-4">
              LOVED BY <span className="text-gradient">BARTENDERS</span>
            </h2>
          </div>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-6 h-6 fill-primary text-primary" />
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reviews.map((r, i) => (
            <motion.div
              key={r._id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -6 }}
              className="p-6 rounded-2xl bg-card border border-border flex flex-col gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full gradient-neon flex items-center justify-center font-semibold text-primary-foreground">
                  {r.user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 font-medium truncate">
                    {r.user.name}
                    <BadgeCheck className="w-4 h-4 text-primary shrink-0" />
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{r.product.name}</div>
                </div>
              </div>

              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < r.rating ? "fill-primary text-primary" : "fill-muted text-muted"
                    }`}
                  />
                ))}
              </div>

              <div>
                <h4 className="font-semibold mb-1">{r.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{r.comment}</p>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <Link
                  href={`/products/${r.product.slug}`}
                  className="hover:text-primary transition-colors"
                >
                  View product →
                </Link>
                <span>
                  {new Date(r.createdAt).toLocaleDateString("en-IN", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Reviews;

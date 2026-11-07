import { motion } from "framer-motion";
import Link from "@/components/AppLink";
import { ArrowUpRight } from "lucide-react";
import { useProducts } from "@/hooks/useCatalog";
const TILE_CLASSES = [
  "lg:col-span-2 lg:row-span-2 min-h-[420px] lg:min-h-0",
  "min-h-[260px]",
  "min-h-[260px]",
  "min-h-[260px]",
  "min-h-[260px]",
];

const Lookbook = () => {
  const { data } = useProducts({ productType: "tool-set", limit: 3 });
  const toolSets = data?.products ?? [];
  const kitImage = toolSets[0]?.images?.[1] ?? toolSets[0]?.image;
  const shots = [
    {
      image: kitImage,
      title: "Build Your Bar Kit",
      tag: "Custom",
      href: "/bar-kit",
      cta: "Start Building",
    },
    ...toolSets.map((p) => ({
      image: p.image,
      title: p.name,
      tag: p.material,
      href: `/products/${p.slug}`,
      cta: "View Set",
    })),
    {
      image: toolSets[1]?.images?.[1] ?? toolSets[1]?.image,
      title: "All Tool Sets",
      tag: "Collection",
      href: "/category/bar-tools",
      cta: "Browse All",
    },
  ].filter((shot) => shot.image);

  return (
    <section className="py-24 lg:py-32 gradient-hero relative overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-end md:justify-between mb-14 gap-6"
        >
          <div>
            <span className="text-primary font-medium tracking-widest uppercase text-sm">
              Bar Tools &amp; Sets
            </span>
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-display mt-4">
              COMPLETE <span className="text-gradient">BAR SETS</span>
            </h2>
            <p className="text-muted-foreground mt-4 max-w-md">
              Everything you need in one box, or build your own kit and save up to 15%.
            </p>
          </div>
          <Link
            href="/bar-kit"
            className="text-sm font-medium uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2"
          >
            Build Your Kit <ArrowUpRight className="w-4 h-4" />
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          {shots.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className={`group relative overflow-hidden rounded-2xl ${TILE_CLASSES[i]}`}
            >
              <Link href={s.href} className="block absolute inset-0">
                <motion.img
                  loading="lazy"
                  decoding="async"
                  src={s.image}
                  alt={s.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  whileHover={{ scale: 1.08 }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/30 to-transparent" />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 rounded-full bg-background/70 backdrop-blur-sm text-[10px] uppercase tracking-widest text-primary">
                    {s.tag}
                  </span>
                </div>
                <div className="absolute inset-0 p-5 lg:p-6 flex flex-col justify-end">
                  <div className="flex items-end justify-between gap-3 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                    <div>
                      <h3 className="text-2xl lg:text-3xl font-display">{s.title}</h3>
                      <span className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground inline-flex items-center gap-1">
                        {s.cta}
                      </span>
                    </div>
                    <div className="w-10 h-10 shrink-0 rounded-full bg-primary flex items-center justify-center text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Lookbook;

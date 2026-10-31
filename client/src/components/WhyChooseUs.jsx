import { motion } from "framer-motion";
import { ShieldCheck, Sparkles, Award, Truck } from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "Food-Grade Steel",
    desc: "Rust-resistant, food-safe stainless steel and tempered glass that stand up to every shift.",
  },
  {
    icon: ShieldCheck,
    title: "Built to Last",
    desc: "Leak-resistant fits and polished finishes, backed by a 1-year replacement warranty.",
  },
  {
    icon: Award,
    title: "Bartender Approved",
    desc: "Balanced, ergonomic tools chosen with working bartenders and home mixologists in mind.",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    desc: "Free shipping over ₹999 across India. Cash on Delivery available.",
  },
];

const WhyChooseUs = () => {
  return (
    <section className="py-24 lg:py-32 bg-background relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 max-w-3xl mx-auto"
        >
          <span className="text-primary font-medium tracking-widest uppercase text-sm">
            Why Choose Us
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display mt-4 mb-6">
            BUILT FOR THE <span className="text-gradient">PERFECT POUR</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Every tool is chosen with care and every detail tested. This is what separates Barware
            Store from the rest.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -8 }}
              className="group relative p-8 rounded-2xl bg-card border border-border overflow-hidden"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/10 to-transparent" />
              <div className="relative z-10">
                <motion.div
                  whileHover={{ rotate: 8, scale: 1.1 }}
                  className="inline-flex w-14 h-14 rounded-xl gradient-neon items-center justify-center mb-6 neon-glow"
                >
                  <f.icon className="w-7 h-7 text-primary-foreground" />
                </motion.div>
                <h3 className="text-xl font-display mb-3 tracking-wide">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;

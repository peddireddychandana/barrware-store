import Link from "@/components/AppLink";
import { motion } from "framer-motion";
import { Gem, ShieldCheck, Wine, Truck } from "lucide-react";
import PageShell from "@/components/PageShell";
import PageHeading from "@/components/PageHeading";
import { siteConfig } from "@/utils/siteConfig";

const values = [
  {
    icon: ShieldCheck,
    title: "Built to last",
    text: "Food-grade stainless steel, tempered glass and food-safe wood, chosen to stand up to daily use.",
  },
  {
    icon: Wine,
    title: "For every bar",
    text: "From a first home bar to a busy service, every tool is made to be comfortable and accurate in the hand.",
  },
  {
    icon: Gem,
    title: "Honest pricing",
    text: "The price you see is the price you pay. Totals are always calculated for you at checkout.",
  },
  {
    icon: Truck,
    title: "Simple delivery",
    text: `Free shipping over ₹${siteConfig.freeShippingThreshold} and Cash on Delivery, so you pay when it arrives.`,
  },
];

const AboutPage = () => (
  <PageShell>
    <PageHeading
      title="OUR"
      highlight="STORY"
      subtitle={`${siteConfig.name} exists to put premium barware within reach of every home bar and professional bartender.`}
    />

    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="max-w-3xl mx-auto text-muted-foreground leading-relaxed space-y-5 mb-16 text-lg"
    >
      <p>
        A good cocktail comes down to good tools: a shaker that seals and chills, a strainer that
        pours clean, a jigger that measures true. We collect the essentials in one place, from
        shakers, strainers and bar tools to jiggers, spoons, ice accessories, pourers, pitchers,
        glassware and drinkware.
      </p>
      <p>
        You can buy a single piece, or build your own bar kit from six essential tools and save as
        you add more. Every product page lists its material, size and capacity, so you know exactly
        what you are getting.
      </p>
    </motion.section>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
      {values.map((value, i) => (
        <motion.div
          key={value.title}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className="p-8 rounded-2xl bg-card border border-border"
        >
          <div className="inline-flex w-14 h-14 rounded-xl gradient-neon items-center justify-center mb-6 neon-glow">
            <value.icon className="w-7 h-7 text-primary-foreground" />
          </div>
          <h3 className="text-xl font-display mb-3 tracking-wide">{value.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{value.text}</p>
        </motion.div>
      ))}
    </div>

    <div className="flex flex-wrap justify-center gap-4">
      <Link
        href="/products"
        className="gradient-neon text-primary-foreground px-8 py-4 font-semibold uppercase tracking-wide rounded-full neon-glow"
      >
        Shop Collection
      </Link>
      <Link
        href="/bar-kit"
        className="border-2 border-primary text-primary px-8 py-4 font-semibold uppercase tracking-wide rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
      >
        Build Your Bar Kit
      </Link>
    </div>
  </PageShell>
);

export default AboutPage;

import Link from "@/components/AppLink";
import { ArrowRight, Sparkles } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { formatPrice } from "@/utils/format";
import { siteConfig } from "@/utils/siteConfig";

const CompleteYourKit = ({ product, products = [] }) => {
  const remaining = Math.max(0, siteConfig.freeShippingThreshold - product.price);

  return (
    <section className="mt-16 rounded-2xl border border-primary/30 bg-card p-6 md:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <p className="mb-2 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-primary">
            <Sparkles className="h-4 w-4" /> Complete Your Kit
          </p>
          <h2 className="text-3xl font-display md:text-4xl">
            BUNDLE &amp; SAVE UP TO <span className="text-gradient">15%</span>
          </h2>
          <p className="mt-3 text-muted-foreground">
            Build a bar kit around the {product.name} in the Bar Kit Builder.
            {remaining > 0
              ? ` Add ${formatPrice(remaining)} more to unlock free shipping over ${formatPrice(siteConfig.freeShippingThreshold)}.`
              : ` This item qualifies for free shipping over ${formatPrice(siteConfig.freeShippingThreshold)}.`}
          </p>
        </div>
        <Link
          href="/custom-bar-kit-builder"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full gradient-neon px-7 py-3 text-sm font-semibold uppercase tracking-widest text-primary-foreground neon-glow"
        >
          Build Your Kit <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {products.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
          {products.slice(0, 4).map((related) => (
            <ProductCard key={related._id} product={related} />
          ))}
        </div>
      )}
    </section>
  );
};

export default CompleteYourKit;

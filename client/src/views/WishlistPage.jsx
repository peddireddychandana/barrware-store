import { Heart } from "lucide-react";
import Link from "@/components/AppLink";
import { useWishlist } from "@/context/WishlistContext";
import { normalizeProduct } from "@/utils/format";
import PageShell from "@/components/PageShell";
import PageHeading from "@/components/PageHeading";
import ProductCard from "@/components/ProductCard";

export const WishlistList = ({ limit }) => {
  const { products: saved } = useWishlist();
  const products = limit ? saved.slice(0, limit).map(normalizeProduct) : saved.map(normalizeProduct);

  if (products.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center bg-card border border-border rounded-2xl p-10">
        <Heart className="w-12 h-12 mx-auto mb-4 text-primary" />
        <h2 className="text-3xl font-display mb-2">NOTHING SAVED YET</h2>
        <p className="text-muted-foreground mb-6">
          Tap the heart on any product to keep it here.
        </p>
        <Link
          href="/products"
          className="inline-block gradient-neon text-primary-foreground px-8 py-3 font-semibold uppercase tracking-wide rounded-full neon-glow"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

const WishlistPage = () => (
  <PageShell>
    <PageHeading
      title="MY"
      highlight="WISHLIST"
      subtitle="Pieces you love, saved for later"
    />
    <WishlistList />
  </PageShell>
);

export default WishlistPage;

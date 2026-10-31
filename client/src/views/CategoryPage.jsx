import Link from "@/components/AppLink";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import LoginModal from "@/components/LoginModal";
import Footer from "@/components/Footer";
import ProductListing from "@/components/ProductListing";
import { useCategories } from "@/hooks/useCatalog";

const CategoryPage = ({ category }) => {
  const { data: categories, isLoading } = useCategories();
  const current = categories?.find((c) => c.slug === category);
  const title = current?.name ?? "Products";
  const description = current?.description ?? "";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <LoginModal />

      {/* Hero Banner */}
      <section className="pt-28 pb-12 md:pt-36 md:pb-16 px-4">
        <div className="container mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-display uppercase mb-4">{title}</h1>
            <p className="text-muted-foreground text-lg max-w-2xl">{description}</p>
          </motion.div>
        </div>
      </section>

      <section className="pb-20 px-4">
        <div className="container mx-auto">
          {!isLoading && !current ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">This category does not exist.</p>
            </div>
          ) : (
            <ProductListing fixedCategory={category} showCategoryTabs={false} />
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CategoryPage;

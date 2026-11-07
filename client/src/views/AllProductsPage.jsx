import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "@/components/AppLink";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import ProductListing from "@/components/ProductListing";
import SEOHead from "@/components/SEOHead";

const AllProductsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Shop All Barware | VYRNT Fine Barware"
        description="Browse VYRNT's complete collection of premium barware tools and accessories. Free shipping above ₹999 and Cash on Delivery available."
        path="/products"
      />
      <Navbar />
      <LoginModal />

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Home
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display mb-4">
              ALL <span className="text-gradient">PRODUCTS</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Browse our complete collection of premium barware tools and accessories
            </p>
          </motion.div>

          <ProductListing />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AllProductsPage;

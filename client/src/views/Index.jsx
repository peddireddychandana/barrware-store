import { lazy, Suspense } from "react";
import Navbar from "@/components/Navbar";
import HeroCarousel from "@/components/HeroCarousel";
import FeaturedProducts from "@/components/FeaturedProducts";
import WhyChooseUs from "@/components/WhyChooseUs";
import CategoriesShowcase from "@/components/CategoriesShowcase";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import SEOHead from "@/components/SEOHead";
import { useProduct } from "@/hooks/useCatalog";

// Heavy / below-the-fold — load on demand to keep initial paint snappy
const Showcase360 = lazy(() => import("@/components/Showcase360"));
const NewArrivals = lazy(() => import("@/components/NewArrivals"));
const TrendingCarousel = lazy(() => import("@/components/TrendingCarousel"));
const Lookbook = lazy(() => import("@/components/Lookbook"));
const Reviews = lazy(() => import("@/components/Reviews"));
const ShopTheBar = lazy(() => import("@/components/ShopTheBar"));
const Newsletter = lazy(() => import("@/components/Newsletter"));

const SectionFallback = () => (
  <div className="h-[400px] w-full bg-gradient-to-b from-background to-card animate-pulse" />
);

const Index = () => {
  const { data } = useProduct("boston-shaker-750ml");

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="VYRNT | Online Barware Store — Elevate Every Pour"
        description="Shop precision-engineered barware at VYRNT. Shakers, jiggers, strainers, muddlers & custom bar kits. Free shipping above ₹999 & COD available."
        path="/"
        image="/images/hero/hero-1.jpg"
      />
      <Navbar />
      <LoginModal />
      <main>
        <HeroCarousel />
        <FeaturedProducts />
        <WhyChooseUs />
        <CategoriesShowcase />
        <Suspense fallback={<SectionFallback />}>
          <Showcase360 product={data} />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <NewArrivals />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <TrendingCarousel />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <Lookbook />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <Reviews />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <ShopTheBar />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <Newsletter />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};

export default Index;

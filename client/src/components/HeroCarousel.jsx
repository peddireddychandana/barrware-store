import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "@/components/AppLink";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { optimizedImage } from "@/lib/seo";
const hero1 = "/images/hero/hero-1.jpg";
const hero2 = "/images/hero/hero-2.jpg";
const hero3 = "/images/hero/hero-3.jpg";

const slides = [
  {
    image: hero1,
    alt: "VYRNT premium barware collection arranged on a dark home bar",
    title: "ELEVATE EVERY",
    highlight: "POUR.",
    subtitle:
      "Discover premium barware tools and accessories designed for every home bar and professional bartender.",
  },
  {
    image: hero2,
    alt: "Stainless steel cocktail shaker, strainer and jigger by VYRNT",
    title: "SHAKE. STIR.",
    highlight: "SERVE.",
    subtitle: "Stainless steel shakers, strainers and jiggers built for the perfect cocktail.",
  },
  {
    image: hero3,
    alt: "VYRNT custom bar kit with essential bartending tools",
    title: "BUILD YOUR",
    highlight: "BAR KIT",
    subtitle: "Pick your tools, save up to 15% and craft a set that is truly yours.",
  },
];

const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);

  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Background Images */}
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentSlide}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.5 },
          }}
          className="absolute inset-0"
        >
          <img
            src={optimizedImage(slides[currentSlide].image, 1920)}
            alt={slides[currentSlide].alt}
            width={1920}
            height={1080}
            loading="eager"
            fetchPriority="high"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-background/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="absolute inset-0 z-20 flex items-center">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl pt-20">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -40 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-primary font-medium tracking-widest uppercase mb-4"
                >
                  Premium Barware Collection
                </motion.p>

                <h1 className="text-5xl md:text-7xl lg:text-8xl font-display leading-none mb-6">
                  <span className="block leading-none mb-2">{slides[currentSlide].title}</span>
                  <span className="block text-gradient leading-none">
                    {slides[currentSlide].highlight}
                  </span>
                </h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-lg md:text-xl text-muted-foreground mb-8 max-w-md"
                >
                  {slides[currentSlide].subtitle}
                </motion.p>

                <div className="flex flex-wrap items-center gap-4">
                  <Link href="/products">
                    <motion.span
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-block gradient-neon text-primary-foreground px-8 py-4 font-semibold text-lg uppercase tracking-wide rounded-full neon-glow animate-pulse-glow transition-all duration-300 hover:shadow-[0_0_40px_rgba(217,165,46,0.35)]"
                    >
                      Shop Collection
                    </motion.span>
                  </Link>
                  <Link href="/#categories">
                    <motion.span
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.7 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-block border border-primary/60 bg-background/60 backdrop-blur-sm text-primary px-8 py-4 font-semibold text-lg uppercase tracking-wide rounded-full hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                    >
                      Explore Barware
                    </motion.span>
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <div className="absolute bottom-1/2 translate-y-1/2 left-4 lg:left-8 z-30">
        <motion.button
          whileHover={{ scale: 1.1, x: -5 }}
          whileTap={{ scale: 0.9 }}
          onClick={prevSlide}
          className="w-12 h-12 bg-secondary/50 backdrop-blur-sm border border-primary/40 rounded-full flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300"
        >
          <ChevronLeft className="w-6 h-6" />
        </motion.button>
      </div>
      <div className="absolute bottom-1/2 translate-y-1/2 right-4 lg:right-8 z-30">
        <motion.button
          whileHover={{ scale: 1.1, x: 5 }}
          whileTap={{ scale: 0.9 }}
          onClick={nextSlide}
          className="w-12 h-12 bg-secondary/50 backdrop-blur-sm border border-primary/40 rounded-full flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300"
        >
          <ChevronRight className="w-6 h-6" />
        </motion.button>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-30">
        {slides.map((_, index) => (
          <motion.button
            key={index}
            onClick={() => {
              setDirection(index > currentSlide ? 1 : -1);
              setCurrentSlide(index);
            }}
            className={`h-1 rounded-full transition-all duration-500 ${
              index === currentSlide
                ? "w-12 bg-primary"
                : "w-6 bg-muted-foreground/50 hover:bg-muted-foreground"
            }`}
            whileHover={{ scale: 1.2 }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-6 h-10 border-2 border-muted-foreground/50 rounded-full flex justify-center"
        >
          <motion.div
            animate={{ y: [0, 12, 0], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-3 bg-primary rounded-full mt-2"
          />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroCarousel;

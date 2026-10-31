import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "@/lib/navigation";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";

const PIXELS_PER_FRAME = 36;

const Showcase360 = ({ product }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const frames = product?.images ?? [];
  const [frame, setFrame] = useState(0);
  const [interacted, setInteracted] = useState(false);
  const drag = useRef({ active: false, startX: 0, startFrame: 0 });

  useEffect(() => {
    if (interacted || frames.length < 2) return undefined;
    const timer = setInterval(() => setFrame((f) => (f + 1) % frames.length), 1600);
    return () => clearInterval(timer);
  }, [interacted, frames.length]);

  if (!product) return null;

  const onPointerDown = (e) => {
    drag.current = { active: true, startX: e.clientX, startFrame: frame };
    setInteracted(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!drag.current.active || frames.length < 2) return;
    const steps = Math.round((drag.current.startX - e.clientX) / PIXELS_PER_FRAME);
    setFrame((((drag.current.startFrame + steps) % frames.length) + frames.length) % frames.length);
  };

  const onPointerUp = () => {
    drag.current.active = false;
  };

  const handleShop = () => {
    addToCart(product);
    toast.success(`${product.name} added to cart`);
    navigate("/products");
  };

  const [firstWord, ...restWords] = product.name.toUpperCase().split(" ");

  return (
    <section className="py-16 lg:py-20 relative overflow-hidden gradient-hero">
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* 360 viewer */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative aspect-[4/3] lg:aspect-[5/4] rounded-3xl overflow-hidden border border-border bg-gradient-to-br from-card to-background order-2 lg:order-1 cursor-grab active:cursor-grabbing touch-pan-y select-none"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {frames.map((src, i) => (
              <img
                key={src}
                src={src}
                alt={`${product.name} view ${i + 1}`}
                draggable={false}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                  i === frame ? "opacity-100" : "opacity-0"
                }`}
              />
            ))}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground pointer-events-none">
              <span>◉ Drag to rotate</span>
              <span>360° showcase</span>
            </div>
          </motion.div>

          {/* Copy */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="order-1 lg:order-2"
          >
            <span className="text-primary font-medium tracking-widest uppercase text-sm">
              Signature Piece
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-7xl font-display mt-4 mb-6 leading-none">
              THE <span className="text-gradient">{firstWord}</span>
              <br />
              {restWords.join(" ")}
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-md">
              {product.shortDescription}
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8 max-w-md">
              {(product.highlights ?? []).map((s) => (
                <div key={s.key} className="border-l-2 border-primary pl-3">
                  <div className="text-2xl font-display">{s.value}</div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">
                    {s.key}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <motion.button
                onClick={handleShop}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="gradient-neon text-primary-foreground px-8 py-4 font-semibold uppercase tracking-wide rounded-full neon-glow"
              >
                Shop ₹{product.price}
              </motion.button>
              {product.stock > 0 && product.stock <= 20 && (
                <span className="text-sm text-muted-foreground">
                  Only <span className="text-primary font-semibold">{product.stock}</span> left
                </span>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Showcase360;

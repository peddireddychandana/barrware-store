import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

const CustomCursor = () => {
  const [mounted, setMounted] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { damping: 25, stiffness: 250, mass: 0.5 });
  const sy = useSpring(y, { damping: 25, stiffness: 250, mass: 0.5 });

  useEffect(() => {
    setMounted(true);
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch) return;

    const move = (e) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    const over = (e) => {
      const t = e.target;
      if (t.closest("a, button, [role='button'], input, textarea")) setIsHovering(true);
    };
    const out = () => setIsHovering(false);

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseover", over);
    window.addEventListener("mouseout", out);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
      window.removeEventListener("mouseout", out);
    };
  }, [x, y]);

  if (!mounted) return null;

  return (
    <>
      <motion.div
        style={{ x: sx, y: sy }}
        className="pointer-events-none fixed left-0 top-0 z-[9999] hidden lg:block"
      >
        <motion.div
          animate={{
            scale: isHovering ? 2.2 : 1,
            opacity: isHovering ? 0.4 : 0.9,
          }}
          transition={{ duration: 0.25 }}
          className="-translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary neon-glow"
        />
      </motion.div>
      <motion.div
        style={{ x, y }}
        className="pointer-events-none fixed left-0 top-0 z-[9998] hidden lg:block"
      >
        <motion.div
          animate={{
            scale: isHovering ? 1.6 : 1,
            borderColor: isHovering ? "oklch(0.65 0.22 45 / 0.8)" : "oklch(0.65 0.22 45 / 0.3)",
          }}
          className="-translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full border"
        />
      </motion.div>
    </>
  );
};

export default CustomCursor;

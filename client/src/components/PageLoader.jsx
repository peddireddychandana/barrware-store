import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Martini } from "lucide-react";

const WORDS = ["SHAKE", "STIR", "STRAIN", "SERVE"];
const LOADER_DURATION = 3600;

const PageLoader = () => {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [wordIdx, setWordIdx] = useState(0);

  useEffect(() => {
    if (!sessionStorage.getItem("barware_loaded")) {
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    document.body.style.overflow = "hidden";

    const start = performance.now();
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / LOADER_DURATION);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - p, 3);
      setProgress(eased * 100);
      if (p < 1) raf = requestAnimationFrame(tick);
      else {
        sessionStorage.setItem("barware_loaded", "1");
        setTimeout(() => setVisible(false), 500);
      }
    };
    raf = requestAnimationFrame(tick);

    const wordTimer = setInterval(() => setWordIdx((i) => (i + 1) % WORDS.length), 650);

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(wordTimer);
      document.body.style.overflow = "";
    };
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="page-loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.75, ease: "easeInOut" } }}
          className="fixed inset-0 z-[10000] flex flex-col items-center justify-center overflow-hidden bg-background"
        >
          {/* animated ambient glow */}
          <motion.div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(600px circle at 50% 50%, rgba(217, 165, 46, 0.16), transparent 60%)",
            }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* subtle grid */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(217, 165, 46, 0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(217, 165, 46, 0.9) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
              maskImage: "radial-gradient(circle at center, black 40%, transparent 75%)",
            }}
          />

          {/* bar glass */}
          <motion.div
            aria-hidden
            className="absolute flex items-center justify-center"
            animate={{ rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          >
            <Martini
              className="w-[420px] h-[420px] md:w-[560px] md:h-[560px] text-primary/15"
              strokeWidth={0.8}
            />
          </motion.div>

          {/* content */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Monogram */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative mb-8"
            >
              <div className="w-20 h-20 rounded-2xl border border-primary/40 flex items-center justify-center backdrop-blur-sm bg-background/40 overflow-hidden">
                <img src="/logo.png" alt="Vyrnt logo" className="w-full h-full object-cover" />
              </div>
              <motion.div
                className="absolute inset-0 rounded-2xl border border-primary"
                animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0, 0.8] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
              />
            </motion.div>

            {/* Wordmark with mask reveal */}
            <div className="overflow-hidden">
              <motion.h1
                initial={{ y: "110%" }}
                animate={{ y: 0 }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                className="font-display text-5xl md:text-7xl tracking-[0.15em] text-primary"
              >
                <span className="text-gradient">VYRNT</span>
              </motion.h1>
            </div>

            {/* Rotating tagline */}
            <div className="mt-4 h-6 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.p
                  key={WORDS[wordIdx]}
                  initial={{ y: 24, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -24, opacity: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="text-[11px] uppercase tracking-[0.5em] text-primary"
                >
                  {WORDS[wordIdx]}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Progress bar */}
            <div className="mt-10 w-[280px] md:w-[360px]">
              <div className="relative h-[2px] w-full overflow-hidden rounded-full bg-primary/10">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${progress}%`,
                    background: "linear-gradient(90deg, #d9a52e, #b87927)",
                    boxShadow: "0 0 12px rgba(217, 165, 46, 0.55)",
                  }}
                />
                {/* shimmer */}
                <motion.div
                  className="absolute inset-y-0 w-24 -translate-x-full"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(242, 209, 138, 0.35), transparent)",
                  }}
                  animate={{ x: ["-100%", "500%"] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
                />
              </div>
              <div className="mt-3 flex justify-between text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-mono">
                <span>Loading experience</span>
                <span className="text-primary">
                  {String(Math.round(progress)).padStart(3, "0")}%
                </span>
              </div>
            </div>
          </div>

          {/* corner brackets */}
          <div className="pointer-events-none absolute inset-6 md:inset-10">
            {[
              "top-0 left-0 border-t border-l",
              "top-0 right-0 border-t border-r",
              "bottom-0 left-0 border-b border-l",
              "bottom-0 right-0 border-b border-r",
            ].map((cls, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.08, duration: 0.5 }}
                className={`absolute w-8 h-8 border-primary/50 ${cls}`}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PageLoader;

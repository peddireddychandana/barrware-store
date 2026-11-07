import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  hasConsentChoice,
  setAnalyticsConsent,
} from "@/lib/analytics";

const CookieConsent = () => {
  const [visible, setVisible] = useState(() => !hasConsentChoice());

  const choose = (accepted) => {
    setAnalyticsConsent(accepted);
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-[60]"
          role="dialog"
          aria-label="Cookie preferences"
        >
          <div className="bg-card border border-border rounded-2xl card-shadow p-5 text-sm">
            <p className="text-foreground font-medium mb-1">Cookies & analytics</p>
            <p className="text-muted-foreground mb-4">
              We use essential cookies to keep your cart and session working. With
              your permission we also use analytics cookies to improve the store.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => choose(true)}
                className="flex-1 gradient-neon text-primary-foreground px-4 py-2.5 rounded-full text-xs font-semibold uppercase tracking-widest"
              >
                Accept all
              </button>
              <button
                onClick={() => choose(false)}
                className="flex-1 border border-border px-4 py-2.5 rounded-full text-xs font-semibold uppercase tracking-widest hover:border-primary transition-colors"
              >
                Essential only
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;

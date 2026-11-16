import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@radix-ui/react-tooltip";

import "@/lib/i18n";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { LocationProvider } from "@/context/LocationContext";
import { Toaster } from "@/components/ui/sonner";
import SmoothScroll from "@/components/SmoothScroll";
import SearchCommand from "@/components/SearchCommand";
import PageLoader from "@/components/PageLoader";
import CookieConsent from "@/components/CookieConsent";

const Providers = ({ children }) => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <AuthProvider>
            <WishlistProvider>
              <CartProvider>
                <LocationProvider>
                  <SmoothScroll>
                    <SearchCommand />
                    <PageLoader />
                    <Toaster />
                    <CookieConsent />
                    {children}
                  </SmoothScroll>
                </LocationProvider>
              </CartProvider>
            </WishlistProvider>
          </AuthProvider>
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

export default Providers;

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { wishlistService } from "@/services";
import { getErrorMessage } from "@/services/api";

const WishlistContext = createContext(undefined);

export const WishlistProvider = ({ children }) => {
  const { isLoggedIn, isLoading, openLoginModal } = useAuth();
  const [productIds, setProductIds] = useState([]);
  const [products, setProducts] = useState([]);

  const refresh = useCallback(async () => {
    if (!isLoggedIn) {
      setProductIds([]);
      setProducts([]);
      return;
    }
    try {
      const { items } = await wishlistService.get();
      setProducts(items);
      setProductIds(items.map((item) => item._id));
    } catch {
      setProductIds([]);
      setProducts([]);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoading) refresh();
  }, [isLoading, refresh]);

  const toggle = useCallback(
    async (productId) => {
      if (!isLoggedIn) {
        openLoginModal();
        toast.info("Sign in to save items to your wishlist");
        return false;
      }
      try {
        const result = await wishlistService.toggle(productId);
        setProductIds(result.productIds);
        await refresh();
        toast.success(result.added ? "Added to wishlist" : "Removed from wishlist");
        return result.added;
      } catch (error) {
        toast.error(getErrorMessage(error));
        return false;
      }
    },
    [isLoggedIn, openLoginModal, refresh],
  );

  return (
    <WishlistContext.Provider
      value={{
        productIds,
        products,
        count: productIds.length,
        isWishlisted: (id) => productIds.includes(String(id)),
        toggle,
        refresh,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined)
    throw new Error("useWishlist must be used within a WishlistProvider");
  return context;
};

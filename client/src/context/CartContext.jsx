import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { cartService } from "@/services";
import { getErrorMessage } from "@/services/api";
import { normalizeProduct } from "@/utils/format";
import { trackEvent } from "@/lib/analytics";

const GUEST_CART_KEY = "barware-guest-cart";
const GUEST_COUPON_KEY = "barware-guest-coupon";
const EMPTY_SUMMARY = {
  subtotal: 0,
  discount: 0,
  kitDiscount: 0,
  couponCode: "",
  couponDiscount: 0,
  tax: 0,
  shipping: 0,
  total: 0,
  itemCount: 0,
};

const CartContext = createContext(undefined);

const readGuestCart = () => {
  try {
    return JSON.parse(localStorage.getItem(GUEST_CART_KEY)) || [];
  } catch {
    return [];
  }
};

const writeGuestCart = (lines) => {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(lines));
  } catch {
    /* storage unavailable */
  }
};

const readGuestCoupon = () => {
  try {
    return localStorage.getItem(GUEST_COUPON_KEY) || "";
  } catch {
    return "";
  }
};

const writeGuestCoupon = (code) => {
  try {
    if (code) localStorage.setItem(GUEST_COUPON_KEY, code);
    else localStorage.removeItem(GUEST_COUPON_KEY);
  } catch {
    /* storage unavailable */
  }
};

const toCartItems = (items = []) =>
  items.map(({ product, quantity, kitId }) => ({
    ...normalizeProduct(product),
    quantity,
    kitId,
  }));

export const CartProvider = ({ children }) => {
  const { isLoggedIn, isLoading: isAuthLoading } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [coupon, setCoupon] = useState(null);
  const wasLoggedIn = useRef(false);

  const applyCart = useCallback((cart) => {
    setCartItems(toCartItems(cart.items));
    setSummary(cart.summary ?? EMPTY_SUMMARY);
    setCoupon(cart.coupon ?? (cart.summary?.couponCode ? { code: cart.summary.couponCode } : null));
  }, []);

  const refreshGuestCart = useCallback(async () => {
    const lines = readGuestCart();
    if (lines.length === 0) {
      writeGuestCoupon("");
      applyCart({ items: [], summary: EMPTY_SUMMARY });
      return;
    }
    const code = readGuestCoupon();
    try {
      applyCart(await cartService.quote(lines, code));
    } catch {
      if (code) {
        // Coupon became invalid for this cart; drop it and retry.
        writeGuestCoupon("");
        try {
          applyCart(await cartService.quote(lines));
          return;
        } catch {
          /* fall through */
        }
      }
      applyCart({ items: [], summary: EMPTY_SUMMARY });
    }
  }, [applyCart]);

  const refreshCart = useCallback(async () => {
    if (isLoggedIn) {
      applyCart(await cartService.get());
    } else {
      await refreshGuestCart();
    }
  }, [isLoggedIn, applyCart, refreshGuestCart]);

  useEffect(() => {
    if (isAuthLoading) return;
    const syncCart = async () => {
      try {
        if (isLoggedIn && !wasLoggedIn.current) {
          const guestLines = readGuestCart();
          for (const line of guestLines) {
            await cartService.add(line.productId, line.quantity).catch(() => {});
          }
          if (guestLines.length > 0) writeGuestCart([]);
        }
        wasLoggedIn.current = isLoggedIn;
        await refreshCart();
      } catch {
        applyCart({ items: [], summary: EMPTY_SUMMARY });
      }
    };
    syncCart();
  }, [isLoggedIn, isAuthLoading, refreshCart, applyCart]);

  const mutateGuestCart = async (change) => {
    writeGuestCart(change(readGuestCart()));
    await refreshGuestCart();
  };

  /**
   * Adds a product. Resolves true on success; failures (e.g. over stock) toast the server message.
   */
  const addToCart = async (product, quantity = 1) => {
    const productId = product.id ?? product._id;
    try {
      if (isLoggedIn) {
        applyCart(await cartService.add(productId, quantity));
      } else {
        const existing = readGuestCart().find((line) => line.productId === productId);
        const wanted = (existing?.quantity ?? 0) + quantity;
        if (product.stock !== undefined && wanted > product.stock) {
          throw new Error(`Only ${product.stock} in stock`);
        }
        await mutateGuestCart((lines) =>
          existing
            ? lines.map((line) =>
                line.productId === productId ? { ...line, quantity: wanted } : line,
              )
            : [...lines, { productId, quantity }],
        );
      }
      trackEvent("add_to_cart", {
        currency: "INR",
        value: Number(product.price || 0) * quantity,
        items: [
          {
            item_id: productId,
            item_name: product.name,
            price: Number(product.price || 0),
            quantity,
          },
        ],
      });
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error));
      return false;
    }
  };

  const updateQuantity = async (productId, quantity) => {
    try {
      if (isLoggedIn) {
        applyCart(await cartService.update(productId, Math.max(quantity, 0)));
      } else {
        await mutateGuestCart((lines) =>
          quantity <= 0
            ? lines.filter((line) => line.productId !== productId)
            : lines.map((line) => (line.productId === productId ? { ...line, quantity } : line)),
        );
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const removeFromCart = (productId) => updateQuantity(productId, 0);

  const clearCart = async () => {
    if (isLoggedIn) {
      await cartService.clear().catch(() => {});
    } else {
      writeGuestCart([]);
      writeGuestCoupon("");
    }
    applyCart({ items: [], summary: EMPTY_SUMMARY });
  };

  const applyCoupon = async (code) => {
    const normalized = String(code || "").trim().toUpperCase();
    if (!normalized) return false;
    try {
      if (isLoggedIn) {
        applyCart(await cartService.applyCoupon(normalized));
      } else {
        writeGuestCoupon(normalized);
        applyCart(await cartService.quote(readGuestCart(), normalized));
      }
      toast.success("Coupon applied");
      return true;
    } catch (error) {
      if (!isLoggedIn) writeGuestCoupon("");
      toast.error(getErrorMessage(error));
      return false;
    }
  };

  const removeCoupon = async () => {
    try {
      if (isLoggedIn) {
        applyCart(await cartService.removeCoupon());
      } else {
        writeGuestCoupon("");
        applyCart(
          readGuestCart().length
            ? await cartService.quote(readGuestCart())
            : { items: [], summary: EMPTY_SUMMARY },
        );
      }
      toast.success("Coupon removed");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const checkoutItems = cartItems.map((item) => ({
    productId: item.id ?? item._id,
    quantity: item.quantity,
    ...(item.kitId ? { kitId: item.kitId } : {}),
  }));

  const addKit = async (kitItems) => {
    applyCart(await cartService.addKit(kitItems));
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        summary,
        coupon,
        couponCode: summary.couponCode || coupon?.code || "",
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        addKit,
        applyCoupon,
        removeCoupon,
        checkoutItems,
        refreshCart,
        cartTotal: summary.total,
        cartCount: summary.itemCount || cartItems.reduce((count, item) => count + item.quantity, 0),
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

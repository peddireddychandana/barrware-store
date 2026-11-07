export const STATUS_FLOW = [
  "placed",
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
];

export const STATUS_LABELS = {
  placed: "Placed",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const STATUS_BADGE_CLASSES = {
  delivered: "bg-primary/15 text-primary",
  cancelled: "bg-destructive/15 text-destructive",
};

export const CANCELLABLE_STATUSES = ["placed", "confirmed"];

/** Guest order tokens are kept locally so guests can reopen their order. */
export const guestTokenFor = (orderId) => {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("token");
    if (fromUrl) {
      const saved = JSON.parse(localStorage.getItem("barware-guest-orders") || "{}");
      saved[orderId] = fromUrl;
      localStorage.setItem("barware-guest-orders", JSON.stringify(saved));
      return fromUrl;
    }
    return JSON.parse(localStorage.getItem("barware-guest-orders") || "{}")[orderId] || "";
  } catch {
    return "";
  }
};

/** @param {string|number|Date} value @returns {string} e.g. "30 Oct 2026, 4:15 PM" */
export const formatDateTime = (value) =>
  new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

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
  delivered: "bg-green-500/15 text-green-600",
  cancelled: "bg-destructive/15 text-destructive",
};

export const CANCELLABLE_STATUSES = ["placed", "confirmed"];

/** @param {string|number|Date} value @returns {string} e.g. "30 Oct 2026, 4:15 PM" */
export const formatDateTime = (value) =>
  new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export const ORDER_FLOW = [
  "placed",
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
];

export const STATUS_FILTERS = [...ORDER_FLOW, "cancelled"];

export const statusLabel = (status) =>
  status.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

const STATUS_STYLES = {
  placed: "bg-secondary text-foreground border-border",
  confirmed: "bg-accent/15 text-primary border-accent/40",
  packed: "bg-accent/15 text-primary border-accent/40",
  shipped: "bg-primary/15 text-primary border-primary/40",
  out_for_delivery: "bg-primary/15 text-primary border-primary/40",
  delivered: "bg-primary/15 text-primary border-primary/40",
  cancelled: "bg-destructive/15 text-destructive border-destructive/40",
};

export const StatusBadge = ({ status }) => (
  <span
    className={`inline-block px-3 py-1 rounded-full border text-xs font-medium uppercase tracking-widest whitespace-nowrap ${
      STATUS_STYLES[status] ?? STATUS_STYLES.placed
    }`}
  >
    {statusLabel(status)}
  </span>
);

const PAYMENT_STYLES = {
  pending: "bg-accent/15 text-primary border-accent/40",
  paid: "bg-primary/15 text-primary border-primary/40",
  failed: "bg-destructive/15 text-destructive border-destructive/40",
  not_required: "bg-secondary text-foreground border-border",
};

const PAYMENT_LABELS = {
  pending: "Payment pending",
  paid: "Paid",
  failed: "Payment failed",
  not_required: "Pay on delivery",
};

export const PaymentStatusBadge = ({ status }) => (
  <span
    className={`inline-block px-3 py-1 rounded-full border text-xs font-medium uppercase tracking-widest whitespace-nowrap ${
      PAYMENT_STYLES[status] ?? PAYMENT_STYLES.pending
    }`}
  >
    {PAYMENT_LABELS[status] ?? status}
  </span>
);

/** Statuses an admin can move an order to: later steps in the flow, plus cancel. */
export const nextStatuses = (current) => {
  if (current === "delivered" || current === "cancelled") return [];
  return [...ORDER_FLOW.slice(ORDER_FLOW.indexOf(current) + 1), "cancelled"];
};

export const formatDate = (value) =>
  new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export const formatDateTime = (value) =>
  new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

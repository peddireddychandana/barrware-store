import { STATUS_BADGE_CLASSES, STATUS_LABELS } from "@/utils/orders";

const OrderStatusBadge = ({ status }) => (
  <span
    className={`px-3 py-1 text-[10px] font-semibold uppercase tracking-widest rounded-full ${
      STATUS_BADGE_CLASSES[status] ?? "bg-primary/15 text-primary"
    }`}
  >
    {STATUS_LABELS[status] ?? status}
  </span>
);

export default OrderStatusBadge;

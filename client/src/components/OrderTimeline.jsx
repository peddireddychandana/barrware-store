import { Check, X } from "lucide-react";
import { STATUS_FLOW, STATUS_LABELS, formatDateTime } from "@/utils/orders";

const buildSteps = (order) => {
  const historyByStatus = Object.fromEntries(
    (order.statusHistory ?? []).map((entry) => [entry.status, entry]),
  );
  if (order.status === "cancelled") {
    const reachedBeforeCancel = STATUS_FLOW.filter((status) => historyByStatus[status]);
    return [...reachedBeforeCancel, "cancelled"].map((status) => ({
      status,
      entry: historyByStatus[status],
      state: status === "cancelled" ? "cancelled" : "done",
    }));
  }
  const currentIndex = STATUS_FLOW.indexOf(order.status);
  return STATUS_FLOW.map((status, index) => ({
    status,
    entry: historyByStatus[status],
    state: index < currentIndex ? "done" : index === currentIndex ? "current" : "upcoming",
  }));
};

const DOT_CLASSES = {
  done: "bg-primary text-primary-foreground",
  current: "bg-primary text-primary-foreground ring-4 ring-primary/25",
  upcoming: "bg-secondary text-muted-foreground border border-border",
  cancelled: "bg-destructive text-destructive-foreground",
};

/** Vertical status timeline driven by order.status and order.statusHistory. */
const OrderTimeline = ({ order }) => (
  <ol className="space-y-0">
    {buildSteps(order).map(({ status, entry, state }, index, steps) => (
      <li key={status} className="flex gap-4">
        <div className="flex flex-col items-center">
          <span
            className={`w-8 h-8 rounded-full flex items-center justify-center ${DOT_CLASSES[state]}`}
          >
            {state === "cancelled" ? (
              <X className="w-4 h-4" />
            ) : state !== "upcoming" ? (
              <Check className="w-4 h-4" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-muted-foreground/50" />
            )}
          </span>
          {index < steps.length - 1 && (
            <span
              className={`w-0.5 flex-1 min-h-6 ${state === "done" ? "bg-primary" : "bg-border"}`}
            />
          )}
        </div>
        <div className="pb-6">
          <p
            className={`font-medium ${state === "upcoming" ? "text-muted-foreground" : state === "cancelled" ? "text-destructive" : ""}`}
          >
            {STATUS_LABELS[status]}
          </p>
          {entry && <p className="text-xs text-muted-foreground">{formatDateTime(entry.at)}</p>}
          {entry?.note && <p className="text-xs text-muted-foreground">{entry.note}</p>}
        </div>
      </li>
    ))}
  </ol>
);

export default OrderTimeline;

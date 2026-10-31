import { useState } from "react";
import Link from "@/components/AppLink";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Ban, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { adminService, orderService } from "@/services";
import { getErrorMessage } from "@/services/api";
import { formatPrice } from "@/utils/format";
import {
  ConfirmDialog,
  Field,
  PageHeader,
  Panel,
  QueryState,
  inputClass,
  primaryButtonClass,
} from "@/components/admin/AdminUi";
import {
  StatusBadge,
  formatDateTime,
  nextStatuses,
  statusLabel,
} from "@/components/admin/orderStatus";

const InfoLine = ({ label, children }) => (
  <div className="flex justify-between gap-4 py-1.5 text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-right">{children}</span>
  </div>
);

const StatusUpdateForm = ({ order, onUpdated }) => {
  const options = nextStatuses(order.status);
  const [status, setStatus] = useState(options[0] ?? "");
  const [note, setNote] = useState("");
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);

  const update = useMutation({
    mutationFn: () =>
      adminService.updateOrderStatus(order._id, { status, note: note.trim() || undefined }),
    onSuccess: () => {
      toast.success(`Order marked ${statusLabel(status).toLowerCase()}`);
      setNote("");
      onUpdated();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
    onSettled: () => setIsConfirmingCancel(false),
  });

  if (!options.length) {
    return (
      <p className="p-5 text-muted-foreground text-sm">
        This order is {order.status} and can no longer be changed.
      </p>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (status === "cancelled") setIsConfirmingCancel(true);
    else update.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4">
      <Field label="Move to">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
          {options.map((value) => (
            <option key={value} value={value}>
              {statusLabel(value)}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Note (optional)">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={200}
          className={inputClass}
        />
      </Field>
      <button type="submit" disabled={update.isPending} className={`${primaryButtonClass} w-full`}>
        {update.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
        Update status
      </button>
      <ConfirmDialog
        open={isConfirmingCancel}
        title="CANCEL ORDER?"
        message="The order will be cancelled and its stock returned to inventory. This cannot be undone."
        confirmLabel="Cancel order"
        isBusy={update.isPending}
        onCancel={() => setIsConfirmingCancel(false)}
        onConfirm={() => update.mutate()}
      />
    </form>
  );
};

const OrderDetail = ({ order, onUpdated }) => {
  const { shippingAddress: address, summary } = order;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {order.status === "cancelled" && (
          <div className="flex items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive px-5 py-3">
            <Ban className="w-5 h-5 shrink-0" />
            This order was cancelled and its stock has been restored.
          </div>
        )}

        <Panel title="ITEMS">
          <ul>
            {order.items.map((item, index) => (
              <li
                key={`${item.product}-${index}`}
                className="flex items-center gap-4 px-5 py-3 border-t border-border first:border-t-0"
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt=""
                    className="w-14 h-14 rounded-lg object-cover bg-secondary"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-secondary" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.sku} · {formatPrice(item.price)} × {item.quantity}
                  </p>
                </div>
                <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Panel title="CUSTOMER & SHIPPING">
            <div className="p-5 text-sm space-y-0.5">
              <p className="font-medium">{address.fullName}</p>
              <p className="text-muted-foreground">{address.email}</p>
              <p className="text-muted-foreground mb-3">{address.phone}</p>
              <p>{address.line1}</p>
              {address.line2 && <p>{address.line2}</p>}
              <p>
                {address.city}, {address.state} {address.pincode}
              </p>
            </div>
          </Panel>

          <Panel title="PAYMENT & SUMMARY">
            <div className="p-5">
              <InfoLine label="Payment method">
                {order.paymentMethod === "COD" ? "Cash on delivery" : order.paymentMethod}
              </InfoLine>
              <InfoLine label="Subtotal">{formatPrice(summary.subtotal)}</InfoLine>
              <InfoLine label="Discount">-{formatPrice(summary.discount)}</InfoLine>
              {summary.kitDiscount > 0 && (
                <InfoLine label="Kit discount">-{formatPrice(summary.kitDiscount)}</InfoLine>
              )}
              <InfoLine label="Shipping">
                {summary.shipping ? formatPrice(summary.shipping) : "Free"}
              </InfoLine>
              <div className="flex justify-between pt-3 mt-2 border-t border-border text-lg font-medium">
                <span>Total</span>
                <span className="text-gradient">{formatPrice(summary.total)}</span>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <div className="space-y-6">
        <Panel title="UPDATE STATUS">
          <StatusUpdateForm key={order.status} order={order} onUpdated={onUpdated} />
        </Panel>

        <Panel title="STATUS HISTORY">
          <ol className="p-5 space-y-4">
            {[...order.statusHistory].reverse().map((entry, index) => (
              <li
                key={`${entry.status}-${entry.at}-${index}`}
                className="border-l-2 border-primary pl-4"
              >
                <StatusBadge status={entry.status} />
                <p className="text-xs text-muted-foreground mt-1">{formatDateTime(entry.at)}</p>
                {entry.note && <p className="text-sm mt-0.5">{entry.note}</p>}
              </li>
            ))}
          </ol>
        </Panel>
      </div>
    </div>
  );
};

const AdminOrderDetailPage = ({ orderId }) => {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["admin", "order", orderId],
    queryFn: () => orderService.get(orderId),
  });
  const order = query.data;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin"] });
  };

  return (
    <>
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to orders
      </Link>
      <PageHeader
        title="ORDER"
        accent={order?.orderNumber ?? ""}
        subtitle={order ? `Placed ${formatDateTime(order.createdAt)}` : undefined}
        action={order && <StatusBadge status={order.status} />}
      />
      <QueryState query={query}>
        {order && <OrderDetail order={order} onUpdated={refresh} />}
      </QueryState>
    </>
  );
};

export default AdminOrderDetailPage;

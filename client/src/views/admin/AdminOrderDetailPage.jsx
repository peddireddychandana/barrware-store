import { useState } from "react";
import Link from "@/components/AppLink";
import { useRouter } from "@/lib/router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Ban, Loader2, Trash2, Truck } from "lucide-react";
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
  PaymentStatusBadge,
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

const PaymentUpdateForm = ({ order, onUpdated }) => {
  const update = useMutation({
    mutationFn: (status) => adminService.updatePaymentStatus(order._id, { status }),
    onSuccess: (_data, status) => {
      toast.success(status === "paid" ? "Payment marked as received" : "Payment marked as failed");
      onUpdated();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  if (order.paymentMethod !== "UPI") {
    return (
      <p className="p-5 text-sm text-muted-foreground">
        Cash on Delivery — collect {formatPrice(order.summary.total)} when the order is delivered.
      </p>
    );
  }

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">Payment status</span>
        <PaymentStatusBadge status={order.paymentStatus} />
      </div>

      <div className="space-y-1 text-sm">
        <InfoLine label="Amount">{formatPrice(order.summary.total)}</InfoLine>
        <InfoLine label="Reference">
          {order.paymentReference || <span className="text-muted-foreground">Not submitted</span>}
        </InfoLine>
        {order.paymentSubmittedAt && (
          <InfoLine label="Submitted">{formatDateTime(order.paymentSubmittedAt)}</InfoLine>
        )}
        {order.paidAt && <InfoLine label="Confirmed">{formatDateTime(order.paidAt)}</InfoLine>}
      </div>

      <p className="text-xs text-muted-foreground">
        Check your UPI app or bank statement for this reference before confirming.
      </p>

      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={() => update.mutate("paid")}
          disabled={update.isPending || order.paymentStatus === "paid"}
          className={`${primaryButtonClass} flex-1`}
        >
          {update.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Mark paid
        </button>
        <button
          type="button"
          onClick={() => update.mutate("failed")}
          disabled={update.isPending || order.paymentStatus === "failed"}
          className="flex-1 px-4 py-2.5 rounded-lg border border-destructive text-destructive text-sm font-semibold uppercase tracking-wide hover:bg-destructive/10 transition-colors disabled:opacity-50"
        >
          Mark failed
        </button>
      </div>

      {order.paymentStatus === "paid" && order.status === "placed" && (
        <p className="text-xs text-muted-foreground">
          Payment confirmed. You can now move this order to Confirmed.
        </p>
      )}
    </div>
  );
};

const TrackingForm = ({ order, onUpdated }) => {
  const [form, setForm] = useState({
    carrier: order.tracking?.carrier ?? "",
    number: order.tracking?.number ?? "",
    url: order.tracking?.url ?? "",
  });
  const save = useMutation({
    mutationFn: () =>
      adminService.updateTracking(order._id, {
        carrier: form.carrier.trim(),
        number: form.number.trim(),
        url: form.url.trim(),
      }),
    onSuccess: () => {
      toast.success("Tracking details saved");
      onUpdated();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const setField = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
      className="p-5 space-y-4"
    >
      <Field label="Courier">
        <input value={form.carrier} onChange={setField("carrier")} maxLength={80} className={inputClass} placeholder="Delhivery / Blue Dart" />
      </Field>
      <Field label="AWB / Tracking number">
        <input value={form.number} onChange={setField("number")} maxLength={80} className={inputClass} />
      </Field>
      <Field label="Tracking URL (optional)">
        <input value={form.url} onChange={setField("url")} maxLength={300} className={inputClass} placeholder="https://..." />
      </Field>
      <button type="submit" disabled={save.isPending} className={`${primaryButtonClass} w-full`}>
        {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
        Save tracking
      </button>
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
                {order.paymentMethod === "COD" ? "Cash on delivery" : "UPI / QR"}
              </InfoLine>
              {order.paymentMethod === "UPI" && (
                <InfoLine label="Payment status">
                  <PaymentStatusBadge status={order.paymentStatus} />
                </InfoLine>
              )}
              {order.paymentReference && (
                <InfoLine label="Reference">{order.paymentReference}</InfoLine>
              )}
              <InfoLine label="Subtotal">{formatPrice(summary.subtotal)}</InfoLine>
              <InfoLine label="Discount">-{formatPrice(summary.discount)}</InfoLine>
              {summary.kitDiscount > 0 && (
                <InfoLine label="Kit discount">-{formatPrice(summary.kitDiscount)}</InfoLine>
              )}
              {summary.couponDiscount > 0 && (
                <InfoLine label={`Coupon ${summary.couponCode}`}>
                  -{formatPrice(summary.couponDiscount)}
                </InfoLine>
              )}
              <InfoLine label="Shipping">
                {summary.shipping ? formatPrice(summary.shipping) : "Free"}
              </InfoLine>
              {summary.tax > 0 && (
                <InfoLine label="Includes GST">{formatPrice(summary.tax)}</InfoLine>
              )}
              <div className="flex justify-between pt-3 mt-2 border-t border-border text-lg font-medium">
                <span>Total</span>
                <span className="text-gradient">{formatPrice(summary.total)}</span>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <div className="space-y-6">
        <Panel title="PAYMENT VERIFICATION">
          <PaymentUpdateForm key={order.paymentStatus} order={order} onUpdated={onUpdated} />
        </Panel>

        <Panel title="UPDATE STATUS">
          <StatusUpdateForm key={order.status} order={order} onUpdated={onUpdated} />
        </Panel>

        <Panel title="SHIPMENT TRACKING">
          <TrackingForm key={`${order.tracking?.number}-${order.tracking?.carrier}`} order={order} onUpdated={onUpdated} />
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
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const query = useQuery({
    queryKey: ["admin", "order", orderId],
    queryFn: () => orderService.get(orderId),
  });
  const order = query.data;

  const remove = useMutation({
    mutationFn: () => adminService.deleteOrder(orderId),
    onSuccess: () => {
      toast.success("Order deleted");
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      router.push("/admin/orders");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
    onSettled: () => setIsConfirmingDelete(false),
  });

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
        action={
          order && (
            <div className="flex items-center gap-3">
              <StatusBadge status={order.status} />
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-destructive text-destructive text-xs font-semibold uppercase tracking-widest hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          )
        }
      />
      <QueryState query={query}>
        {order && <OrderDetail order={order} onUpdated={refresh} />}
      </QueryState>
      <ConfirmDialog
        open={isConfirmingDelete}
        title="DELETE ORDER?"
        message={`Order ${order?.orderNumber ?? ""} will be permanently deleted. Stock for in-progress orders is restored.`}
        confirmLabel="Delete order"
        isBusy={remove.isPending}
        onCancel={() => setIsConfirmingDelete(false)}
        onConfirm={() => remove.mutate()}
      />
    </>
  );
};

export default AdminOrderDetailPage;

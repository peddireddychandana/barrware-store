import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, PackageSearch } from "lucide-react";
import { toast } from "sonner";
import { orderService } from "@/services";
import { getErrorMessage } from "@/services/api";
import { formatPrice } from "@/utils/format";
import { formatDateTime } from "@/utils/orders";
import PageShell from "@/components/PageShell";
import PageHeading from "@/components/PageHeading";
import FormField from "@/components/FormField";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import OrderTimeline from "@/components/OrderTimeline";

const TrackOrderPage = () => {
  const [form, setForm] = useState({ orderNumber: "", email: "" });
  const track = useMutation({
    mutationFn: () => orderService.track(form),
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const order = track.data;
  const setField = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <PageShell>
      <PageHeading
        title="TRACK"
        highlight="ORDER"
        subtitle="Enter your order number and the email used at checkout"
      />
      <div className="grid lg:grid-cols-[380px_1fr] gap-8 items-start max-w-5xl mx-auto">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            track.mutate();
          }}
          className="bg-card border border-border rounded-2xl p-6 space-y-4"
        >
          <FormField
            label="Order number"
            placeholder="BW-20260101-AB12"
            value={form.orderNumber}
            onChange={setField("orderNumber")}
          />
          <FormField
            label="Email"
            type="email"
            value={form.email}
            onChange={setField("email")}
            autoComplete="email"
          />
          <button
            type="submit"
            disabled={track.isPending || !form.orderNumber.trim() || !form.email.trim()}
            className="w-full inline-flex items-center justify-center gap-2 gradient-neon text-primary-foreground py-3 rounded-full text-sm font-semibold uppercase tracking-widest disabled:opacity-60"
          >
            {track.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <PackageSearch className="w-4 h-4" />}
            Track order
          </button>
          <p className="text-xs text-muted-foreground">
            Check your confirmation email for the order number. Guest orders can also be
            opened directly from the link in that email.
          </p>
        </form>

        <div className="space-y-6">
          {order ? (
            <>
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <p className="font-display text-2xl">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      Placed {formatDateTime(order.createdAt)}
                    </p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>
                <ul className="divide-y divide-border">
                  {order.items.map((item, index) => (
                    <li key={`${item.product}-${index}`} className="flex items-center gap-3 py-2">
                      <img src={item.image} alt="" className="w-12 h-12 rounded object-cover bg-secondary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm line-clamp-1">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatPrice(item.price)} × {item.quantity}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between border-t border-border mt-3 pt-3 font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(order.summary.total)}</span>
                </div>
                {order.tracking?.number && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    {order.tracking.carrier} · {order.tracking.number}
                  </p>
                )}
              </div>
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="text-2xl font-display mb-4">STATUS</h2>
                <OrderTimeline order={order} />
              </div>
            </>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-10 text-center text-muted-foreground">
              <PackageSearch className="w-10 h-10 mx-auto mb-3 text-primary" />
              Your order details will appear here.
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default TrackOrderPage;

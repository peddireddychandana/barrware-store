import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "@/components/AppLink";
import { useParams } from "@/lib/router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { orderService } from "@/services";
import { getErrorMessage } from "@/services/api";
import { formatPrice } from "@/utils/format";
import { CANCELLABLE_STATUSES, formatDateTime } from "@/utils/orders";
import PageShell from "@/components/PageShell";
import RequireLogin from "@/components/RequireLogin";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import OrderSummaryPanel from "@/components/OrderSummaryPanel";
import OrderTimeline from "@/components/OrderTimeline";

const Card = ({ title, children }) => (
  <section className="bg-card border border-border rounded-2xl p-6">
    <h2 className="text-2xl font-display mb-4">{title}</h2>
    {children}
  </section>
);

const OrderDetail = ({ id }) => {
  const queryClient = useQueryClient();
  const [isJustPlaced, setIsJustPlaced] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const {
    data: order,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["order", id],
    queryFn: () => orderService.get(id),
  });

  useEffect(() => {
    setIsJustPlaced(new URLSearchParams(window.location.search).get("placed") === "1");
  }, []);

  if (isLoading) return <p className="py-24 text-center text-muted-foreground">Loading order...</p>;
  if (error || !order) {
    return (
      <div className="text-center py-24">
        <h1 className="text-5xl font-display mb-4">
          ORDER <span className="text-gradient">NOT FOUND</span>
        </h1>
        <p className="text-muted-foreground mb-8">
          {error ? getErrorMessage(error) : "We couldn't find that order."}
        </p>
        <Link
          href="/orders"
          className="inline-block gradient-neon text-primary-foreground px-8 py-3 font-semibold uppercase tracking-wide rounded-full neon-glow"
        >
          View My Orders
        </Link>
      </div>
    );
  }

  const { shippingAddress: address } = order;

  const handleCancel = async () => {
    if (!window.confirm("Cancel this order? This can't be undone.")) return;
    setIsCancelling(true);
    try {
      await orderService.cancel(order._id);
      await queryClient.invalidateQueries({ queryKey: ["order", id] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order cancelled");
    } catch (cancelError) {
      toast.error(getErrorMessage(cancelError));
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <>
      <Link
        href="/orders"
        className="inline-flex items-center gap-2 mb-8 text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to My Orders
      </Link>

      {isJustPlaced && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-start gap-4 rounded-2xl border border-primary/40 bg-primary/10 p-5"
        >
          <CheckCircle2 className="w-8 h-8 text-primary shrink-0" />
          <div>
            <h2 className="text-2xl font-display">ORDER PLACED SUCCESSFULLY</h2>
            <p className="text-sm text-muted-foreground">
              Thank you! We&apos;ve received order {order.orderNumber}. Pay in cash when it arrives.
            </p>
          </div>
        </motion.div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-display">{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">
            Placed on {formatDateTime(order.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <OrderStatusBadge status={order.status} />
          {CANCELLABLE_STATUSES.includes(order.status) && (
            <button
              onClick={handleCancel}
              disabled={isCancelling}
              className="px-6 py-2.5 border border-destructive text-destructive rounded-full text-sm font-semibold uppercase tracking-widest hover:bg-destructive/10 transition-colors disabled:opacity-60"
            >
              {isCancelling ? "Cancelling..." : "Cancel Order"}
            </button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
        <div className="space-y-8">
          <Card title="ITEMS">
            <ul className="divide-y divide-border">
              {order.items.map((item) => (
                <li
                  key={`${item.product}-${item.kitId ?? ""}`}
                  className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <img
                    src={item.image}
                    alt=""
                    className="w-16 h-16 rounded-lg object-cover bg-secondary"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium line-clamp-1">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatPrice(item.price)} × {item.quantity}
                      {item.kitId && " · Bar kit"}
                    </p>
                  </div>
                  <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
          </Card>

          <div className="grid sm:grid-cols-2 gap-8">
            <Card title="SHIPPING ADDRESS">
              <address className="not-italic text-sm text-muted-foreground space-y-1">
                <p className="text-foreground font-medium">{address.fullName}</p>
                <p>{address.line1}</p>
                {address.line2 && <p>{address.line2}</p>}
                <p>
                  {address.city}, {address.state} {address.pincode}
                </p>
                <p>{address.phone}</p>
                <p>{address.email}</p>
              </address>
            </Card>
            <Card title="PAYMENT">
              <p className="font-medium">
                {order.paymentMethod === "COD" ? "Cash on Delivery" : order.paymentMethod}
              </p>
              <p className="text-sm text-muted-foreground">Pay when your order is delivered.</p>
            </Card>
          </div>
        </div>

        <div className="space-y-8">
          <OrderSummaryPanel summary={order.summary} title="PRICE SUMMARY" />
          <Card title="ORDER STATUS">
            <OrderTimeline order={order} />
          </Card>
        </div>
      </div>
    </>
  );
};

const OrderDetailPage = () => {
  const { id } = useParams();
  return (
    <PageShell>
      <RequireLogin message="Please sign in to view this order.">
        <OrderDetail id={id} />
      </RequireLogin>
    </PageShell>
  );
};

export default OrderDetailPage;

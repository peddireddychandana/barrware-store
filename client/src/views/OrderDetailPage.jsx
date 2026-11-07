import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "@/components/AppLink";
import { useParams } from "@/lib/router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Loader2,
  QrCode,
  RotateCcw,
  Truck,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { orderService } from "@/services";
import { getErrorMessage } from "@/services/api";
import { formatPrice } from "@/utils/format";
import {
  CANCELLABLE_STATUSES,
  formatDateTime,
  guestTokenFor,
} from "@/utils/orders";
import PageShell from "@/components/PageShell";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import OrderSummaryPanel from "@/components/OrderSummaryPanel";
import OrderTimeline from "@/components/OrderTimeline";

const Card = ({ title, children }) => (
  <section className="bg-card border border-border rounded-2xl p-6">
    <h2 className="text-2xl font-display mb-4">{title}</h2>
    {children}
  </section>
);

const PAYMENT_STYLES = {
  pending: "bg-accent/15 text-primary border-accent/40",
  paid: "bg-primary/15 text-primary border-primary/40",
  failed: "bg-destructive/15 text-destructive border-destructive/40",
  not_required: "bg-secondary text-foreground border-border",
};

const PaymentBadge = ({ status }) => (
  <span
    className={`inline-block px-3 py-1 rounded-full border text-[10px] font-semibold uppercase tracking-widest ${
      PAYMENT_STYLES[status] ?? PAYMENT_STYLES.pending
    }`}
  >
    {status.replace(/_/g, " ")}
  </span>
);

const PaymentSection = ({ order, onUpdated, token }) => {
  const [reference, setReference] = useState(order.paymentReference || "");

  const submit = useMutation({
    mutationFn: () => orderService.submitPayment(order._id, reference.trim(), token),
    onSuccess: () => {
      toast.success("Payment reference submitted. We will confirm it shortly.");
      onUpdated();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (reference.trim().length < 6) {
      toast.error("Enter the UPI transaction / UTR ID");
      return;
    }
    submit.mutate();
  };

  if (order.paymentMethod !== "UPI") {
    return (
      <Card title="PAYMENT">
        <p className="font-medium">Cash on Delivery</p>
        <p className="text-sm text-muted-foreground">Pay when your order is delivered.</p>
      </Card>
    );
  }

  return (
    <Card title="PAYMENT">
      <div className="flex items-center justify-between gap-3 mb-4">
        <p className="font-medium">UPI / QR</p>
        <PaymentBadge status={order.paymentStatus} />
      </div>

      {order.paymentStatus === "paid" ? (
        <div className="flex items-start gap-3 rounded-xl border border-primary/40 bg-primary/10 p-4">
          <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
          <div>
            <p className="font-medium">Payment confirmed</p>
            <p className="text-sm text-muted-foreground">
              {order.paidAt ? `Received on ${formatDateTime(order.paidAt)}.` : "We have received your payment."}
            </p>
            {order.paymentReference && (
              <p className="text-xs text-muted-foreground mt-1">
                Reference: {order.paymentReference}
              </p>
            )}
          </div>
        </div>
      ) : order.upiUri ? (
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-secondary/30 p-4">
            <div className="rounded-xl bg-white p-3">
              <QRCodeSVG value={order.upiUri} size={188} level="M" includeMargin />
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Scan with any UPI app</p>
              <p className="font-display text-2xl text-gradient mt-1">
                {formatPrice(order.summary.total)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Order {order.orderNumber}</p>
            </div>
          </div>

          <div className="rounded-xl border border-border p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <QrCode className="w-4 h-4 text-primary" />
              <span className="font-medium">Already paid?</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter the transaction / UTR ID shown in your UPI app so we can verify your payment.
            </p>
            {order.paymentReference && (
              <p className="text-xs text-muted-foreground">
                Submitted reference:{" "}
                <span className="text-foreground font-medium">{order.paymentReference}</span>
                {order.paymentSubmittedAt && ` · ${formatDateTime(order.paymentSubmittedAt)}`}
              </p>
            )}
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                maxLength={80}
                placeholder="e.g. 123456789012"
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
              <button
                type="submit"
                disabled={submit.isPending}
                className="inline-flex items-center justify-center gap-2 gradient-neon text-primary-foreground px-4 py-2 text-sm font-semibold uppercase tracking-wide rounded-lg disabled:opacity-60"
              >
                {submit.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Submit
              </button>
            </form>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          The payment QR is not available right now. Please contact us at{" "}
          <Link href="/contact" className="text-primary hover:underline">
            support
          </Link>{" "}
          to complete your payment.
        </p>
      )}
    </Card>
  );
};

const TrackingCard = ({ order }) => {
  if (!order.tracking?.number && !order.tracking?.carrier) return null;
  return (
    <Card title="TRACKING">
      <div className="flex items-start gap-3">
        <Truck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="text-sm space-y-1">
          {order.tracking.carrier && <p className="font-medium">{order.tracking.carrier}</p>}
          {order.tracking.number && (
            <p className="text-muted-foreground">AWB / Tracking: {order.tracking.number}</p>
          )}
          {order.tracking.url && (
            <a
              href={order.tracking.url}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline inline-block"
            >
              Track shipment →
            </a>
          )}
        </div>
      </div>
    </Card>
  );
};

const ReturnForm = ({ order, onDone }) => {
  const { isLoggedIn, openLoginModal } = useAuth();
  const [reason, setReason] = useState("");
  const [quantities, setQuantities] = useState(() =>
    Object.fromEntries(order.items.map((item, index) => [index, 0])),
  );

  const request = useMutation({
    mutationFn: () =>
      orderService.requestReturn(order._id, {
        reason: reason.trim(),
        items: order.items
          .map((item, index) => ({
            productId: item.product,
            quantity: quantities[index],
          }))
          .filter((item) => item.quantity > 0),
      }),
    onSuccess: () => {
      toast.success("Return request submitted. We will review it shortly.");
      setReason("");
      setQuantities(Object.fromEntries(order.items.map((_item, index) => [index, 0])));
      onDone?.();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  if (order.status !== "delivered") return null;

  const totalSelected = Object.values(quantities).reduce((sum, qty) => sum + qty, 0);

  return (
    <Card title="RETURN OR EXCHANGE">
      {!isLoggedIn ? (
        <div className="text-sm text-muted-foreground">
          <p className="mb-3">Sign in to raise a return request for this order.</p>
          <button
            onClick={openLoginModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-primary text-primary text-xs font-semibold uppercase tracking-widest hover:bg-primary/10 transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Sign in
          </button>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!reason.trim()) return toast.error("Tell us why you are returning this");
            if (totalSelected === 0) return toast.error("Select at least one item");
            request.mutate();
          }}
          className="space-y-4"
        >
          <p className="text-sm text-muted-foreground">
            Returns are accepted within 7 days of delivery. Choose the items and quantity you
            want to return.
          </p>
          <ul className="space-y-2">
            {order.items.map((item, index) => (
              <li key={`${item.product}-${index}`} className="flex items-center gap-3 text-sm">
                <img src={item.image} alt="" className="w-10 h-10 rounded object-cover bg-secondary" />
                <span className="flex-1 line-clamp-1">{item.name}</span>
                <input
                  type="number"
                  min={0}
                  max={item.quantity}
                  value={quantities[index]}
                  onChange={(e) =>
                    setQuantities((prev) => ({
                      ...prev,
                      [index]: Math.max(0, Math.min(item.quantity, Number(e.target.value) || 0)),
                    }))
                  }
                  className="w-16 rounded-lg border border-border bg-background px-2 py-1 text-center"
                  aria-label={`Quantity of ${item.name} to return`}
                />
                <span className="text-xs text-muted-foreground">of {item.quantity}</span>
              </li>
            ))}
          </ul>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Reason for return (e.g. damaged in transit)"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            disabled={request.isPending}
            className="inline-flex items-center justify-center gap-2 gradient-neon text-primary-foreground px-6 py-2.5 text-xs font-semibold uppercase tracking-widest rounded-full disabled:opacity-60"
          >
            {request.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Submit return request
          </button>
        </form>
      )}
    </Card>
  );
};

const OrderDetail = ({ id, token }) => {
  const { isLoggedIn } = useAuth();
  const queryClient = useQueryClient();
  const [isJustPlaced, setIsJustPlaced] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const {
    data: order,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["order", id, token],
    queryFn: () => orderService.get(id, token),
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
      await orderService.cancel(order._id, token);
      await queryClient.invalidateQueries({ queryKey: ["order", id, token] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order cancelled");
    } catch (cancelError) {
      toast.error(getErrorMessage(cancelError));
    } finally {
      setIsCancelling(false);
    }
  };

  const refreshOrder = () => {
    queryClient.invalidateQueries({ queryKey: ["order", id, token] });
    queryClient.invalidateQueries({ queryKey: ["orders"] });
  };

  const invoiceHref = `/orders/${order._id}/invoice${token ? `?token=${token}` : ""}`;

  return (
    <>
      <Link
        href={isLoggedIn ? "/orders" : "/track-order"}
        className="inline-flex items-center gap-2 mb-8 text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        {isLoggedIn ? "Back to My Orders" : "Back to Track Order"}
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
              Thank you! We&apos;ve received order {order.orderNumber}.{" "}
              {order.paymentMethod === "UPI"
                ? "Scan the UPI QR below to complete your payment."
                : "Pay in cash when it arrives."}
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
        <div className="flex flex-wrap items-center gap-3">
          <OrderStatusBadge status={order.status} />
          {order.paymentMethod === "UPI" && <PaymentBadge status={order.paymentStatus} />}
          <Link
            href={invoiceHref}
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-border rounded-full text-sm font-semibold uppercase tracking-widest hover:border-primary hover:text-primary transition-colors"
          >
            <FileText className="w-4 h-4" /> Invoice
          </Link>
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
            <PaymentSection order={order} onUpdated={refreshOrder} token={token} />
          </div>

          <ReturnForm order={order} onDone={refreshOrder} />
        </div>

        <div className="space-y-8">
          <TrackingCard order={order} />
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
  const token = useMemo(() => guestTokenFor(id), [id]);
  return (
    <PageShell>
      <OrderDetail id={id} token={token} />
    </PageShell>
  );
};

export default OrderDetailPage;

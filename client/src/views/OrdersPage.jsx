import { motion } from "framer-motion";
import Link from "@/components/AppLink";
import { useQuery } from "@tanstack/react-query";
import { PackageOpen } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { orderService } from "@/services";
import { getErrorMessage } from "@/services/api";
import { formatPrice } from "@/utils/format";
import { formatDateTime } from "@/utils/orders";
import PageShell from "@/components/PageShell";
import PageHeading from "@/components/PageHeading";
import RequireLogin from "@/components/RequireLogin";
import OrderStatusBadge from "@/components/OrderStatusBadge";

const MAX_THUMBNAILS = 4;

const OrderRow = ({ order, index }) => {
  const extraItems = order.items.length - MAX_THUMBNAILS;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        href={`/orders/${order._id}`}
        className="block bg-card border border-border rounded-2xl p-5 transition-all hover:border-primary/40 hover:shadow-[0_20px_60px_-15px_rgba(217,165,46,0.25)]"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <p className="font-display text-2xl">{order.orderNumber}</p>
            <p className="text-xs text-muted-foreground">{formatDateTime(order.createdAt)}</p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {order.items.slice(0, MAX_THUMBNAILS).map((item) => (
              <img
                key={`${item.product}-${item.kitId ?? ""}`}
                src={item.image}
                alt={item.name}
                title={item.name}
                className="w-14 h-14 rounded-lg object-cover bg-secondary border border-border"
              />
            ))}
            {extraItems > 0 && (
              <span className="text-sm text-muted-foreground">+{extraItems} more</span>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Total</p>
            <p className="text-lg font-semibold">{formatPrice(order.summary.total)}</p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

const OrdersList = () => {
  const { user } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ["orders", user?._id],
    queryFn: orderService.mine,
  });
  const orders = data?.items ?? [];

  if (isLoading)
    return <p className="py-24 text-center text-muted-foreground">Loading your orders...</p>;
  if (error) return <p className="py-24 text-center text-destructive">{getErrorMessage(error)}</p>;

  if (orders.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center bg-card border border-border rounded-2xl p-10">
        <PackageOpen className="w-12 h-12 mx-auto mb-4 text-primary" />
        <h2 className="text-3xl font-display mb-2">NO ORDERS YET</h2>
        <p className="text-muted-foreground mb-6">When you place an order it will show up here.</p>
        <Link
          href="/products"
          className="inline-block gradient-neon text-primary-foreground px-8 py-3 font-semibold uppercase tracking-wide rounded-full neon-glow"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {orders.map((order, index) => (
        <OrderRow key={order._id} order={order} index={index} />
      ))}
    </div>
  );
};

const OrdersPage = () => (
  <PageShell>
    <PageHeading title="MY" highlight="ORDERS" subtitle="Track and manage your purchases" />
    <RequireLogin message="Please sign in to view your orders.">
      <OrdersList />
    </RequireLogin>
  </PageShell>
);

export default OrdersPage;

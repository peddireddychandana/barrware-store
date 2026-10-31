import Link from "@/components/AppLink";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { IndianRupee, Package, ShoppingBag, Users } from "lucide-react";
import { adminService } from "@/services";
import { formatPrice } from "@/utils/format";
import {
  PageHeader,
  Panel,
  QueryState,
  TableScroll,
  Td,
  Th,
  rowClass,
} from "@/components/admin/AdminUi";
import { StatusBadge, formatDate } from "@/components/admin/orderStatus";

const StatCard = ({ icon: Icon, label, value, note, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.08 }}
    className="bg-card border border-border rounded-2xl p-5 card-shadow"
  >
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <span className="w-9 h-9 rounded-full gradient-neon flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary-foreground" />
      </span>
    </div>
    <p className="text-4xl font-display text-gradient">{value}</p>
    {note && <p className="text-xs text-muted-foreground mt-1">{note}</p>}
  </motion.div>
);

const LowStockTable = ({ products }) => (
  <TableScroll>
    <thead>
      <tr>
        <Th>Product</Th>
        <Th>Stock</Th>
        <Th className="text-right">Action</Th>
      </tr>
    </thead>
    <tbody>
      {products.map((product) => (
        <tr key={product._id} className={rowClass}>
          <Td>{product.name}</Td>
          <Td>
            <span
              className={
                product.stock === 0 ? "text-destructive font-medium" : "text-primary font-medium"
              }
            >
              {product.stock === 0 ? "Out of stock" : product.stock}
            </span>
          </Td>
          <Td className="text-right">
            <Link
              href={`/admin/products?edit=${product._id}`}
              className="text-primary hover:underline text-sm"
            >
              Edit
            </Link>
          </Td>
        </tr>
      ))}
    </tbody>
  </TableScroll>
);

const RecentOrdersList = ({ orders }) => (
  <ul>
    {orders.map((order) => (
      <li key={order._id} className="border-t border-border first:border-t-0">
        <Link
          href={`/admin/orders/${order._id}`}
          className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-secondary/30 transition-colors"
        >
          <div className="min-w-0">
            <p className="font-medium truncate">{order.orderNumber}</p>
            <p className="text-xs text-muted-foreground truncate">
              {order.user?.name ?? order.shippingAddress?.fullName} · {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-medium">{formatPrice(order.summary?.total)}</p>
            <StatusBadge status={order.status} />
          </div>
        </Link>
      </li>
    ))}
  </ul>
);

const AdminDashboardPage = () => {
  const query = useQuery({ queryKey: ["admin", "dashboard"], queryFn: adminService.dashboard });
  const stats = query.data;

  return (
    <>
      <PageHeader title="STORE" accent="DASHBOARD" subtitle="How the shop is doing right now" />
      <QueryState query={query}>
        {stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                index={0}
                icon={IndianRupee}
                label="Total revenue"
                value={formatPrice(stats.totalRevenue)}
                note={
                  stats.pendingRevenue
                    ? `${formatPrice(stats.pendingRevenue)} pending delivery`
                    : "Delivered orders"
                }
              />
              <StatCard
                index={1}
                icon={ShoppingBag}
                label="Total orders"
                value={stats.totalOrders}
              />
              <StatCard index={2} icon={Users} label="Customers" value={stats.totalCustomers} />
              <StatCard index={3} icon={Package} label="Products" value={stats.totalProducts} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Panel title="LOW STOCK (10 OR FEWER)">
                {stats.lowStockProducts.length ? (
                  <LowStockTable products={stats.lowStockProducts} />
                ) : (
                  <p className="p-6 text-muted-foreground">Every product is well stocked.</p>
                )}
              </Panel>
              <Panel
                title="RECENT ORDERS"
                action={
                  <Link href="/admin/orders" className="text-sm text-primary hover:underline">
                    View all
                  </Link>
                }
              >
                {stats.recentOrders.length ? (
                  <RecentOrdersList orders={stats.recentOrders} />
                ) : (
                  <p className="p-6 text-muted-foreground">No orders yet.</p>
                )}
              </Panel>
            </div>
          </div>
        )}
      </QueryState>
    </>
  );
};

export default AdminDashboardPage;

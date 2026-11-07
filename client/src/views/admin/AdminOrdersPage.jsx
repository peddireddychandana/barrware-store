import { useState } from "react";
import Link from "@/components/AppLink";
import { useRouter } from "@/lib/router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminService } from "@/services";
import { getErrorMessage } from "@/services/api";
import { formatPrice } from "@/utils/format";
import {
  ConfirmDialog,
  DeleteIconButton,
  PageHeader,
  Pagination,
  Panel,
  QueryState,
  TableScroll,
  Td,
  Th,
  rowClass,
} from "@/components/admin/AdminUi";
import {
  STATUS_FILTERS,
  StatusBadge,
  formatDate,
  statusLabel,
} from "@/components/admin/orderStatus";

const PAGE_SIZE = 15;

const FilterPill = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium uppercase tracking-widest border transition-all ${
      active
        ? "bg-primary text-primary-foreground border-primary neon-glow"
        : "bg-secondary/50 text-muted-foreground border-border hover:border-primary hover:text-foreground"
    }`}
  >
    {children}
  </button>
);

const AdminOrdersPage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState(null);

  const query = useQuery({
    queryKey: ["admin", "orders", status, page],
    queryFn: () => adminService.orders({ status: status || undefined, page, limit: PAGE_SIZE }),
    placeholderData: (previous) => previous,
  });
  const orders = query.data?.items ?? [];

  const remove = useMutation({
    mutationFn: (order) => adminService.deleteOrder(order._id),
    onSuccess: () => {
      toast.success("Order deleted");
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
    onSettled: () => setPendingDelete(null),
  });

  const selectStatus = (next) => {
    setStatus(next);
    setPage(1);
  };

  return (
    <>
      <PageHeader title="CUSTOMER" accent="ORDERS" subtitle="Cash on delivery orders" />

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        <FilterPill active={!status} onClick={() => selectStatus("")}>
          All
        </FilterPill>
        {STATUS_FILTERS.map((value) => (
          <FilterPill key={value} active={status === value} onClick={() => selectStatus(value)}>
            {statusLabel(value)}
          </FilterPill>
        ))}
      </div>

      <Panel>
        <QueryState
          query={query}
          isEmpty={!orders.length}
          emptyMessage={
            status ? `No ${statusLabel(status).toLowerCase()} orders.` : "No orders yet."
          }
        >
          <TableScroll>
            <thead>
              <tr>
                <Th>Order</Th>
                <Th>Customer</Th>
                <Th>Date</Th>
                <Th className="text-right">Total</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order._id}
                  onClick={() => router.push(`/admin/orders/${order._id}`)}
                  className={`${rowClass} cursor-pointer ${order.status === "cancelled" ? "opacity-70" : ""}`}
                >
                  <Td className="font-medium">
                    <Link
                      href={`/admin/orders/${order._id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-primary hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                  </Td>
                  <Td>
                    <p>{order.user?.name ?? order.shippingAddress?.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.user?.email ?? order.shippingAddress?.email}
                    </p>
                  </Td>
                  <Td className="whitespace-nowrap">{formatDate(order.createdAt)}</Td>
                  <Td className="text-right font-medium">{formatPrice(order.summary?.total)}</Td>
                  <Td>
                    <StatusBadge status={order.status} />
                  </Td>
                  <Td className="text-right">
                    <div onClick={(e) => e.stopPropagation()}>
                      <DeleteIconButton
                        label={`Delete order ${order.orderNumber}`}
                        onClick={() => setPendingDelete(order)}
                      />
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableScroll>
          <Pagination pagination={query.data?.pagination} onPage={setPage} />
        </QueryState>
      </Panel>
      <ConfirmDialog
        open={!!pendingDelete}
        title="DELETE ORDER?"
        message={`Order ${pendingDelete?.orderNumber ?? ""} will be permanently deleted. Stock for in-progress orders is restored.`}
        confirmLabel="Delete order"
        isBusy={remove.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => remove.mutate(pendingDelete)}
      />
    </>
  );
};

export default AdminOrdersPage;

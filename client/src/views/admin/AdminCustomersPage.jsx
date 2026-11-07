import { useState } from "react";
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
import { formatDate } from "@/components/admin/orderStatus";

const AdminCustomersPage = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState(null);
  const query = useQuery({
    queryKey: ["admin", "customers", page],
    queryFn: () => adminService.customerPage({ page, limit: 20 }),
    placeholderData: (previous) => previous,
  });
  const customers = query.data?.items ?? [];

  const remove = useMutation({
    mutationFn: (customer) => adminService.deleteCustomer(customer._id),
    onSuccess: () => {
      toast.success("Customer deleted");
      queryClient.invalidateQueries({ queryKey: ["admin", "customers"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
    onSettled: () => setPendingDelete(null),
  });

  return (
    <>
      <PageHeader title="" accent="CUSTOMERS" subtitle="Registered shoppers" />
      <Panel>
        <QueryState
          query={query}
          isEmpty={!customers.length}
          emptyMessage="No customers have registered yet."
        >
          <TableScroll>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Phone</Th>
                <Th>Joined</Th>
                <Th className="text-right">Orders</Th>
                <Th className="text-right">Total spent</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer._id} className={rowClass}>
                  <Td className="font-medium">{customer.name}</Td>
                  <Td>{customer.email}</Td>
                  <Td>{customer.phone || "—"}</Td>
                  <Td>{formatDate(customer.createdAt)}</Td>
                  <Td className="text-right">{customer.orderCount ?? "—"}</Td>
                  <Td className="text-right">
                    {customer.totalSpent == null ? "—" : formatPrice(customer.totalSpent)}
                  </Td>
                  <Td className="text-right">
                    <DeleteIconButton
                      label={`Delete customer ${customer.name}`}
                      onClick={() => setPendingDelete(customer)}
                    />
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
        title="DELETE CUSTOMER?"
        message={`${pendingDelete?.name ?? "This customer"} will be permanently deleted. Their existing orders are kept for records.`}
        confirmLabel="Delete customer"
        isBusy={remove.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => remove.mutate(pendingDelete)}
      />
    </>
  );
};

export default AdminCustomersPage;

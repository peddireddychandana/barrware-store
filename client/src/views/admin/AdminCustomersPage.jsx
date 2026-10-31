import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services";
import { formatPrice } from "@/utils/format";
import {
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
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["admin", "customers", page],
    queryFn: () => adminService.customerPage({ page, limit: 20 }),
    placeholderData: (previous) => previous,
  });
  const customers = query.data?.items ?? [];

  return (
    <>
      <PageHeader title="" accent="CUSTOMERS" subtitle="Registered shoppers (read-only)" />
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
                </tr>
              ))}
            </tbody>
          </TableScroll>
          <Pagination pagination={query.data?.pagination} onPage={setPage} />
        </QueryState>
      </Panel>
    </>
  );
};

export default AdminCustomersPage;

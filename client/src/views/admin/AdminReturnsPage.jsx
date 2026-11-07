import { useState } from "react";
import Link from "@/components/AppLink";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { adminService } from "@/services";
import { getErrorMessage } from "@/services/api";
import { formatPrice } from "@/utils/format";
import {
  Field,
  PageHeader,
  Pagination,
  Panel,
  QueryState,
  TableScroll,
  Td,
  Th,
  inputClass,
  rowClass,
} from "@/components/admin/AdminUi";
import { formatDate } from "@/components/admin/orderStatus";

const STATUSES = ["requested", "approved", "rejected", "received", "refunded"];
const UPDATE_STATUSES = ["approved", "rejected", "received", "refunded"];

const ReturnRow = ({ request, onUpdated }) => {
  const [status, setStatus] = useState(
    UPDATE_STATUSES.includes(request.status) ? request.status : "approved",
  );
  const [note, setNote] = useState(request.adminNote ?? "");
  const [refundAmount, setRefundAmount] = useState(String(request.refundAmount || ""));

  const save = useMutation({
    mutationFn: () =>
      adminService.updateReturn(request._id, {
        status,
        note: note.trim(),
        ...(status === "refunded" && refundAmount !== ""
          ? { refundAmount: Number(refundAmount) }
          : {}),
      }),
    onSuccess: () => {
      toast.success(`Return marked ${status}`);
      onUpdated();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <tr className={rowClass}>
      <Td>
        {request.order ? (
          <Link href={`/admin/orders/${request.order._id}`} className="font-medium hover:text-primary">
            {request.order.orderNumber}
          </Link>
        ) : (
          "—"
        )}
        <span className="block text-xs text-muted-foreground">{formatDate(request.createdAt)}</span>
      </Td>
      <Td>
        <span className="block">{request.user?.name ?? "Guest"}</span>
        <span className="block text-xs text-muted-foreground">{request.user?.email ?? ""}</span>
      </Td>
      <Td>
        <ul className="space-y-0.5 text-xs">
          {request.items.map((item, index) => (
            <li key={`${item.product}-${index}`}>
              {item.name} × {item.quantity}
            </li>
          ))}
        </ul>
      </Td>
      <Td className="max-w-[220px]">
        <p className="text-xs line-clamp-3">{request.reason}</p>
      </Td>
      <Td className="align-top">
        <Field label="Status">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
            {UPDATE_STATUSES.map((value) => (
              <option key={value} value={value}>
                {value.charAt(0).toUpperCase() + value.slice(1)}
              </option>
            ))}
          </select>
        </Field>
        {status === "refunded" && (
          <Field label="Refund (₹)" className="mt-2">
            <input
              type="number"
              min="0"
              step="0.01"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              placeholder={String(request.order?.summary?.total ?? "")}
              className={inputClass}
            />
          </Field>
        )}
        <Field label="Note" className="mt-2">
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} className={inputClass} />
        </Field>
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-semibold uppercase tracking-widest disabled:opacity-60"
        >
          {save.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
          Update
        </button>
      </Td>
    </tr>
  );
};

const AdminReturnsPage = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");

  const query = useQuery({
    queryKey: ["admin", "returns", page, status],
    queryFn: () => adminService.returns({ page, limit: 20, ...(status ? { status } : {}) }),
    placeholderData: (previous) => previous,
  });
  const returns = query.data?.items ?? [];

  return (
    <>
      <PageHeader title="" accent="RETURNS" subtitle="Review and resolve return requests" />
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => {
            setStatus("");
            setPage(1);
          }}
          className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-widest ${
            status === "" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
          }`}
        >
          All
        </button>
        {STATUSES.map((value) => (
          <button
            key={value}
            onClick={() => {
              setStatus(value);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-widest ${
              status === value ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            {value}
          </button>
        ))}
      </div>
      <Panel>
        <QueryState query={query} isEmpty={!returns.length} emptyMessage="No return requests found.">
          <TableScroll>
            <thead>
              <tr>
                <Th>Order</Th>
                <Th>Customer</Th>
                <Th>Items</Th>
                <Th>Reason</Th>
                <Th>Manage</Th>
              </tr>
            </thead>
            <tbody>
              {returns.map((request) => (
                <ReturnRow
                  key={request._id}
                  request={request}
                  onUpdated={() =>
                    queryClient.invalidateQueries({ queryKey: ["admin", "returns"] })
                  }
                />
              ))}
            </tbody>
          </TableScroll>
          <Pagination pagination={query.data?.pagination} onPage={setPage} />
        </QueryState>
      </Panel>
      {returns.some((r) => r.status === "refunded") && (
        <p className="text-xs text-muted-foreground mt-3">
          Refunds are processed manually via your payment provider. Marking a request refunded
          records the amount for your books.
        </p>
      )}
    </>
  );
};

export default AdminReturnsPage;

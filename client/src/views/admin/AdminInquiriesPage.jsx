import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminService } from "@/services";
import { getErrorMessage } from "@/services/api";
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
  inputClass,
  rowClass,
} from "@/components/admin/AdminUi";
import { formatDateTime } from "@/components/admin/orderStatus";

const STATUSES = ["new", "read", "resolved"];

const InquiryStatus = ({ inquiry, onUpdated }) => {
  const update = useMutation({
    mutationFn: (status) => adminService.updateInquiry(inquiry._id, { status }),
    onSuccess: () => {
      toast.success("Inquiry updated");
      onUpdated();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <select
      value={inquiry.status}
      onChange={(e) => update.mutate(e.target.value)}
      disabled={update.isPending}
      className={`${inputClass} py-1.5 text-xs uppercase tracking-widest`}
      aria-label="Inquiry status"
    >
      {STATUSES.map((value) => (
        <option key={value} value={value}>
          {value}
        </option>
      ))}
    </select>
  );
};

const AdminInquiriesPage = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);

  const query = useQuery({
    queryKey: ["admin", "inquiries", page, status],
    queryFn: () => adminService.inquiries({ page, limit: 20, ...(status ? { status } : {}) }),
    placeholderData: (previous) => previous,
  });
  const inquiries = query.data?.items ?? [];

  const remove = useMutation({
    mutationFn: (inquiry) => adminService.deleteInquiry(inquiry._id),
    onSuccess: () => {
      toast.success("Inquiry deleted");
      queryClient.invalidateQueries({ queryKey: ["admin", "inquiries"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
    onSettled: () => setPendingDelete(null),
  });

  return (
    <>
      <PageHeader title="" accent="INQUIRIES" subtitle="Messages from the contact form" />
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
        <QueryState query={query} isEmpty={!inquiries.length} emptyMessage="No inquiries yet.">
          <TableScroll>
            <thead>
              <tr>
                <Th>Received</Th>
                <Th>From</Th>
                <Th>Message</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((inquiry) => (
                <tr key={inquiry._id} className={rowClass}>
                  <Td className="whitespace-nowrap">{formatDateTime(inquiry.createdAt)}</Td>
                  <Td>
                    <span className="block font-medium">{inquiry.name}</span>
                    <a href={`mailto:${inquiry.email}`} className="block text-xs text-primary hover:underline">
                      {inquiry.email}
                    </a>
                    {inquiry.phone && (
                      <span className="block text-xs text-muted-foreground">{inquiry.phone}</span>
                    )}
                  </Td>
                  <Td className="max-w-[420px]">
                    {inquiry.subject && <p className="font-medium">{inquiry.subject}</p>}
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{inquiry.message}</p>
                  </Td>
                  <Td>
                    <InquiryStatus
                      inquiry={inquiry}
                      onUpdated={() =>
                        queryClient.invalidateQueries({ queryKey: ["admin", "inquiries"] })
                      }
                    />
                  </Td>
                  <Td className="text-right">
                    <DeleteIconButton
                      label={`Delete inquiry from ${inquiry.name}`}
                      onClick={() => setPendingDelete(inquiry)}
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
        title="DELETE INQUIRY?"
        message={`The inquiry from ${pendingDelete?.name ?? "this customer"} will be permanently deleted.`}
        confirmLabel="Delete inquiry"
        isBusy={remove.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => remove.mutate(pendingDelete)}
      />
    </>
  );
};

export default AdminInquiriesPage;

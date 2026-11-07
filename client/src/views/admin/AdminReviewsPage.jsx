import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, EyeOff, Loader2, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { adminService } from "@/services";
import { getErrorMessage } from "@/services/api";
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

const ReviewRow = ({ review, onUpdated }) => {
  const moderate = useMutation({
    mutationFn: (body) => adminService.moderateReview(review._id, body),
    onSuccess: () => {
      toast.success("Review updated");
      onUpdated();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const remove = useMutation({
    mutationFn: () => adminService.deleteReview(review._id),
    onSuccess: () => {
      toast.success("Review deleted");
      onUpdated();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <tr className={rowClass}>
      <Td>
        <span className="block font-medium">{review.product?.name ?? "Deleted product"}</span>
        <span className="block text-xs text-muted-foreground">
          {review.user?.name ?? "Unknown"} · {review.user?.email ?? ""}
        </span>
        <span className="block text-xs text-muted-foreground">{formatDate(review.createdAt)}</span>
      </Td>
      <Td>
        <span className="inline-flex items-center gap-0.5 text-primary">
          {Array.from({ length: review.rating }).map((_value, index) => (
            <Star key={index} className="w-3.5 h-3.5 fill-current" />
          ))}
        </span>
        {review.verifiedPurchase && (
          <span className="ml-2 text-[10px] uppercase tracking-widest text-primary">
            Verified
          </span>
        )}
      </Td>
      <Td className="max-w-[380px]">
        {review.title && <p className="font-medium">{review.title}</p>}
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{review.comment}</p>
      </Td>
      <Td>
        <div className="flex flex-col gap-2">
          <span
            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-widest text-center ${
              review.isHidden
                ? "bg-destructive/15 text-destructive"
                : review.isApproved
                  ? "bg-primary/15 text-primary"
                  : "bg-accent/15 text-primary"
            }`}
          >
            {review.isHidden ? "Hidden" : review.isApproved ? "Visible" : "Pending"}
          </span>
          <button
            onClick={() => moderate.mutate({ isHidden: !review.isHidden, isApproved: true })}
            disabled={moderate.isPending}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary disabled:opacity-50"
          >
            {moderate.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : review.isHidden ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <EyeOff className="w-3.5 h-3.5" />
            )}
            {review.isHidden ? "Restore" : "Hide"}
          </button>
          {!review.isApproved && (
            <button
              onClick={() => moderate.mutate({ isApproved: true })}
              disabled={moderate.isPending}
              className="text-xs text-primary hover:underline disabled:opacity-50"
            >
              Approve
            </button>
          )}
          <button
            onClick={() => {
              if (window.confirm("Delete this review permanently?")) remove.mutate();
            }}
            disabled={remove.isPending}
            className="inline-flex items-center gap-1.5 text-xs text-destructive hover:underline disabled:opacity-50"
          >
            {remove.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            Delete
          </button>
        </div>
      </Td>
    </tr>
  );
};

const AdminReviewsPage = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [hiddenOnly, setHiddenOnly] = useState(false);

  const query = useQuery({
    queryKey: ["admin", "reviews", page, hiddenOnly],
    queryFn: () => adminService.reviews({ page, limit: 20, ...(hiddenOnly ? { hidden: true } : {}) }),
    placeholderData: (previous) => previous,
  });
  const reviews = query.data?.items ?? [];

  return (
    <>
      <PageHeader title="" accent="REVIEWS" subtitle="Approve or hide customer reviews" />
      <label className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <input
          type="checkbox"
          checked={hiddenOnly}
          onChange={(e) => {
            setHiddenOnly(e.target.checked);
            setPage(1);
          }}
          className="accent-[var(--primary)]"
        />
        Show hidden reviews only
      </label>
      <Panel>
        <QueryState query={query} isEmpty={!reviews.length} emptyMessage="No reviews found.">
          <TableScroll>
            <thead>
              <tr>
                <Th>Product & customer</Th>
                <Th>Rating</Th>
                <Th>Review</Th>
                <Th>Visibility</Th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <ReviewRow
                  key={review._id}
                  review={review}
                  onUpdated={() =>
                    queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] })
                  }
                />
              ))}
            </tbody>
          </TableScroll>
          <Pagination pagination={query.data?.pagination} onPage={setPage} />
        </QueryState>
      </Panel>
    </>
  );
};

export default AdminReviewsPage;

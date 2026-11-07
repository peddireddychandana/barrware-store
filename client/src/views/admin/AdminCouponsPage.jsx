import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { adminService } from "@/services";
import { getErrorMessage } from "@/services/api";
import { formatPrice } from "@/utils/format";
import {
  ConfirmDialog,
  Drawer,
  Field,
  PageHeader,
  Pagination,
  Panel,
  QueryState,
  TableScroll,
  Td,
  Th,
  Toggle,
  ghostButtonClass,
  inputClass,
  primaryButtonClass,
  rowClass,
} from "@/components/admin/AdminUi";
import { formatDate } from "@/components/admin/orderStatus";

const EMPTY = {
  code: "",
  description: "",
  type: "percent",
  value: "",
  minSubtotal: "",
  maxDiscount: "",
  usageLimit: "",
  perUserLimit: "",
  startsAt: "",
  expiresAt: "",
  isActive: true,
};

const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : "");

const CouponForm = ({ initial, onClose }) => {
  const queryClient = useQueryClient();
  const isEdit = Boolean(initial?._id);
  const [form, setForm] = useState(
    isEdit
      ? {
          code: initial.code,
          description: initial.description ?? "",
          type: initial.type,
          value: String(initial.value ?? ""),
          minSubtotal: String(initial.minSubtotal ?? ""),
          maxDiscount: String(initial.maxDiscount ?? ""),
          usageLimit: String(initial.usageLimit ?? ""),
          perUserLimit: String(initial.perUserLimit ?? ""),
          startsAt: toDateInput(initial.startsAt),
          expiresAt: toDateInput(initial.expiresAt),
          isActive: initial.isActive,
        }
      : EMPTY,
  );
  const [error, setError] = useState("");

  const save = useMutation({
    mutationFn: (body) =>
      isEdit ? adminService.updateCoupon(initial._id, body) : adminService.createCoupon(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
      toast.success(isEdit ? "Coupon updated" : "Coupon created");
      onClose();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const setField = (field) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submit = (e) => {
    e.preventDefault();
    if (!/^[A-Za-z0-9_-]{2,40}$/.test(form.code.trim())) {
      setError("Use 2–40 letters, numbers, hyphens or underscores");
      return;
    }
    setError("");
    const body = {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim(),
      type: form.type,
      value: Number(form.value) || 0,
      minSubtotal: Number(form.minSubtotal) || 0,
      maxDiscount: Number(form.maxDiscount) || 0,
      usageLimit: Math.floor(Number(form.usageLimit) || 0),
      perUserLimit: Math.floor(Number(form.perUserLimit) || 0),
      isActive: form.isActive,
    };
    if (form.startsAt) body.startsAt = new Date(form.startsAt).toISOString();
    if (form.expiresAt) body.expiresAt = new Date(form.expiresAt).toISOString();
    save.mutate(body);
  };

  return (
    <form onSubmit={submit} className="p-6 space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Code">
          <input value={form.code} onChange={setField("code")} className={`${inputClass} uppercase`} maxLength={40} />
          {error && <span className="block text-xs text-destructive mt-1">{error}</span>}
        </Field>
        <Field label="Type">
          <select value={form.type} onChange={setField("type")} className={inputClass}>
            <option value="percent">Percent off</option>
            <option value="fixed">Flat amount off</option>
          </select>
        </Field>
        <Field label={form.type === "percent" ? "Percent value" : "Amount (₹)"}>
          <input type="number" min="0" step="0.01" value={form.value} onChange={setField("value")} className={inputClass} />
        </Field>
        <Field label="Minimum subtotal (₹)">
          <input type="number" min="0" step="1" value={form.minSubtotal} onChange={setField("minSubtotal")} className={inputClass} />
        </Field>
        <Field label="Max discount (₹, 0 = none)">
          <input type="number" min="0" step="1" value={form.maxDiscount} onChange={setField("maxDiscount")} className={inputClass} />
        </Field>
        <Field label="Total usage limit (0 = unlimited)">
          <input type="number" min="0" step="1" value={form.usageLimit} onChange={setField("usageLimit")} className={inputClass} />
        </Field>
        <Field label="Per-customer limit (0 = unlimited)">
          <input type="number" min="0" step="1" value={form.perUserLimit} onChange={setField("perUserLimit")} className={inputClass} />
        </Field>
        <Field label="Starts on">
          <input type="date" value={form.startsAt} onChange={setField("startsAt")} className={inputClass} />
        </Field>
        <Field label="Expires on">
          <input type="date" value={form.expiresAt} onChange={setField("expiresAt")} className={inputClass} />
        </Field>
        <Field label="Description" className="sm:col-span-2">
          <input value={form.description} onChange={setField("description")} className={inputClass} maxLength={200} />
        </Field>
      </div>
      <label className="flex items-center gap-3 text-sm">
        <Toggle checked={form.isActive} onChange={(value) => setForm((prev) => ({ ...prev, isActive: value }))} label="Coupon active" />
        Active
      </label>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className={ghostButtonClass}>
          Cancel
        </button>
        <button type="submit" disabled={save.isPending} className={primaryButtonClass}>
          {save.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEdit ? "Save changes" : "Create coupon"}
        </button>
      </div>
    </form>
  );
};

const AdminCouponsPage = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const query = useQuery({
    queryKey: ["admin", "coupons", page],
    queryFn: () => adminService.coupons({ page, limit: 20 }),
    placeholderData: (previous) => previous,
  });
  const coupons = query.data?.items ?? [];

  const toggleActive = useMutation({
    mutationFn: (coupon) => adminService.updateCoupon(coupon._id, { isActive: !coupon.isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
      toast.success("Coupon updated");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const remove = useMutation({
    mutationFn: (id) => adminService.deleteCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
      toast.success("Coupon deleted");
      setDeleting(null);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const closeDrawer = () => {
    setIsCreating(false);
    setEditing(null);
  };

  return (
    <>
      <PageHeader
        title=""
        accent="COUPONS"
        subtitle="Create and manage discount codes"
        action={
          <button onClick={() => setIsCreating(true)} className={primaryButtonClass}>
            <Plus className="w-4 h-4" /> New coupon
          </button>
        }
      />
      <Panel>
        <QueryState query={query} isEmpty={!coupons.length} emptyMessage="No coupons yet.">
          <TableScroll>
            <thead>
              <tr>
                <Th>Code</Th>
                <Th>Discount</Th>
                <Th>Min order</Th>
                <Th>Used</Th>
                <Th>Expires</Th>
                <Th>Active</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon._id} className={rowClass}>
                  <Td>
                    <span className="font-medium">{coupon.code}</span>
                    {coupon.description && (
                      <span className="block text-xs text-muted-foreground">{coupon.description}</span>
                    )}
                  </Td>
                  <Td>
                    {coupon.type === "percent" ? `${coupon.value}%` : formatPrice(coupon.value)}
                    {coupon.maxDiscount > 0 && coupon.type === "percent" && (
                      <span className="block text-xs text-muted-foreground">
                        max {formatPrice(coupon.maxDiscount)}
                      </span>
                    )}
                  </Td>
                  <Td>{coupon.minSubtotal ? formatPrice(coupon.minSubtotal) : "—"}</Td>
                  <Td>
                    {coupon.usedCount}
                    {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""}
                  </Td>
                  <Td>{coupon.expiresAt ? formatDate(coupon.expiresAt) : "Never"}</Td>
                  <Td>
                    <Toggle
                      checked={coupon.isActive}
                      onChange={() => toggleActive.mutate(coupon)}
                      label={`Toggle ${coupon.code}`}
                      disabled={toggleActive.isPending}
                    />
                  </Td>
                  <Td className="text-right whitespace-nowrap">
                    <button
                      onClick={() => setEditing(coupon)}
                      aria-label={`Edit ${coupon.code}`}
                      className="p-2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleting(coupon)}
                      aria-label={`Delete ${coupon.code}`}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableScroll>
          <Pagination pagination={query.data?.pagination} onPage={setPage} />
        </QueryState>
      </Panel>

      <Drawer
        open={isCreating || Boolean(editing)}
        title={editing ? "EDIT COUPON" : "NEW COUPON"}
        onClose={closeDrawer}
      >
        <CouponForm key={editing?._id ?? "new"} initial={editing} onClose={closeDrawer} />
      </Drawer>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="DELETE COUPON?"
        message={`Coupon ${deleting?.code ?? ""} will be permanently removed. Existing orders are not affected.`}
        confirmLabel="Delete coupon"
        isBusy={remove.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() => remove.mutate(deleting._id)}
      />
    </>
  );
};

export default AdminCouponsPage;

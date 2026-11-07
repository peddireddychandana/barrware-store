import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MapPin, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { addressService } from "@/services";
import { getErrorMessage } from "@/services/api";
import FormField from "@/components/FormField";

const EMPTY = {
  label: "Home",
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  isDefault: false,
};

const AddressForm = ({ initial, onCancel, onSaved }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ ...EMPTY, ...initial });
  const [errors, setErrors] = useState({});
  const isEdit = Boolean(initial?._id);

  const save = useMutation({
    mutationFn: (body) =>
      isEdit ? addressService.update(initial._id, body) : addressService.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success(isEdit ? "Address updated" : "Address saved");
      onSaved?.();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const setField = (field) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const submit = (e) => {
    e.preventDefault();
    const found = {};
    if (!form.fullName.trim()) found.fullName = "Name is required";
    if (!/^[0-9+\-\s]{7,15}$/.test(form.phone.trim())) found.phone = "Enter a valid phone";
    if (!form.line1.trim()) found.line1 = "Address is required";
    if (!form.city.trim()) found.city = "City is required";
    if (!form.state.trim()) found.state = "State is required";
    if (!/^\d{6}$/.test(form.pincode.trim())) found.pincode = "Enter a 6-digit PIN code";
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    save.mutate({
      ...form,
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      line1: form.line1.trim(),
      line2: form.line2.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      pincode: form.pincode.trim(),
      label: form.label.trim() || "Home",
    });
  };

  return (
    <form
      onSubmit={submit}
      noValidate
      className="border border-primary/40 rounded-xl p-5 space-y-4 bg-secondary/20"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl">{isEdit ? "EDIT ADDRESS" : "NEW ADDRESS"}</h3>
        <button type="button" onClick={onCancel} aria-label="Cancel" className="text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <FormField label="Label" value={form.label} onChange={setField("label")} placeholder="Home / Work" />
        <FormField label="Full name" value={form.fullName} onChange={setField("fullName")} error={errors.fullName} autoComplete="name" />
        <FormField label="Phone" type="tel" value={form.phone} onChange={setField("phone")} error={errors.phone} autoComplete="tel" />
        <FormField label="PIN code" inputMode="numeric" maxLength={6} value={form.pincode} onChange={setField("pincode")} error={errors.pincode} autoComplete="postal-code" />
        <FormField className="sm:col-span-2" label="Address line 1" value={form.line1} onChange={setField("line1")} error={errors.line1} autoComplete="address-line1" />
        <FormField className="sm:col-span-2" label="Address line 2 (optional)" value={form.line2} onChange={setField("line2")} autoComplete="address-line2" />
        <FormField label="City" value={form.city} onChange={setField("city")} error={errors.city} autoComplete="address-level2" />
        <FormField label="State" value={form.state} onChange={setField("state")} error={errors.state} autoComplete="address-level1" />
      </div>
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input type="checkbox" checked={form.isDefault} onChange={setField("isDefault")} className="accent-[var(--primary)]" />
        Set as default address
      </label>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={save.isPending}
          className="inline-flex items-center gap-2 gradient-neon text-primary-foreground px-6 py-2.5 text-xs font-semibold uppercase tracking-widest rounded-full disabled:opacity-60"
        >
          {save.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEdit ? "Save changes" : "Save address"}
        </button>
        <button type="button" onClick={onCancel} className="px-6 py-2.5 text-xs font-semibold uppercase tracking-widest rounded-full border border-border hover:border-primary">
          Cancel
        </button>
      </div>
    </form>
  );
};

const AddressBook = () => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["addresses"],
    queryFn: addressService.list,
  });

  const remove = useMutation({
    mutationFn: addressService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Address removed");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const setDefault = useMutation({
    mutationFn: addressService.setDefault,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Default address updated");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const addresses = data?.items ?? [];

  return (
    <section className="max-w-2xl mx-auto mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-3xl font-display">ADDRESS BOOK</h2>
        {!isAdding && !editing && (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-primary text-primary text-xs font-semibold uppercase tracking-widest hover:bg-primary/10 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add address
          </button>
        )}
      </div>

      {isAdding && (
        <div className="mb-4">
          <AddressForm onCancel={() => setIsAdding(false)} onSaved={() => setIsAdding(false)} />
        </div>
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Loading addresses...</p>
      ) : addresses.length === 0 && !isAdding ? (
        <p className="text-muted-foreground bg-card border border-border rounded-xl p-6">
          No saved addresses yet. Add one for faster checkout.
        </p>
      ) : (
        <ul className="space-y-3">
          {addresses.map((address) =>
            editing?._id === address._id ? (
              <li key={address._id}>
                <AddressForm
                  initial={address}
                  onCancel={() => setEditing(null)}
                  onSaved={() => setEditing(null)}
                />
              </li>
            ) : (
              <li key={address._id} className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="flex items-center gap-2 font-medium">
                        {address.label || "Home"}
                        {address.isDefault && (
                          <span className="text-[10px] uppercase tracking-widest bg-primary/15 text-primary px-2 py-0.5 rounded-full">
                            Default
                          </span>
                        )}
                      </p>
                      <p className="text-muted-foreground">{address.fullName} · {address.phone}</p>
                      <p className="text-muted-foreground">
                        {address.line1}{address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state} {address.pincode}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {!address.isDefault && (
                      <button
                        onClick={() => setDefault.mutate(address._id)}
                        aria-label="Set as default"
                        title="Set as default"
                        className="p-2 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setIsAdding(false);
                        setEditing(address);
                      }}
                      aria-label="Edit address"
                      className="p-2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm("Remove this address?")) remove.mutate(address._id);
                      }}
                      aria-label="Remove address"
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </section>
  );
};

export default AddressBook;

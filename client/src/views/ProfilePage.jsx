import { useState } from "react";
import { useRouter } from "@/lib/router";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/services/api";
import PageShell from "@/components/PageShell";
import PageHeading from "@/components/PageHeading";
import RequireLogin from "@/components/RequireLogin";
import FormField from "@/components/FormField";
import AddressBook from "@/components/AddressBook";

const PIN_PATTERN = /^\d{6}$/;

const ProfileForm = () => {
  const router = useRouter();
  const { user, updateProfile, logout } = useAuth();
  const [form, setForm] = useState({
    name: user.name ?? "",
    phone: user.phone ?? "",
    line1: user.address?.line1 ?? "",
    city: user.address?.city ?? "",
    state: user.address?.state ?? "",
    pincode: user.address?.pincode ?? "",
  });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const setField = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = {};
    if (!form.name.trim()) found.name = "Name is required";
    if (form.pincode.trim() && !PIN_PATTERN.test(form.pincode.trim()))
      found.pincode = "Enter a 6-digit PIN code";
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setIsSaving(true);
    try {
      const { name, phone, ...address } = form;
      await updateProfile({ name: name.trim(), phone: phone.trim(), address });
      toast.success("Profile updated");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success("Signed out");
    router.push("/");
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="max-w-2xl mx-auto bg-card border border-border rounded-2xl card-shadow p-6 md:p-8 space-y-5"
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <FormField
          label="Full name"
          value={form.name}
          onChange={setField("name")}
          error={errors.name}
          autoComplete="name"
        />
        <FormField label="Email (cannot be changed)" value={user.email} disabled readOnly />
        <FormField
          label="Phone"
          type="tel"
          value={form.phone}
          onChange={setField("phone")}
          autoComplete="tel"
        />
        <FormField
          label="PIN code"
          inputMode="numeric"
          maxLength={6}
          value={form.pincode}
          onChange={setField("pincode")}
          error={errors.pincode}
          autoComplete="postal-code"
        />
        <FormField
          className="sm:col-span-2"
          label="Address"
          value={form.line1}
          onChange={setField("line1")}
          autoComplete="address-line1"
        />
        <FormField
          label="City"
          value={form.city}
          onChange={setField("city")}
          autoComplete="address-level2"
        />
        <FormField
          label="State"
          value={form.state}
          onChange={setField("state")}
          autoComplete="address-level1"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="gradient-neon text-primary-foreground px-8 py-3 font-semibold uppercase tracking-wide rounded-full neon-glow disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-6 py-3 border border-border rounded-full text-sm font-semibold uppercase tracking-widest hover:border-destructive hover:text-destructive transition-colors"
        >
          <LogOut className="w-4 h-4" /> Log out
        </button>
      </div>
    </form>
  );
};

const ProfilePage = () => (
  <PageShell>
    <PageHeading
      title="MY"
      highlight="PROFILE"
      subtitle="Keep your details up to date for faster checkout"
    />
    <RequireLogin message="Please sign in to manage your profile.">
      <ProfileForm />
      <AddressBook />
    </RequireLogin>
  </PageShell>
);

export default ProfilePage;

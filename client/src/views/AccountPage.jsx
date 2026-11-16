import { useState } from "react";
import { useRouter } from "@/lib/router";
import { useTranslation } from "react-i18next";
import {
  Heart,
  KeyRound,
  LogOut,
  MapPin,
  Package,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/services/api";
import PageShell from "@/components/PageShell";
import PageHeading from "@/components/PageHeading";
import RequireLogin from "@/components/RequireLogin";
import FormField from "@/components/FormField";
import AddressBook from "@/components/AddressBook";
import { ProfileForm } from "@/views/ProfilePage";
import { OrdersList } from "@/views/OrdersPage";
import { WishlistList } from "@/views/WishlistPage";

const TABS = [
  { id: "profile", labelKey: "account.profile", icon: UserRound },
  { id: "orders", labelKey: "account.orders", icon: Package },
  { id: "wishlist", labelKey: "account.wishlist", icon: Heart },
  { id: "addresses", labelKey: "account.addresses", icon: MapPin },
  { id: "security", labelKey: "account.changePassword", icon: KeyRound },
];

const PasswordForm = () => {
  const { t } = useTranslation();
  const { changePassword } = useAuth();
  const [form, setForm] = useState({
    currentPassword: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const setField = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const found = {};
    if (!form.currentPassword) found.currentPassword = "Current password is required";
    if (form.password.length < 8) found.password = "Use at least 8 characters";
    else if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password))
      found.password = "Include at least one letter and one number";
    if (form.password && form.password === form.currentPassword)
      found.password = "New password must be different";
    if (form.password !== form.confirmPassword)
      found.confirmPassword = "Passwords do not match";
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setIsSaving(true);
    try {
      await changePassword(form);
      toast.success(t("account.passwordUpdated"));
      setForm({ currentPassword: "", password: "", confirmPassword: "" });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      noValidate
      className="max-w-2xl bg-card border border-border rounded-2xl card-shadow p-6 md:p-8 space-y-5"
    >
      <div>
        <h2 className="text-2xl font-display uppercase">{t("account.changePassword")}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t("account.passwordHint")}</p>
      </div>
      <FormField
        label={t("account.currentPassword")}
        type="password"
        toggleable
        value={form.currentPassword}
        onChange={setField("currentPassword")}
        error={errors.currentPassword}
        autoComplete="current-password"
      />
      <FormField
        label={t("account.newPassword")}
        type="password"
        toggleable
        value={form.password}
        onChange={setField("password")}
        error={errors.password}
        autoComplete="new-password"
      />
      <FormField
        label={t("account.confirmNewPassword")}
        type="password"
        toggleable
        value={form.confirmPassword}
        onChange={setField("confirmPassword")}
        error={errors.confirmPassword}
        autoComplete="new-password"
      />
      <button
        type="submit"
        disabled={isSaving}
        className="gradient-neon text-primary-foreground px-8 py-3 font-semibold uppercase tracking-wide rounded-full neon-glow disabled:opacity-60"
      >
        {isSaving ? t("common.loading") : t("account.updatePassword")}
      </button>
    </form>
  );
};

const AccountContent = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [tab, setTab] = useState("profile");

  const handleLogout = async () => {
    await logout();
    toast.success("Signed out");
    router.push("/");
  };

  return (
    <div className="grid lg:grid-cols-[260px_1fr] gap-8 items-start">
      <aside className="bg-card border border-border rounded-2xl p-5 lg:sticky lg:top-28">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <div className="w-11 h-11 rounded-full gradient-neon text-primary-foreground flex items-center justify-center font-display text-xl">
            {(user.name || "V").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
        <nav className="mt-4 flex lg:flex-col gap-1 overflow-x-auto">
          {TABS.map(({ id, labelKey, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-current={tab === id ? "page" : undefined}
              className={`inline-flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                tab === id
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t(labelKey)}
            </button>
          ))}
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {t("account.logout")}
          </button>
        </nav>
      </aside>

      <div className="min-w-0">
        {tab === "profile" && (
          <div className="space-y-5">
            <h2 className="text-2xl font-display uppercase">{t("account.profileDetails")}</h2>
            <ProfileForm />
          </div>
        )}
        {tab === "orders" && (
          <div className="space-y-5">
            <h2 className="text-2xl font-display uppercase">{t("account.orderHistory")}</h2>
            <OrdersList />
          </div>
        )}
        {tab === "wishlist" && (
          <div className="space-y-5">
            <h2 className="text-2xl font-display uppercase">{t("account.savedItems")}</h2>
            <WishlistList />
          </div>
        )}
        {tab === "addresses" && <AddressBook />}
        {tab === "security" && <PasswordForm />}
      </div>
    </div>
  );
};

const AccountPage = () => (
  <PageShell>
    <PageHeading
      title="MY"
      highlight="ACCOUNT"
      subtitle="Manage your profile, orders, wishlist, addresses and password"
    />
    <RequireLogin message="Please sign in to manage your account.">
      <AccountContent />
    </RequireLogin>
  </PageShell>
);

export default AccountPage;

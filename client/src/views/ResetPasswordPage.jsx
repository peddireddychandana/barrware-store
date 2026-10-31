import { Suspense, useState } from "react";
import Link from "@/components/AppLink";
import { useSearchParams } from "@/lib/router";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services";
import { getErrorMessage } from "@/services/api";
import PageShell from "@/components/PageShell";
import PageHeading from "@/components/PageHeading";
import FormField from "@/components/FormField";

const MIN_PASSWORD_LENGTH = 6;

const ResetPasswordForm = () => {
  const token = useSearchParams().get("token");
  const { openLoginModal } = useAuth();
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const setField = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < MIN_PASSWORD_LENGTH) {
      return toast.error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
    }
    if (form.password !== form.confirmPassword) return toast.error("Passwords do not match");
    setIsSubmitting(true);
    try {
      await authService.resetPassword({ token, ...form });
      setIsDone(true);
      toast.success("Password updated. Please sign in.");
      openLoginModal();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-muted-foreground mb-4">This reset link is missing its token.</p>
        <Link href="/forgot-password" className="text-primary hover:underline font-medium">
          Request a new reset link
        </Link>
      </div>
    );
  }

  if (isDone) {
    return (
      <div className="text-center">
        <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-primary" />
        <h2 className="text-3xl font-display mb-2">PASSWORD UPDATED</h2>
        <p className="text-muted-foreground mb-6">You can now sign in with your new password.</p>
        <button
          onClick={openLoginModal}
          className="gradient-neon text-primary-foreground px-8 py-3 font-semibold uppercase tracking-wide rounded-full neon-glow"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <FormField
        label="New password"
        type="password"
        value={form.password}
        onChange={setField("password")}
        autoComplete="new-password"
      />
      <FormField
        label="Confirm password"
        type="password"
        value={form.confirmPassword}
        onChange={setField("confirmPassword")}
        autoComplete="new-password"
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full gradient-neon text-primary-foreground py-4 font-semibold uppercase tracking-wide rounded-full neon-glow disabled:opacity-60"
      >
        {isSubmitting ? "Updating..." : "Reset Password"}
      </button>
    </form>
  );
};

const ResetPasswordPage = () => (
  <PageShell>
    <PageHeading
      title="RESET"
      highlight="PASSWORD"
      subtitle="Choose a new password for your account"
    />
    <div className="max-w-md mx-auto bg-card border border-border rounded-2xl card-shadow p-8">
      <Suspense fallback={<p className="text-center text-muted-foreground">Loading...</p>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  </PageShell>
);

export default ResetPasswordPage;

import { useState } from "react";
import Link from "@/components/AppLink";
import { toast } from "sonner";
import { authService } from "@/services";
import { getErrorMessage } from "@/services/api";
import PageShell from "@/components/PageShell";
import PageHeading from "@/components/PageHeading";
import FormField from "@/components/FormField";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return toast.error("Please enter your email");
    setIsSubmitting(true);
    try {
      const response = await authService.forgotPassword({ email: email.trim() });
      setResult({ resetUrl: response?.resetUrl ?? null });
      toast.success("If that email is registered, a reset link has been sent");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell>
      <PageHeading
        title="FORGOT"
        highlight="PASSWORD"
        subtitle="Enter your email and we'll send you a reset link"
      />
      <div className="max-w-md mx-auto bg-card border border-border rounded-2xl card-shadow p-8">
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <FormField
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full gradient-neon text-primary-foreground py-4 font-semibold uppercase tracking-wide rounded-full neon-glow disabled:opacity-60"
          >
            {isSubmitting ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
        {result && (
          <div className="mt-5 text-center text-sm text-muted-foreground">
            <p>Check your inbox for the reset link.</p>
            {result.resetUrl && (
              <a href={result.resetUrl} className="mt-2 block text-primary hover:underline">
                Open reset link (development only)
              </a>
            )}
          </div>
        )}
        <p className="mt-6 text-center text-muted-foreground">
          Remembered it?{" "}
          <Link href="/" className="text-primary hover:underline font-medium">
            Back to store
          </Link>
        </p>
      </div>
    </PageShell>
  );
};

export default ForgotPasswordPage;

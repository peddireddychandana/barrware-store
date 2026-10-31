import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { authService } from "@/services";
import { getErrorMessage } from "@/services/api";

const LoginModal = () => {
  const { isLoginModalOpen, closeLoginModal, login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetUrl, setResetUrl] = useState(null);

  const isSignUp = mode === "register";
  const isForgot = mode === "forgot";

  const setField = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const switchMode = (next) => {
    setMode(next);
    setResetUrl(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || (!isForgot && !form.password)) {
      toast.error("Please fill in all fields");
      return;
    }
    if (isSignUp && !form.name) {
      toast.error("Please enter your name");
      return;
    }
    if (isSignUp && form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isForgot) {
        const result = await authService.forgotPassword({ email: form.email });
        toast.success("If that email is registered, a reset link has been sent");
        setResetUrl(result?.resetUrl ?? null);
        return;
      }
      if (isSignUp) {
        await register(form);
        toast.success("Account created successfully!");
      } else {
        await login({ email: form.email, password: form.password });
        toast.success("Welcome back!");
      }
      setForm({ name: "", email: "", password: "", confirmPassword: "" });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isLoginModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeLoginModal}
          className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-card rounded-2xl overflow-hidden max-w-md w-full card-shadow border border-border p-8"
          >
            <button
              onClick={closeLoginModal}
              className="absolute top-4 right-4 w-10 h-10 bg-secondary rounded-full flex items-center justify-center hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-8">
              <h2 className="text-3xl font-display mb-2">
                {isForgot ? "RESET PASSWORD" : isSignUp ? "CREATE ACCOUNT" : "WELCOME BACK"}
              </h2>
              <p className="text-muted-foreground">
                {isForgot
                  ? "Enter your email and we'll send a reset link"
                  : isSignUp
                    ? "Join the Barware Store family today"
                    : "Sign in to continue shopping"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={form.name}
                    onChange={setField("name")}
                    className="w-full pl-12 pr-4 py-4 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={form.email}
                  onChange={setField("email")}
                  className="w-full pl-12 pr-4 py-4 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              {!isForgot && (
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={setField("password")}
                    className="w-full pl-12 pr-4 py-4 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              )}

              {isSignUp && (
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="password"
                    placeholder="Confirm Password"
                    value={form.confirmPassword}
                    onChange={setField("confirmPassword")}
                    className="w-full pl-12 pr-4 py-4 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              )}

              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isSubmitting}
                className="w-full gradient-neon text-primary-foreground py-4 font-semibold uppercase tracking-wide rounded-full neon-glow disabled:opacity-60"
              >
                {isForgot ? "Send Reset Link" : isSignUp ? "Create Account" : "Sign In"}
              </motion.button>
            </form>

            {resetUrl && (
              <a
                href={resetUrl}
                className="mt-4 block text-center text-sm text-primary hover:underline"
              >
                Open reset link (development only)
              </a>
            )}

            <div className="mt-6 text-center space-y-2">
              {!isForgot && !isSignUp && (
                <button
                  onClick={() => switchMode("forgot")}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Forgot password?
                </button>
              )}
              <p className="text-muted-foreground">
                {isForgot
                  ? "Remembered it?"
                  : isSignUp
                    ? "Already have an account?"
                    : "Don't have an account?"}{" "}
                <button
                  onClick={() => switchMode(isSignUp || isForgot ? "login" : "register")}
                  className="text-primary hover:underline font-medium"
                >
                  {isSignUp || isForgot ? "Sign In" : "Sign Up"}
                </button>
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoginModal;

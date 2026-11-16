import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, User, Phone, MessageSquare } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { authService } from "@/services";
import { getErrorMessage } from "@/services/api";
import PasswordInput from "@/components/PasswordInput";

const COUNTRY_CODES = [
  { code: "+91", label: "+91 IN" },
  { code: "+1", label: "+1 US" },
  { code: "+44", label: "+44 UK" },
  { code: "+61", label: "+61 AU" },
  { code: "+971", label: "+971 AE" },
];

const OTP_LENGTH = 6;
const emptyOtp = () => Array(OTP_LENGTH).fill("");

const LoginModal = () => {
  const { isLoginModalOpen, closeLoginModal, login, register } = useAuth();
  const { t } = useTranslation();
  const [mode, setMode] = useState("login");
  const [method, setMethod] = useState("email");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetUrl, setResetUrl] = useState(null);

  const [countryCode, setCountryCode] = useState("+91");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState(emptyOtp());
  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [devOtp, setDevOtp] = useState(null);
  const otpRefs = useRef([]);

  const isSignUp = mode === "register";
  const isForgot = mode === "forgot";

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = setInterval(() => setResendSeconds((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [resendSeconds]);

  useEffect(() => {
    if (!isLoginModalOpen) {
      setMethod("email");
      setOtp(emptyOtp());
      setOtpSent(false);
      setMobile("");
      setDevOtp(null);
      setResendSeconds(0);
    }
  }, [isLoginModalOpen]);

  const setField = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const switchMode = (next) => {
    setMode(next);
    setResetUrl(null);
    setMethod("email");
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

  const handleSendOtp = async (e) => {
    e.preventDefault();
    const digits = mobile.replace(/\D/g, "");
    if (digits.length < 7 || digits.length > 15) {
      toast.error("Please enter a valid mobile number");
      return;
    }
    setIsSendingOtp(true);
    try {
      const result = await authService.sendOtp({ countryCode, mobile: digits });
      setOtpSent(true);
      setOtp(emptyOtp());
      setDevOtp(result?.devOtp ?? null);
      setResendSeconds(result?.resendCooldownSeconds ?? 60);
      toast.success(t("auth.otpSent", { phone: `${countryCode} ${digits}` }));
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSendingOtp(false);
    }
  };

  const setOtpDigit = (index) => (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(-1);
    setOtp((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    if (value && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index) => (e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== OTP_LENGTH) {
      toast.error(`Please enter the ${OTP_LENGTH}-digit code`);
      return;
    }
    setIsSubmitting(true);
    try {
      await authService.verifyOtp({ countryCode, mobile: mobile.replace(/\D/g, ""), otp: code });
      toast.success("Welcome back!");
      setMobile("");
      setOtp(emptyOtp());
      setOtpSent(false);
      setDevOtp(null);
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
              aria-label={t("common.close")}
              className="absolute top-4 right-4 w-10 h-10 bg-secondary rounded-full flex items-center justify-center hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-8">
              <h2 className="text-3xl font-display mb-2">
                {isForgot
                  ? t("auth.resetPassword")
                  : isSignUp
                    ? t("auth.createAccount")
                    : t("auth.welcomeBack")}
              </h2>
              <p className="text-muted-foreground">
                {isForgot
                  ? t("auth.resetSubtitle")
                  : isSignUp
                    ? t("auth.signUpSubtitle")
                    : t("auth.signInSubtitle")}
              </p>
            </div>

            {!isForgot && !isSignUp && (
              <div className="flex mb-6 bg-secondary rounded-full p-1" role="tablist">
                {[
                  { id: "email", label: t("auth.emailTab"), Icon: Mail },
                  { id: "mobile", label: t("auth.phoneTab"), Icon: Phone },
                ].map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={method === id}
                    onClick={() => setMethod(id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold uppercase tracking-wide rounded-full transition-all ${
                      method === id
                        ? "bg-card text-primary card-shadow"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            )}

            {method === "mobile" && !isForgot && !isSignUp ? (
              otpSent ? (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    {t("auth.otpSent", { phone: `${countryCode} ${mobile.replace(/\D/g, "")}` })}
                  </p>
                  <div className="flex justify-between gap-2">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (otpRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={1}
                        value={digit}
                        onChange={setOtpDigit(index)}
                        onKeyDown={handleOtpKeyDown(index)}
                        aria-label={`${t("auth.otpCode")} ${index + 1}`}
                        className="w-full aspect-square text-center text-lg font-semibold bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    ))}
                  </div>
                  {devOtp && (
                    <p className="text-xs text-center text-muted-foreground">
                      Development mode code: <span className="font-mono text-primary">{devOtp}</span>
                    </p>
                  )}
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isSubmitting}
                    className="w-full gradient-neon text-primary-foreground py-4 font-semibold uppercase tracking-wide rounded-full neon-glow disabled:opacity-60"
                  >
                    {t("auth.verifyOtp")}
                  </motion.button>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtp(emptyOtp());
                        setDevOtp(null);
                      }}
                      className="text-primary hover:underline font-medium"
                    >
                      {t("auth.changeNumber")}
                    </button>
                    {resendSeconds > 0 ? (
                      <span>{t("auth.resendIn", { seconds: resendSeconds })}</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={isSendingOtp}
                        className="text-primary hover:underline font-medium disabled:opacity-60"
                      >
                        {t("auth.resendOtp")}
                      </button>
                    )}
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="relative flex">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      aria-label={t("auth.countryCode")}
                      className="appearance-none pl-4 pr-8 py-4 bg-secondary border border-border rounded-l-xl border-r-0 focus:outline-none focus:border-primary text-sm font-medium"
                    >
                      {COUNTRY_CODES.map(({ code, label }) => (
                        <option key={code} value={code}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder={t("auth.mobileNumber")}
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/[^\d\s]/g, ""))}
                      className="w-full pl-12 pr-4 py-4 bg-secondary border border-border rounded-r-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    <Phone className="absolute left-[calc(5rem+0.75rem)] top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                  </div>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isSendingOtp}
                    className="w-full gradient-neon text-primary-foreground py-4 font-semibold uppercase tracking-wide rounded-full neon-glow disabled:opacity-60"
                  >
                    {isSendingOtp ? t("common.loading") : t("auth.sendOtp")}
                  </motion.button>
                </form>
              )
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder={t("auth.fullName")}
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
                    placeholder={t("auth.emailAddress")}
                    value={form.email}
                    onChange={setField("email")}
                    className="w-full pl-12 pr-4 py-4 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                {!isForgot && (
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <PasswordInput
                      placeholder={t("auth.password")}
                      value={form.password}
                      onChange={setField("password")}
                      className="[&>input]:w-full [&>input]:pl-12 [&>input]:py-4 [&>input]:bg-secondary [&>input]:border [&>input]:border-border [&>input]:rounded-xl"
                    />
                  </div>
                )}

                {isSignUp && (
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <PasswordInput
                      placeholder={t("auth.confirmPassword")}
                      value={form.confirmPassword}
                      onChange={setField("confirmPassword")}
                      className="[&>input]:w-full [&>input]:pl-12 [&>input]:py-4 [&>input]:bg-secondary [&>input]:border [&>input]:border-border [&>input]:rounded-xl"
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
                  {isForgot
                    ? t("auth.sendResetLink")
                    : isSignUp
                      ? t("auth.signUp")
                      : t("auth.signIn")}
                </motion.button>
              </form>
            )}

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
                  {t("auth.forgotPassword")}
                </button>
              )}
              <p className="text-muted-foreground">
                {isForgot
                  ? "Remembered it?"
                  : isSignUp
                    ? t("auth.haveAccount")
                    : t("auth.noAccount")}{" "}
                <button
                  onClick={() => switchMode(isSignUp || isForgot ? "login" : "register")}
                  className="text-primary hover:underline font-medium"
                >
                  {isSignUp || isForgot ? t("auth.signIn") : t("auth.signUp")}
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

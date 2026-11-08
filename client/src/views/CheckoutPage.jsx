import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "@/components/AppLink";
import { useRouter } from "@/lib/router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Banknote, QrCode, Tag, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { addressService, orderService, paymentService } from "@/services";
import { getErrorMessage } from "@/services/api";
import { formatPrice } from "@/utils/format";
import { trackEvent } from "@/lib/analytics";
import PageShell from "@/components/PageShell";
import PageHeading from "@/components/PageHeading";
import FormField from "@/components/FormField";
import OrderSummaryPanel from "@/components/OrderSummaryPanel";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?\d{10,13}$/;
const PIN_PATTERN = /^\d{6}$/;

const EMPTY_FORM = {
  fullName: "",
  email: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
};

const buildInitialForm = (user) => ({
  ...EMPTY_FORM,
  fullName: user?.name ?? "",
  email: user?.email ?? "",
  phone: user?.phone ?? "",
  line1: user?.address?.line1 ?? "",
  line2: user?.address?.line2 ?? "",
  city: user?.address?.city ?? "",
  state: user?.address?.state ?? "",
  pincode: user?.address?.pincode ?? "",
});

const validate = (form) => {
  const errors = {};
  if (!form.fullName.trim()) errors.fullName = "Full name is required";
  if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = "Enter a valid email address";
  if (!PHONE_PATTERN.test(form.phone.replace(/[\s-]/g, "")))
    errors.phone = "Enter a valid phone number";
  if (!form.line1.trim()) errors.line1 = "Address is required";
  if (!form.city.trim()) errors.city = "City is required";
  if (!form.state.trim()) errors.state = "State is required";
  if (!PIN_PATTERN.test(form.pincode.trim())) errors.pincode = "Enter a 6-digit PIN code";
  return errors;
};

const CheckoutForm = () => {
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();
  const {
    cartItems,
    summary,
    refreshCart,
    clearCart,
    checkoutItems,
    coupon,
    couponCode,
    applyCoupon,
    removeCoupon,
  } = useCart();
  const [form, setForm] = useState(() => buildInitialForm(user));
  const [errors, setErrors] = useState({});
  const [isCartReady, setIsCartReady] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [couponInput, setCouponInput] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [saveAddress, setSaveAddress] = useState(true);
  const isOrderPlaced = useRef(false);
  const idempotencyKey = useRef(
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `order-${Date.now()}`,
  );

  const { data: paymentConfig } = useQuery({
    queryKey: ["payment", "config"],
    queryFn: paymentService.config,
    staleTime: 5 * 60 * 1000,
  });
  // Show Scan & Pay while the config loads (and if it fails) since UPI is the default.
  const upiEnabled = paymentConfig ? Boolean(paymentConfig.upiEnabled) : true;

  useEffect(() => {
    if (paymentConfig && !upiEnabled) setPaymentMethod("COD");
  }, [paymentConfig, upiEnabled]);

  useEffect(() => {
    refreshCart()
      .catch(() => {})
      .finally(() => setIsCartReady(true));
  }, [refreshCart]);

  useEffect(() => {
    if (isCartReady && cartItems.length === 0 && !isOrderPlaced.current) {
      toast.info("Your cart is empty");
      router.replace("/products");
    }
  }, [isCartReady, cartItems.length, router]);

  useEffect(() => {
    if (!isCartReady || cartItems.length === 0) return;
    trackEvent("begin_checkout", {
      currency: "INR",
      value: summary.total,
      items: cartItems.map((item) => ({
        item_id: item.id ?? item._id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    });
    // Fire once per checkout mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCartReady]);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setIsApplyingCoupon(true);
    const applied = await applyCoupon(couponInput);
    if (applied) setCouponInput("");
    setIsApplyingCoupon(false);
  };

  const setField = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    setIsPlacing(true);
    try {
      const shippingAddress = Object.fromEntries(
        Object.entries(form).map(([key, value]) => [key, value.trim()]),
      );
      const body = {
        shippingAddress,
        paymentMethod,
        couponCode: couponCode || undefined,
      };
      if (!isLoggedIn) body.items = checkoutItems;
      const order = await orderService.place(body, idempotencyKey.current);
      isOrderPlaced.current = true;

      if (order.guestToken) {
        try {
          const saved = JSON.parse(localStorage.getItem("barware-guest-orders") || "{}");
          saved[order._id] = order.guestToken;
          localStorage.setItem("barware-guest-orders", JSON.stringify(saved));
        } catch {
          /* storage unavailable */
        }
      }

      if (isLoggedIn && saveAddress) {
        addressService
          .create({
            label: "Home",
            fullName: shippingAddress.fullName,
            phone: shippingAddress.phone,
            line1: shippingAddress.line1,
            line2: shippingAddress.line2,
            city: shippingAddress.city,
            state: shippingAddress.state,
            pincode: shippingAddress.pincode,
            isDefault: true,
          })
          .catch(() => {});
      }

      trackEvent("purchase", {
        transaction_id: order.orderNumber,
        currency: "INR",
        value: order.summary.total,
        shipping: order.summary.shipping,
        tax: order.summary.tax,
        coupon: order.summary.couponCode || undefined,
        items: order.items.map((item) => ({
          item_id: item.product,
          item_name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
      });

      await clearCart().catch(() => {});
      const params = new URLSearchParams({ placed: "1" });
      if (paymentMethod === "UPI") params.set("pay", "1");
      if (order.guestToken) params.set("token", order.guestToken);
      router.push(`/orders/${order._id}?${params.toString()}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
      setIsPlacing(false);
    }
  };

  if (!isCartReady || cartItems.length === 0) {
    return <div className="py-24 text-center text-muted-foreground">Loading your cart...</div>;
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="grid lg:grid-cols-[1fr_400px] gap-8 items-start"
    >
      <div className="space-y-8">
        <section className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-2xl font-display mb-5">SHIPPING DETAILS</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField
              label="Full name"
              value={form.fullName}
              onChange={setField("fullName")}
              error={errors.fullName}
              autoComplete="name"
            />
            <FormField
              label="Email"
              type="email"
              value={form.email}
              onChange={setField("email")}
              error={errors.email}
              autoComplete="email"
            />
            <FormField
              label="Phone"
              type="tel"
              value={form.phone}
              onChange={setField("phone")}
              error={errors.phone}
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
              label="Address line 1"
              value={form.line1}
              onChange={setField("line1")}
              error={errors.line1}
              autoComplete="address-line1"
            />
            <FormField
              className="sm:col-span-2"
              label="Address line 2 (optional)"
              value={form.line2}
              onChange={setField("line2")}
              autoComplete="address-line2"
            />
            <FormField
              label="City"
              value={form.city}
              onChange={setField("city")}
              error={errors.city}
              autoComplete="address-level2"
            />
            <FormField
              label="State"
              value={form.state}
              onChange={setField("state")}
              error={errors.state}
              autoComplete="address-level1"
            />
          </div>
        </section>

        <section className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-2xl font-display mb-5">PAYMENT METHOD</h2>
          <div className="space-y-3">
            <label
              className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${
                paymentMethod === "COD"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="COD"
                checked={paymentMethod === "COD"}
                onChange={() => setPaymentMethod("COD")}
                className="accent-[var(--primary)] w-4 h-4 mt-1"
              />
              <Banknote className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <span>
                <span className="block font-medium">Cash on Delivery</span>
                <span className="block text-sm text-muted-foreground">
                  Pay in cash when your order arrives.
                </span>
              </span>
            </label>

            {upiEnabled && (
              <label
                className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${
                  paymentMethod === "UPI"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="UPI"
                  checked={paymentMethod === "UPI"}
                  onChange={() => setPaymentMethod("UPI")}
                  className="accent-[var(--primary)] w-4 h-4 mt-1"
                />
                <QrCode className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span>
                  <span className="block font-medium">Scan &amp; Pay (UPI QR)</span>
                  <span className="block text-sm text-muted-foreground">
                    Scan the QR with PhonePe, Google Pay, Paytm or any UPI app after placing the
                    order.
                    {paymentConfig?.upiId && (
                      <span className="block mt-1 font-mono text-xs text-primary">
                        {paymentConfig.upiId}
                      </span>
                    )}
                  </span>
                </span>
              </label>
            )}
          </div>
          {paymentConfig && !upiEnabled && (
            <p className="mt-4 text-xs text-muted-foreground">
              Scan &amp; Pay is temporarily unavailable. Please choose Cash on Delivery.
            </p>
          )}
        </section>
      </div>

      <div className="lg:sticky lg:top-28 space-y-4">
        <OrderSummaryPanel summary={summary}>
          <ul className="space-y-3 mb-5 max-h-72 overflow-y-auto pr-1">
            {cartItems.map((item) => (
              <li key={`${item.id}-${item.kitId ?? ""}`} className="flex items-center gap-3">
                <img
                  src={item.image}
                  alt=""
                  className="w-14 h-14 rounded-lg object-cover bg-secondary"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                  <p className="text-xs text-muted-foreground">Qty {item.quantity}</p>
                </div>
                <span className="text-sm">{formatPrice(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mb-5">
            {coupon?.code ? (
              <div className="flex items-center justify-between rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm">
                <span className="inline-flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" />
                  <span className="font-medium uppercase">{coupon.code}</span>
                  <span className="text-muted-foreground">applied</span>
                </span>
                <button
                  type="button"
                  onClick={removeCoupon}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  aria-label="Remove coupon"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Coupon code"
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm uppercase focus:border-primary focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={isApplyingCoupon || !couponInput.trim()}
                  className="px-4 py-2 rounded-lg border border-primary text-primary text-xs font-semibold uppercase tracking-widest hover:bg-primary/10 transition-colors disabled:opacity-50"
                >
                  {isApplyingCoupon ? "Applying..." : "Apply"}
                </button>
              </div>
            )}
          </div>
        </OrderSummaryPanel>

        {isLoggedIn && (
          <label className="flex items-center gap-2 text-xs text-muted-foreground px-1">
            <input
              type="checkbox"
              checked={saveAddress}
              onChange={(e) => setSaveAddress(e.target.checked)}
              className="accent-[var(--primary)]"
            />
            Save this address to my address book
          </label>
        )}

        <motion.button
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={isPlacing}
          className="w-full gradient-neon text-primary-foreground py-4 font-semibold uppercase tracking-wide rounded-full neon-glow disabled:opacity-60"
        >
          {isPlacing ? "Placing order..." : "Place Order"}
        </motion.button>
      </div>
    </form>
  );
};

const CheckoutPage = () => (
  <PageShell>
    <Link
      href="/products"
      className="inline-flex items-center gap-2 mb-8 text-muted-foreground hover:text-primary transition-colors"
    >
      <ArrowLeft className="w-5 h-5" />
      Continue Shopping
    </Link>
    <PageHeading
      title="SECURE"
      highlight="CHECKOUT"
      subtitle="No account needed — check out as a guest or sign in for faster checkout"
    />
    <CheckoutForm />
  </PageShell>
);

export default CheckoutPage;

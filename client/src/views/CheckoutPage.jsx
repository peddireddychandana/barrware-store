import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "@/components/AppLink";
import { useRouter } from "@/lib/router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { orderService } from "@/services";
import { getErrorMessage } from "@/services/api";
import { formatPrice } from "@/utils/format";
import PageShell from "@/components/PageShell";
import PageHeading from "@/components/PageHeading";
import RequireLogin from "@/components/RequireLogin";
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
  const { user } = useAuth();
  const { cartItems, summary, refreshCart } = useCart();
  const [form, setForm] = useState(() => buildInitialForm(user));
  const [errors, setErrors] = useState({});
  const [isCartReady, setIsCartReady] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const isOrderPlaced = useRef(false);

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
      const order = await orderService.place({ shippingAddress, paymentMethod: "COD" });
      isOrderPlaced.current = true;
      await refreshCart().catch(() => {});
      router.push(`/orders/${order._id}?placed=1`);
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
          <label className="flex items-center gap-4 p-4 rounded-xl border border-primary bg-primary/5 cursor-pointer">
            <input
              type="radio"
              name="paymentMethod"
              value="COD"
              checked
              readOnly
              className="accent-[var(--primary)] w-4 h-4"
            />
            <span>
              <span className="block font-medium">Cash on Delivery</span>
              <span className="block text-sm text-muted-foreground">
                Pay in cash when your order arrives.
              </span>
            </span>
          </label>
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
        </OrderSummaryPanel>
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
      subtitle="Review your details and place your order"
    />
    <RequireLogin message="Please sign in to place your order.">
      <CheckoutForm />
    </RequireLogin>
  </PageShell>
);

export default CheckoutPage;

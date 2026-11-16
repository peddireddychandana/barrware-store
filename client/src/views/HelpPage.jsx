import { useState } from "react";
import Link from "@/components/AppLink";
import { useTranslation } from "react-i18next";
import { Clock, LifeBuoy, Loader2, Mail, MapPin, Package, Phone } from "lucide-react";
import { toast } from "sonner";
import { supportService } from "@/services";
import { getErrorMessage } from "@/services/api";
import PageShell from "@/components/PageShell";
import PageHeading from "@/components/PageHeading";
import FormField, { inputClass } from "@/components/FormField";
import FaqAccordion from "@/components/FaqAccordion";
import { siteConfig } from "@/utils/siteConfig";

const { contact, company } = siteConfig;

const SupportForm = () => {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: "",
    email: "",
    category: "order",
    orderNumber: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [isSending, setIsSending] = useState(false);

  const categories = ["order", "delivery", "payment", "returns", "product", "account", "other"];

  const setField = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const found = {};
    if (form.name.trim().length < 2) found.name = t("help.name") + " is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      found.email = "Enter a valid email address";
    if (form.message.trim().length < 10) found.message = "Please add a little more detail";
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setIsSending(true);
    try {
      await supportService.send({
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        orderNumber: form.orderNumber.trim(),
        message: form.message.trim(),
      });
      toast.success("Request received. We will reply within one business day.");
      setForm({ name: "", email: "", category: "order", orderNumber: "", message: "" });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      noValidate
      className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-5"
    >
      <div>
        <h2 className="text-2xl font-display uppercase">{t("help.contactSupport")}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Tell us what happened and we will get back to you within one business day.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <FormField
          label={t("help.name")}
          value={form.name}
          onChange={setField("name")}
          error={errors.name}
          autoComplete="name"
        />
        <FormField
          label={t("help.email")}
          type="email"
          value={form.email}
          onChange={setField("email")}
          error={errors.email}
          autoComplete="email"
        />
        <label className="block">
          <span className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
            {t("help.category")}
          </span>
          <select value={form.category} onChange={setField("category")} className={inputClass}>
            {categories.map((category) => (
              <option key={category} value={category}>
                {t(`help.categories.${category}`)}
              </option>
            ))}
          </select>
        </label>
        <FormField
          label={t("help.orderId")}
          value={form.orderNumber}
          onChange={setField("orderNumber")}
          placeholder="e.g. ORD-1234"
        />
      </div>
      <FormField
        label={t("help.message")}
        as="textarea"
        rows={5}
        value={form.message}
        onChange={setField("message")}
        error={errors.message}
        placeholder="Include what you were trying to do and any error message you saw."
      />
      <button
        type="submit"
        disabled={isSending}
        className="inline-flex items-center justify-center gap-2 gradient-neon text-primary-foreground px-8 py-3 font-semibold uppercase tracking-wide rounded-full neon-glow disabled:opacity-60"
      >
        {isSending && <Loader2 className="w-4 h-4 animate-spin" />}
        {isSending ? "Sending..." : t("help.submit")}
      </button>
    </form>
  );
};

const HelpPage = () => {
  const { t } = useTranslation();

  const faqs = [
    { question: t("help.faq.placeOrderQ"), answer: t("help.faq.placeOrderA") },
    { question: t("help.faq.trackOrderQ"), answer: t("help.faq.trackOrderA") },
    { question: t("help.faq.cancelOrderQ"), answer: t("help.faq.cancelOrderA") },
    { question: t("help.faq.returnsQ"), answer: t("help.faq.returnsA") },
    { question: t("help.faq.paymentsQ"), answer: t("help.faq.paymentsA") },
    { question: t("help.faq.deliveryQ"), answer: t("help.faq.deliveryA") },
  ];

  return (
    <PageShell>
      <PageHeading
        title="HELP"
        highlight="CENTRE"
        subtitle={t("help.subtitle")}
      />

      <div className="grid lg:grid-cols-[1fr_340px] gap-10 items-start">
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-display uppercase mb-4">{t("help.faqs")}</h2>
            <FaqAccordion faqs={faqs} />
          </section>

          <section className="grid sm:grid-cols-3 gap-4">
            <Link
              href="/track-order"
              className="rounded-2xl border border-border bg-card p-5 hover:border-primary/50 transition-colors"
            >
              <Package className="w-6 h-6 text-primary mb-3" />
              <h3 className="font-display text-lg">TRACK ORDER</h3>
              <p className="text-sm text-muted-foreground mt-1">See where your parcel is.</p>
            </Link>
            <Link
              href="/orders"
              className="rounded-2xl border border-border bg-card p-5 hover:border-primary/50 transition-colors"
            >
              <LifeBuoy className="w-6 h-6 text-primary mb-3" />
              <h3 className="font-display text-lg">MY ORDERS</h3>
              <p className="text-sm text-muted-foreground mt-1">View, cancel or review an order.</p>
            </Link>
            <Link
              href="/refund-policy"
              className="rounded-2xl border border-border bg-card p-5 hover:border-primary/50 transition-colors"
            >
              <Clock className="w-6 h-6 text-primary mb-3" />
              <h3 className="font-display text-lg">RETURNS</h3>
              <p className="text-sm text-muted-foreground mt-1">Read our returns and refunds policy.</p>
            </Link>
          </section>

          <SupportForm />
        </div>

        <aside className="bg-card border border-border rounded-2xl p-6 lg:sticky lg:top-28 space-y-5">
          <div>
            <h2 className="text-2xl font-display">REACH US</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Prefer to talk? Use the details below during support hours.
            </p>
          </div>
          <ul className="space-y-4 text-sm">
            <li className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span>{contact.address}</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-primary shrink-0" />
              <a
                href={`tel:${contact.phone.replace(/\s/g, "")}`}
                className="hover:text-primary transition-colors"
              >
                {contact.phone}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-primary shrink-0" />
              <a href={`mailto:${contact.email}`} className="hover:text-primary transition-colors">
                {contact.email}
              </a>
            </li>
            <li className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span>{company.supportHours}</span>
            </li>
          </ul>
          <div className="border-t border-border pt-4 text-xs text-muted-foreground space-y-2">
            <p>We reply to support requests within one business day.</p>
            <Link href="/contact" className="text-primary hover:underline">
              Send a general enquiry instead
            </Link>
          </div>
        </aside>
      </div>
    </PageShell>
  );
};

export default HelpPage;

import { useState } from "react";
import { MapPin, Phone, Mail } from "lucide-react";
import { toast } from "sonner";
import PageShell from "@/components/PageShell";
import PageHeading from "@/components/PageHeading";
import FormField from "@/components/FormField";
import { siteConfig } from "@/utils/siteConfig";

const MIN_MESSAGE_LENGTH = 10;

const ContactPage = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const { address, phone, email } = siteConfig.contact;

  const setField = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Please enter your name and email");
      return;
    }
    if (form.message.trim().length < MIN_MESSAGE_LENGTH) {
      toast.error("Please write a short message");
      return;
    }
    const subject = encodeURIComponent(`Message from ${form.name.trim()}`);
    const body = encodeURIComponent(`${form.message.trim()}\n\n${form.name.trim()}\n${form.email.trim()}`);
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    toast.success("Opening your email app to send the message");
  };

  const details = [
    { icon: MapPin, label: "Visit", value: address },
    { icon: Phone, label: "Call", value: phone, href: `tel:${phone.replace(/\s/g, "")}` },
    { icon: Mail, label: "Email", value: email, href: `mailto:${email}` },
  ];

  return (
    <PageShell>
      <PageHeading
        title="CONTACT"
        highlight="US"
        subtitle="Questions about a product, an order or a bulk purchase? We would love to help."
      />

      <div className="grid lg:grid-cols-5 gap-10 max-w-5xl mx-auto">
        <div className="lg:col-span-2 space-y-4">
          {details.map(({ icon: Icon, label, value, href }) => (
            <div key={label} className="flex items-start gap-4 p-5 rounded-2xl bg-card border border-border">
              <div className="w-11 h-11 shrink-0 rounded-xl gradient-neon flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
                {href ? (
                  <a href={href} className="hover:text-primary transition-colors break-words">
                    {value}
                  </a>
                ) : (
                  <p className="break-words">{value}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          className="lg:col-span-3 p-6 md:p-8 rounded-2xl bg-card border border-border space-y-5"
        >
          <div className="grid sm:grid-cols-2 gap-5">
            <FormField label="Your name" value={form.name} onChange={setField("name")} autoComplete="name" />
            <FormField
              label="Email"
              type="email"
              value={form.email}
              onChange={setField("email")}
              autoComplete="email"
            />
          </div>
          <FormField
            label="Message"
            as="textarea"
            rows={6}
            value={form.message}
            onChange={setField("message")}
            placeholder="How can we help?"
          />
          <button
            type="submit"
            className="w-full gradient-neon text-primary-foreground py-4 font-semibold uppercase tracking-wide rounded-full neon-glow"
          >
            Send Message
          </button>
          <p className="text-xs text-center text-muted-foreground">
            This opens your email app with the message ready to send to {email}.
          </p>
        </form>
      </div>
    </PageShell>
  );
};

export default ContactPage;

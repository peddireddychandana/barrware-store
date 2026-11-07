import { motion } from "framer-motion";
import Link from "@/components/AppLink";
import { Mail, MapPin, Phone, RotateCcw, ScrollText, ShieldCheck, Truck } from "lucide-react";
import PageShell from "@/components/PageShell";
import PageHeading from "@/components/PageHeading";
import { siteConfig } from "@/utils/siteConfig";

const { brandName, company, contact, freeShippingThreshold } = siteConfig;
const shippingFee = 79;

const CONTACT = {
  address: contact.address,
  email: contact.email,
  phone: contact.phone,
};

const lastUpdated = new Date().toLocaleDateString("en-IN", {
  month: "long",
  year: "numeric",
});

const POLICY_LINKS = [
  { key: "privacy", label: "Privacy Policy", href: "/privacy-policy" },
  { key: "terms", label: "Terms of Service", href: "/terms" },
  { key: "shipping", label: "Shipping Policy", href: "/shipping-policy" },
  { key: "refunds", label: "Returns & Refunds", href: "/refund-policy" },
];

const ContactDetails = () => (
  <div className="mt-10 rounded-2xl border border-border bg-card p-6">
    <h2 className="text-xl font-display mb-4">CONTACT US</h2>
    <p className="text-sm text-muted-foreground mb-4">
      Questions about this policy? Reach out and we will respond within 1–2 business days.
    </p>
    <ul className="space-y-3 text-sm">
      <li className="flex items-start gap-3">
        <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <span>
          {company.legalName}, {CONTACT.address}
          {company.gstin ? ` · GSTIN ${company.gstin}` : ""}
        </span>
      </li>
      <li className="flex items-center gap-3">
        <Mail className="w-4 h-4 text-primary shrink-0" />
        <a href={`mailto:${CONTACT.email}`} className="hover:text-primary transition-colors">
          {CONTACT.email}
        </a>
      </li>
      <li className="flex items-center gap-3">
        <Phone className="w-4 h-4 text-primary shrink-0" />
        <a
          href={`tel:${CONTACT.phone.replace(/\s/g, "")}`}
          className="hover:text-primary transition-colors"
        >
          {CONTACT.phone}
        </a>
      </li>
    </ul>
    <p className="text-xs text-muted-foreground mt-4">Support hours: {company.supportHours}</p>
  </div>
);

const Section = ({ heading, children }) => (
  <section className="space-y-3">
    <h2 className="text-xl font-display text-foreground">{heading}</h2>
    <div className="text-sm leading-relaxed text-muted-foreground space-y-3">{children}</div>
  </section>
);

const PAGES = {
  privacy: {
    title: "PRIVACY",
    highlight: "POLICY",
    subtitle: "How we collect, use and protect your personal information",
    icon: ShieldCheck,
    intro: `${brandName} respects your privacy. This policy explains what information we collect when you browse or order from our store, why we collect it, and the choices you have.`,
    sections: [
      {
        heading: "Information we collect",
        body: (
          <ul className="list-disc pl-5 space-y-1">
            <li>Account details: name, email address and phone number.</li>
            <li>Order details: shipping address, items purchased, order value and order history.</li>
            <li>
              Payment details: your chosen method (Cash on Delivery or UPI). For UPI we store only
              the transaction / UTR reference you submit — never your UPI PIN, card number or bank
              password.
            </li>
            <li>Technical data: device type, browser, IP address and pages visited.</li>
            <li>Messages you send us by email, phone or the contact form.</li>
          </ul>
        ),
      },
      {
        heading: "How we use your information",
        body: (
          <ul className="list-disc pl-5 space-y-1">
            <li>To process, pack, ship and deliver your orders.</li>
            <li>To confirm and reconcile UPI payments.</li>
            <li>To send order updates, delivery notifications and support replies.</li>
            <li>To prevent fraud, misuse and unauthorised access.</li>
            <li>To improve our products, website and customer experience.</li>
            <li>To meet legal, tax and accounting obligations.</li>
          </ul>
        ),
      },
      {
        heading: "Payments",
        body: (
          <p>
            UPI payments are made directly to {brandName} using a payment QR code. Your UPI app
            processes the payment; we do not receive or store your bank credentials or UPI PIN. We
            store the reference number you provide so we can match your payment to your order.
          </p>
        ),
      },
      {
        heading: "Sharing your information",
        body: (
          <p>
            We share only what is necessary with delivery partners (name, address and phone number)
            and with service providers that help us run the store, such as email delivery and
            hosting providers. We do not sell your personal information. We may disclose information
            where required by law or to protect our legal rights.
          </p>
        ),
      },
      {
        heading: "Cookies and analytics",
        body: (
          <p>
            We use essential cookies to keep you signed in and to remember your cart. We may use
            privacy-friendly analytics to understand how the store is used. You can block or delete
            cookies in your browser, but some features (such as signing in or checkout) may stop
            working.
          </p>
        ),
      },
      {
        heading: "Retention and security",
        body: (
          <p>
            We keep order and payment records for as long as required for warranty, accounting and
            legal purposes. We use reasonable technical and organisational safeguards to protect your
            data, but no method of transmission or storage over the internet is completely secure.
          </p>
        ),
      },
      {
        heading: "Your rights",
        body: (
          <p>
            You can ask us to access, correct or delete your personal information, or to stop
            sending you non-essential messages. To make a request, contact us using the details
            below. We may need to verify your identity before acting on a request.
          </p>
        ),
      },
      {
        heading: "Children",
        body: (
          <p>
            Our store is not intended for children under 18. We do not knowingly collect personal
            information from children. If you believe a child has provided us with personal data,
            please contact us and we will delete it.
          </p>
        ),
      },
      {
        heading: "Changes to this policy",
        body: (
          <p>
            We may update this policy from time to time. The latest version will always be available
            on this page, with the date of the most recent update shown above.
          </p>
        ),
      },
    ],
  },
  terms: {
    title: "TERMS",
    highlight: "OF SERVICE",
    subtitle: "The rules that apply when you shop with us",
    icon: ScrollText,
    intro: `These Terms of Service govern your use of the ${brandName} website and your purchases from us. By using the site or placing an order, you agree to these terms.`,
    sections: [
      {
        heading: "About us",
        body: (
          <p>
            This store is operated by {company.legalName}, based at {CONTACT.address}. You can
            contact us at {CONTACT.email} or {CONTACT.phone}.
          </p>
        ),
      },
      {
        heading: "Eligibility and your account",
        body: (
          <p>
            You must be at least 18 years old and able to enter into a binding contract to place an
            order. You are responsible for keeping your account credentials secure and for all
            activity under your account. Please keep your contact and delivery details accurate.
          </p>
        ),
      },
      {
        heading: "Products, pricing and availability",
        body: (
          <p>
            All prices are shown in Indian Rupees (INR) and include applicable taxes unless stated
            otherwise. Product photos are for illustration; handmade or natural materials may vary
            slightly in colour or finish. We reserve the right to correct pricing errors, update
            product information and limit quantities. If an item is unavailable after you order, we
            will contact you and offer a replacement or a full refund.
          </p>
        ),
      },
      {
        heading: "Orders and payment",
        body: (
          <>
            <p>
              An order is accepted when we confirm it. For Cash on Delivery, the amount is payable
              when your order arrives. For UPI, you pay by scanning the QR code on your order page
              and submit the transaction reference; your order is confirmed once we verify the
              payment.
            </p>
            <p>
              Please pay the exact order amount to the UPI ID shown at checkout. We are not
              responsible for payments made to any other UPI ID or for transactions that cannot be
              matched to an order.
            </p>
          </>
        ),
      },
      {
        heading: "Shipping, returns and refunds",
        body: (
          <p>
            Delivery timelines, shipping charges, returns and refunds are described in our{" "}
            <Link href="/shipping-policy" className="text-primary hover:underline">
              Shipping Policy
            </Link>{" "}
            and{" "}
            <Link href="/refund-policy" className="text-primary hover:underline">
              Returns & Refund Policy
            </Link>
            , which form part of these terms.
          </p>
        ),
      },
      {
        heading: "Acceptable use",
        body: (
          <p>
            You agree not to misuse the site, attempt to gain unauthorised access, interfere with its
            operation, scrape content at scale, or use it for fraudulent or unlawful purposes. We
            may suspend or cancel orders and accounts that we reasonably believe are involved in
            abuse.
          </p>
        ),
      },
      {
        heading: "Intellectual property",
        body: (
          <p>
            The {brandName} name, logo, product photography, copy and site design are owned by us or
            our licensors and may not be copied, reproduced or used without written permission.
            Third-party photographs are used under the licences noted in our image credits.
          </p>
        ),
      },
      {
        heading: "Limitation of liability",
        body: (
          <p>
            To the extent permitted by law, we are not liable for indirect, incidental or
            consequential losses, or for delays caused by events beyond our reasonable control. Our
            total liability for any order is limited to the amount you paid for that order. Nothing
            in these terms limits rights you have under applicable consumer law.
          </p>
        ),
      },
      {
        heading: "Governing law",
        body: (
          <p>
            These terms are governed by the laws of India. Disputes are subject to the exclusive
            jurisdiction of the courts at {company.jurisdiction}.
          </p>
        ),
      },
    ],
  },
  shipping: {
    title: "SHIPPING",
    highlight: "POLICY",
    subtitle: "Dispatch, delivery timelines and charges",
    icon: Truck,
    intro: `We pack every ${brandName} order with care and ship across India. Here is what to expect after you place an order.`,
    sections: [
      {
        heading: "Order processing",
        body: (
          <p>
            Orders are usually packed and handed to our delivery partner within 1–2 business days.
            Orders placed on Sundays or public holidays are processed on the next business day. For
            UPI orders, processing begins after we verify your payment.
          </p>
        ),
      },
      {
        heading: "Delivery timelines",
        body: (
          <p>
            Standard delivery takes 3–7 business days after dispatch for most pin codes. Remote or
            high-altitude locations may take up to 10 business days. Delivery estimates are not
            guaranteed and may be affected by weather, strikes, festivals or other events beyond our
            control.
          </p>
        ),
      },
      {
        heading: "Shipping charges",
        body: (
          <p>
            Shipping is free on orders of ₹{freeShippingThreshold} or more after discounts. Orders
            below ₹{freeShippingThreshold} carry a flat shipping fee of ₹{shippingFee}. The exact
            charge is always shown in your cart and at checkout before you pay.
          </p>
        ),
      },
      {
        heading: "Tracking",
        body: (
          <p>
            Once your order is shipped, you can track its status from My Orders. Where available, a
            tracking link or courier reference will also be shared by email. Please allow up to 24
            hours for tracking information to become active.
          </p>
        ),
      },
      {
        heading: "Delivery attempts",
        body: (
          <p>
            Our delivery partner will usually make 2–3 attempts to deliver your order. Please keep
            your phone reachable and provide a complete address with a landmark where possible. If
            an order is returned to us as undeliverable, we will contact you to arrange a re-ship at
            an additional shipping charge or a refund of the item value, less the original shipping
            cost.
          </p>
        ),
      },
      {
        heading: "Damaged or missing items",
        body: (
          <p>
            Please inspect your parcel when it arrives. If an item is damaged, defective or missing,
            contact us within 48 hours of delivery with your order number and photos. See our{" "}
            <Link href="/refund-policy" className="text-primary hover:underline">
              Returns & Refund Policy
            </Link>{" "}
            for next steps.
          </p>
        ),
      },
    ],
  },
  refunds: {
    title: "RETURNS &",
    highlight: "REFUNDS",
    subtitle: "Cancellations, returns and how refunds are processed",
    icon: RotateCcw,
    intro: `We want you to be happy with your ${brandName} purchase. If something is not right, here is how returns and refunds work.`,
    sections: [
      {
        heading: "Cancelling an order",
        body: (
          <p>
            You can cancel an order yourself from My Orders while it is in the Placed or Confirmed
            stage. After packing or dispatch, please contact us and we will help if the order has not
            yet been delivered. Once delivered, the return process below applies.
          </p>
        ),
      },
      {
        heading: "Returns",
        body: (
          <p>
            You may request a return within 7 days of delivery if the item is unused, undamaged and
            in its original packaging with all tags and accessories. Contact us at {CONTACT.email}{" "}
            with your order number, the item and the reason. We will confirm whether the item is
            eligible and share return instructions. Return shipping may apply for change-of-mind
            returns.
          </p>
        ),
      },
      {
        heading: "Damaged, defective or wrong items",
        body: (
          <p>
            If you receive a damaged, defective or incorrect item, contact us within 48 hours of
            delivery with photos of the item and packaging. We will arrange a replacement or a full
            refund, including any shipping charges, at no cost to you. Please keep the parcel and
            packaging until the issue is resolved.
          </p>
        ),
      },
      {
        heading: "Items we cannot accept",
        body: (
          <ul className="list-disc pl-5 space-y-1">
            <li>Items that have been used, washed or damaged after delivery.</li>
            <li>Items without their original packaging, tags or accessories.</li>
            <li>Custom or personalised bar kits, unless damaged or defective.</li>
            <li>Clearance or final-sale items marked as non-returnable.</li>
          </ul>
        ),
      },
      {
        heading: "Refund timelines and method",
        body: (
          <p>
            Approved refunds are processed within 5–7 business days of the returned item being
            received and inspected. UPI payments are refunded to the same UPI ID used to pay, where
            possible. Cash on Delivery orders are refunded by UPI bank transfer using details you
            provide. Shipping charges are refunded only when the return is due to a damaged,
            defective or incorrect item.
          </p>
        ),
      },
      {
        heading: "Failed or duplicate UPI payments",
        body: (
          <p>
            If a UPI payment fails, is deducted twice, or cannot be matched to an order, contact us
            with the transaction reference and a screenshot. Verified duplicate or unmatched
            payments are refunded to the original UPI ID within 5–7 business days.
          </p>
        ),
      },
    ],
  },
};

const LegalPage = ({ page }) => {
  const content = PAGES[page] ?? PAGES.privacy;
  const Icon = content.icon;

  return (
    <PageShell>
      <PageHeading title={content.title} highlight={content.highlight} subtitle={content.subtitle} />

      <div className="grid lg:grid-cols-[1fr_320px] gap-10 items-start">
        <motion.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-8"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{content.intro}</p>
            </div>
          </div>

          <div className="space-y-8">
            {content.sections.map((section) => (
              <Section key={section.heading} heading={section.heading}>
                {section.body}
              </Section>
            ))}
          </div>

          <ContactDetails />
        </motion.article>

        <aside className="lg:sticky lg:top-28 space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-lg font-display mb-4">POLICIES</h2>
            <ul className="space-y-3 text-sm">
              {POLICY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`transition-colors hover:text-primary ${
                      link.key === page ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            <h2 className="text-lg font-display text-foreground mb-3">NEED HELP?</h2>
            <p>
              Email us at{" "}
              <a href={`mailto:${CONTACT.email}`} className="text-primary hover:underline">
                {CONTACT.email}
              </a>{" "}
              or call{" "}
              <a
                href={`tel:${CONTACT.phone.replace(/\s/g, "")}`}
                className="text-primary hover:underline"
              >
                {CONTACT.phone}
              </a>
              .
            </p>
          </div>
        </aside>
      </div>
    </PageShell>
  );
};

export default LegalPage;

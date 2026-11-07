import { useMemo } from "react";
import Link from "@/components/AppLink";
import { useParams } from "@/lib/router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Printer } from "lucide-react";
import { orderService } from "@/services";
import { getErrorMessage } from "@/services/api";
import { formatPrice } from "@/utils/format";
import { formatDateTime, guestTokenFor } from "@/utils/orders";
import { siteConfig } from "@/utils/siteConfig";
import PageShell from "@/components/PageShell";

const InvoicePage = () => {
  const { id } = useParams();
  const token = useMemo(() => guestTokenFor(id), [id]);
  const { data: order, isLoading, error } = useQuery({
    queryKey: ["order", id, token, "invoice"],
    queryFn: () => orderService.get(id, token),
  });

  if (isLoading)
    return <p className="py-24 text-center text-muted-foreground">Loading invoice...</p>;
  if (error || !order)
    return (
      <p className="py-24 text-center text-destructive">
        {error ? getErrorMessage(error) : "Invoice not available."}
      </p>
    );

  const { summary, shippingAddress: address } = order;
  const taxable = Math.max(0, summary.total - (summary.tax || 0));
  const cgst = Math.round(((summary.tax || 0) / 2) * 100) / 100;

  return (
    <PageShell>
      <div className="flex items-center justify-between gap-4 mb-6 print:hidden">
        <Link
          href={`/orders/${order._id}${token ? `?token=${token}` : ""}`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> Back to order
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 gradient-neon text-primary-foreground px-6 py-2.5 rounded-full text-sm font-semibold uppercase tracking-widest"
        >
          <Printer className="w-4 h-4" /> Print / Save PDF
        </button>
      </div>

      <div className="bg-white text-black rounded-2xl border border-border p-8 md:p-10 max-w-3xl mx-auto print:border-0 print:rounded-none print:p-0">
        <div className="flex flex-wrap items-start justify-between gap-6 pb-6 border-b border-black/20">
          <div>
            <p className="text-3xl font-display tracking-widest">{siteConfig.brandName}</p>
            <p className="text-sm mt-1">{siteConfig.contact.address}</p>
            <p className="text-sm">{siteConfig.contact.email} · {siteConfig.contact.phone}</p>
            {siteConfig.company.gstin && (
              <p className="text-sm mt-1">GSTIN: {siteConfig.company.gstin}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xl font-semibold uppercase tracking-widest">Tax Invoice</p>
            <p className="text-sm mt-1">Invoice: {order.orderNumber}</p>
            <p className="text-sm">Date: {formatDateTime(order.createdAt)}</p>
            <p className="text-sm uppercase">Status: {order.status.replace(/_/g, " ")}</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 py-6 border-b border-black/20 text-sm">
          <div>
            <p className="font-semibold uppercase text-xs tracking-widest mb-2">Billed to</p>
            <p className="font-medium">{address.fullName}</p>
            <p>{address.line1}</p>
            {address.line2 && <p>{address.line2}</p>}
            <p>{address.city}, {address.state} {address.pincode}</p>
            <p>{address.phone} · {address.email}</p>
          </div>
          <div>
            <p className="font-semibold uppercase text-xs tracking-widest mb-2">Payment</p>
            <p>{order.paymentMethod === "UPI" ? "UPI / QR" : "Cash on Delivery"}</p>
            <p className="capitalize">Status: {order.paymentStatus.replace(/_/g, " ")}</p>
            {order.paymentReference && <p>Ref: {order.paymentReference}</p>}
          </div>
        </div>

        <table className="w-full text-sm my-6">
          <thead>
            <tr className="border-b border-black/30 text-left">
              <th className="py-2">Item</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">Rate</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => (
              <tr key={`${item.product}-${index}`} className="border-b border-black/10">
                <td className="py-2">
                  {item.name}
                  {item.sku && <span className="block text-xs text-black/60">SKU: {item.sku}</span>}
                </td>
                <td className="py-2 text-right">{item.quantity}</td>
                <td className="py-2 text-right">{formatPrice(item.price)}</td>
                <td className="py-2 text-right">{formatPrice(item.price * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ml-auto w-full sm:w-72 text-sm space-y-1">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(summary.subtotal)}</span></div>
          {summary.discount > 0 && (
            <div className="flex justify-between"><span>Discount</span><span>-{formatPrice(summary.discount)}</span></div>
          )}
          {summary.couponDiscount > 0 && (
            <div className="flex justify-between">
              <span>Coupon {summary.couponCode}</span>
              <span>-{formatPrice(summary.couponDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between"><span>Shipping</span><span>{summary.shipping ? formatPrice(summary.shipping) : "Free"}</span></div>
          <div className="flex justify-between border-t border-black/20 pt-2 font-semibold">
            <span>Total</span><span>{formatPrice(summary.total)}</span>
          </div>
          {summary.tax > 0 && (
            <div className="pt-2 text-xs text-black/70 space-y-1">
              <div className="flex justify-between"><span>Taxable value</span><span>{formatPrice(taxable)}</span></div>
              <div className="flex justify-between"><span>CGST (9%)</span><span>{formatPrice(cgst)}</span></div>
              <div className="flex justify-between"><span>SGST (9%)</span><span>{formatPrice(summary.tax - cgst)}</span></div>
              <div className="flex justify-between font-medium"><span>Total GST (incl.)</span><span>{formatPrice(summary.tax)}</span></div>
            </div>
          )}
        </div>

        <div className="mt-10 pt-4 border-t border-black/20 text-xs text-black/60">
          <p>This is a computer-generated invoice. Prices are inclusive of GST.</p>
          <p>
            Returns accepted within 7 days of delivery. Questions? {siteConfig.contact.email}
          </p>
        </div>
      </div>
    </PageShell>
  );
};

export default InvoicePage;

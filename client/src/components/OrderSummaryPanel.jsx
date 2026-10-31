import { formatPrice } from "@/utils/format";

/** Price breakdown. `summary` must come from the server (cart or order), never computed here. */
const OrderSummaryPanel = ({ summary, title = "ORDER SUMMARY", children }) => (
  <div className="bg-card border border-border rounded-2xl p-6 card-shadow">
    <h2 className="text-2xl font-display mb-4">{title}</h2>
    {children}
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between">
        <dt className="text-muted-foreground">Subtotal</dt>
        <dd>{formatPrice(summary.subtotal)}</dd>
      </div>
      {summary.discount > 0 && (
        <div className="flex justify-between text-green-600">
          <dt>Discount</dt>
          <dd>-{formatPrice(summary.discount)}</dd>
        </div>
      )}
      {summary.kitDiscount > 0 && (
        <div className="flex justify-between text-green-600">
          <dt>Kit discount (included above)</dt>
          <dd>-{formatPrice(summary.kitDiscount)}</dd>
        </div>
      )}
      <div className="flex justify-between">
        <dt className="text-muted-foreground">Shipping</dt>
        <dd>{summary.shipping > 0 ? formatPrice(summary.shipping) : "Free"}</dd>
      </div>
      <div className="flex justify-between border-t border-border pt-3 text-lg font-semibold">
        <dt>Total</dt>
        <dd>{formatPrice(summary.total)}</dd>
      </div>
    </dl>
  </div>
);

export default OrderSummaryPanel;

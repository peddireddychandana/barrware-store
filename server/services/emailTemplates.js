const env = require("../config/env");

const BRAND = "VYRNT";
const GOLD = "#d9a52e";
const CHAMPAGNE = "#f2d18a";
const BODY_TEXT = "#d6c7b5";
const BORDER = "#6b3e1e";

const STATUS_LABELS = {
  placed: "Placed",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_MESSAGES = {
  placed: "We have received your order.",
  confirmed: "Your order is confirmed and is being prepared.",
  packed: "Your order has been packed and is ready to ship.",
  shipped: "Your order is on its way.",
  out_for_delivery: "Your order is out for delivery today.",
  delivered: "Your order has been delivered. We hope you love it!",
  cancelled: "Your order has been cancelled.",
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatMoney = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const statusLabel = (status) => STATUS_LABELS[status] || status;

const orderUrl = (order) =>
  order.user
    ? `${env.clientUrl}/orders/${order._id}`
    : `${env.clientUrl}/track-order?order=${encodeURIComponent(order.orderNumber)}`;

const layout = ({ heading, intro, body = "", footerNote = "" }) => `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#0b0908;">
    <div style="background:#0b0908;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:560px;margin:0 auto;background:#17120f;border:1px solid ${BORDER};border-radius:16px;overflow:hidden;">
        <div style="padding:24px;text-align:center;border-bottom:1px solid ${BORDER};">
          <span style="color:${CHAMPAGNE};font-size:26px;font-weight:bold;letter-spacing:6px;">${BRAND}</span>
        </div>
        <div style="padding:28px 24px;color:${BODY_TEXT};">
          <h1 style="margin:0 0 12px;font-size:22px;color:${CHAMPAGNE};">${escapeHtml(heading)}</h1>
          <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:${BODY_TEXT};">${intro}</p>
          ${body}
        </div>
        <div style="padding:18px 24px;text-align:center;color:#b7a48e;font-size:12px;border-top:1px solid ${BORDER};">
          ${footerNote || `Thank you for shopping with ${BRAND}.`}
        </div>
      </div>
    </div>
  </body>
</html>`;

const button = (href, label) => `
  <a href="${escapeHtml(href)}" style="display:inline-block;background:${GOLD};color:#0b0908;text-decoration:none;font-weight:bold;font-size:14px;padding:14px 28px;border-radius:999px;letter-spacing:1px;text-transform:uppercase;">${escapeHtml(label)}</a>`;

const itemRows = (order) =>
  order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid ${BORDER};color:${BODY_TEXT};font-size:13px;">
          ${escapeHtml(item.name)}
          <span style="color:#b7a48e;">× ${item.quantity}</span>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid ${BORDER};text-align:right;color:${BODY_TEXT};font-size:13px;white-space:nowrap;">
          ${formatMoney(item.price * item.quantity)}
        </td>
      </tr>`,
    )
    .join("");

const summaryRows = (order) => {
  const rows = [
    ["Subtotal", order.summary.subtotal],
    [order.summary.kitDiscount > 0 ? "Discount (incl. kit savings)" : "Discount", -order.summary.discount],
  ];
  if (order.summary.couponDiscount > 0)
    rows.push([
      `Coupon ${order.summary.couponCode}`,
      -order.summary.couponDiscount,
    ]);
  rows.push(["Shipping", order.summary.shipping]);
  if (order.summary.shipping === 0) rows[rows.length - 1][0] = "Shipping (free)";
  return [
    ...rows.map(
      ([label, value]) => `
      <tr>
        <td style="padding:4px 0;color:#b7a48e;font-size:13px;">${label}</td>
        <td style="padding:4px 0;text-align:right;color:${BODY_TEXT};font-size:13px;">${formatMoney(value)}</td>
      </tr>`,
    ),
    `<tr>
      <td style="padding:10px 0 0;color:${CHAMPAGNE};font-size:15px;font-weight:bold;">Total</td>
      <td style="padding:10px 0 0;text-align:right;color:${GOLD};font-size:15px;font-weight:bold;">${formatMoney(order.summary.total)}</td>
    </tr>`,
    order.summary.tax > 0
      ? `<tr>
      <td style="padding:2px 0;color:#b7a48e;font-size:11px;">Includes GST</td>
      <td style="padding:2px 0;text-align:right;color:#b7a48e;font-size:11px;">${formatMoney(order.summary.tax)}</td>
    </tr>`
      : "",
  ].join("");
};

const addressBlock = (order) => {
  const a = order.shippingAddress;
  return `
    <div style="margin-top:20px;padding:16px;background:#21150f;border:1px solid ${BORDER};border-radius:12px;color:${BODY_TEXT};font-size:13px;line-height:1.6;">
      <strong style="color:${CHAMPAGNE};">Shipping to</strong><br />
      ${escapeHtml(a.fullName)}<br />
      ${escapeHtml(a.line1)}${a.line2 ? `<br />${escapeHtml(a.line2)}` : ""}<br />
      ${escapeHtml(a.city)}, ${escapeHtml(a.state)} ${escapeHtml(a.pincode)}<br />
      ${escapeHtml(a.phone)}
    </div>`;
};

const orderTable = (order) => `
  <table style="width:100%;border-collapse:collapse;margin-bottom:8px;">
    <tbody>${itemRows(order)}</tbody>
  </table>
  <table style="width:100%;border-collapse:collapse;">
    <tbody>${summaryRows(order)}</tbody>
  </table>`;

const orderConfirmation = (order) => {
  const isUpi = order.paymentMethod === "UPI";
  const paymentLabel = isUpi ? "UPI / QR" : "Cash on Delivery";
  const heading = `Order ${order.orderNumber} confirmed`;
  const intro = `Hi ${escapeHtml(order.shippingAddress.fullName)}, thanks for your order. We are preparing it now.`;
  const body = `
    <p style="margin:0 0 16px;font-size:13px;color:#b7a48e;">Payment method: <strong style="color:${BODY_TEXT};">${paymentLabel}</strong></p>
    ${
      isUpi
        ? `<p style="margin:0 0 16px;font-size:13px;color:#b7a48e;">Your payment is pending. Open your order page and scan the QR with PhonePe, Google Pay, Paytm or any UPI app.</p>`
        : ""
    }
    ${orderTable(order)}
    ${addressBlock(order)}
    <div style="text-align:center;margin-top:24px;">${button(orderUrl(order), isUpi ? "Pay / view order" : "View order")}</div>`;

  return {
    subject: `Order ${order.orderNumber} confirmed – ${BRAND}`,
    html: layout({ heading, intro, body }),
    text: [
      `Hi ${order.shippingAddress.fullName},`,
      "",
      `Your order ${order.orderNumber} is confirmed.`,
      ...order.items.map(
        (item) => `- ${item.name} x ${item.quantity}: ${formatMoney(item.price * item.quantity)}`,
      ),
      "",
      `Total: ${formatMoney(order.summary.total)} (${paymentLabel})`,
      isUpi ? "Payment is pending. Open your order page to scan the UPI QR code." : "",
      `View your order: ${orderUrl(order)}`,
    ]
      .filter(Boolean)
      .join("\n"),
  };
};

const adminNewOrder = (order) => {
  const paymentLabel = order.paymentMethod === "UPI" ? "UPI / QR" : "Cash on Delivery";
  const heading = `New order ${order.orderNumber}`;
  const intro = `${escapeHtml(order.shippingAddress.fullName)} placed an order for ${formatMoney(
    order.summary.total,
  )} (${paymentLabel}).`;
  const body = `
    ${orderTable(order)}
    ${addressBlock(order)}
    <div style="text-align:center;margin-top:24px;">${button(`${env.clientUrl}/admin/orders/${order._id}`, "Open in admin")}</div>`;

  return {
    subject: `New order ${order.orderNumber} – ${formatMoney(order.summary.total)}`,
    html: layout({ heading, intro, body }),
    text: `New order ${order.orderNumber} from ${order.shippingAddress.fullName} for ${formatMoney(
      order.summary.total,
    )} (${paymentLabel}).`,
  };
};

const paymentReceived = (order, note = "") => {
  const heading = `Payment received for ${order.orderNumber}`;
  const intro = `We have confirmed your payment of ${formatMoney(
    order.summary.total,
  )}. Your order is being prepared.${note ? ` ${escapeHtml(note)}` : ""}`;
  const body = `
    ${orderTable(order)}
    <div style="text-align:center;margin-top:24px;">${button(orderUrl(order), "View order")}</div>`;

  return {
    subject: `Payment received – ${order.orderNumber} – ${BRAND}`,
    html: layout({ heading, intro, body }),
    text: [
      `Payment of ${formatMoney(order.summary.total)} received for order ${order.orderNumber}.`,
      note,
      `View your order: ${orderUrl(order)}`,
    ]
      .filter(Boolean)
      .join("\n"),
  };
};

const orderStatus = (order, status, note = "") => {
  const heading = `Order ${order.orderNumber} – ${statusLabel(status)}`;
  const intro = `${STATUS_MESSAGES[status] || `Your order status is now ${status}.`}${
    note ? ` ${escapeHtml(note)}` : ""
  }`;
  const body = `
    ${orderTable(order)}
    <div style="text-align:center;margin-top:24px;">${button(orderUrl(order), "Track order")}</div>`;

  return {
    subject: `Order ${order.orderNumber}: ${statusLabel(status)} – ${BRAND}`,
    html: layout({ heading, intro, body }),
    text: [
      `Order ${order.orderNumber}: ${statusLabel(status)}`,
      STATUS_MESSAGES[status] || "",
      note,
      `Total: ${formatMoney(order.summary.total)}`,
      `Track your order: ${orderUrl(order)}`,
    ]
      .filter(Boolean)
      .join("\n"),
  };
};

const passwordReset = (user, resetUrl) => {
  const heading = "Reset your password";
  const intro = `Hi ${escapeHtml(user.name)}, we received a request to reset your ${BRAND} password. This link expires in 1 hour.`;
  const body = `
    <div style="text-align:center;margin-top:8px;">${button(resetUrl, "Reset password")}</div>
    <p style="margin:24px 0 0;font-size:12px;color:#b7a48e;line-height:1.6;">
      If you did not request this, you can safely ignore this email. Your password will not change.
    </p>`;

  return {
    subject: `Reset your ${BRAND} password`,
    html: layout({ heading, intro, body }),
    text: [
      `Hi ${user.name},`,
      "",
      `Reset your ${BRAND} password (valid for 1 hour):`,
      resetUrl,
      "",
      "If you did not request this, ignore this email.",
    ].join("\n"),
  };
};

module.exports = {
  orderConfirmation,
  adminNewOrder,
  orderStatus,
  paymentReceived,
  passwordReset,
};

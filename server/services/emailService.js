const env = require("../config/env");
const templates = require("./emailTemplates");

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";
const RESEND_ENDPOINT = "https://api.resend.com/emails";

const providerName = () => {
  if (env.mail.brevoApiKey) return "brevo";
  if (env.mail.resendApiKey) return "resend";
  return null;
};

/**
 * Sends a single transactional email through Brevo or Resend (whichever key is set).
 * Never throws: failures are logged so they cannot break checkout or auth flows.
 */
async function sendEmail({ to, subject, html, text }) {
  if (!to) return { skipped: true, reason: "no-recipient" };
  if (env.nodeEnv === "test") return { skipped: true, reason: "test" };

  const provider = providerName();
  if (!provider) {
    console.log(`[email] not configured – skipped "${subject}" to ${to}`);
    return { skipped: true, reason: "not-configured" };
  }

  const fromEmail = env.mail.fromEmail;
  const fromName = env.mail.fromName;

  try {
    let response;
    if (provider === "brevo") {
      response = await fetch(BREVO_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": env.mail.brevoApiKey,
        },
        body: JSON.stringify({
          sender: { email: fromEmail, name: fromName },
          to: [{ email: to }],
          subject,
          htmlContent: html,
          textContent: text,
        }),
      });
    } else {
      response = await fetch(RESEND_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.mail.resendApiKey}`,
        },
        body: JSON.stringify({
          from: `${fromName} <${fromEmail}>`,
          to: [to],
          subject,
          html,
          text,
        }),
      });
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      const message = `${provider} responded ${response.status}: ${detail.slice(0, 200)}`;
      console.error(`[email] ${message}`);
      return { ok: false, error: message };
    }
    return { ok: true };
  } catch (error) {
    console.error(`[email] failed to send "${subject}" to ${to}:`, error.message);
    return { ok: false, error: error.message };
  }
}

async function notifyOrderPlaced(order) {
  const customerEmail = order?.shippingAddress?.email;
  if (customerEmail) {
    const { subject, html, text } = templates.orderConfirmation(order);
    await sendEmail({ to: customerEmail, subject, html, text });
  }

  const adminEmail = env.mail.adminEmail;
  if (adminEmail && adminEmail !== customerEmail) {
    const { subject, html, text } = templates.adminNewOrder(order);
    await sendEmail({ to: adminEmail, subject, html, text });
  }
}

async function notifyOrderStatus(order, status, note = "") {
  const customerEmail = order?.shippingAddress?.email;
  if (!customerEmail) return;
  const { subject, html, text } = templates.orderStatus(order, status, note);
  await sendEmail({ to: customerEmail, subject, html, text });
}

async function notifyPaymentReceived(order, note = "") {
  const customerEmail = order?.shippingAddress?.email;
  if (!customerEmail) return;
  const { subject, html, text } = templates.paymentReceived(order, note);
  await sendEmail({ to: customerEmail, subject, html, text });
}

async function sendPasswordResetEmail(user, resetUrl) {
  if (!user?.email) return;
  const { subject, html, text } = templates.passwordReset(user, resetUrl);
  await sendEmail({ to: user.email, subject, html, text });
}

module.exports = {
  sendEmail,
  notifyOrderPlaced,
  notifyOrderStatus,
  notifyPaymentReceived,
  sendPasswordResetEmail,
};
